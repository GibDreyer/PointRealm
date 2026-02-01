using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Application.Commands.Encounter;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using PointRealm.Server.Domain.Primitives;
using PointRealm.Shared.V1.Realtime;

namespace PointRealm.Server.Application.Commands.Handlers;

public class EncounterCommandHandler(
    IRealmRepository realmRepository,
    IRealmBroadcaster broadcaster,
    ICommandDeduplicator deduplicator)
    : ICommandHandler<SelectRuneCommand>,
      ICommandHandler<StartEncounterCommand>,
      ICommandHandler<RevealProphecyCommand>,
      ICommandHandler<ReRollFatesCommand>,
      ICommandHandler<SealOutcomeCommand>
{
    private const string StaleMessage = "Your realm view is out of date. Refreshing prophecy…";

    public async Task<CommandResultDto> HandleAsync(SelectRuneCommand request, CancellationToken cancellationToken = default)
    {
        return await ExecuteAsync(request.MemberId, request.RealmId, request.CommandId, request.ClientId, async (realm, member) =>
        {
            var encounter = realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId);
            if (encounter is null) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "NO_ENCOUNTER", Message = "No active encounter." });
            
            if (encounter.Version != request.EncounterVersion) return CreateStaleError();

             var card = realm.Settings.Deck.Cards.FirstOrDefault(c => 
                 string.Equals(c.Label, request.Value, StringComparison.OrdinalIgnoreCase) || 
                 (string.Equals(request.Value, "coffee", StringComparison.OrdinalIgnoreCase) && (c.Label == "coffee" || c.Label == "☕")));

             if (card is null) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "INVALID_RUNE", Message = "Select a valid rune." });

             var runeValue = new RuneCardValue(card.Label, card.Value);

             var result = encounter.CastVote(member.Id, runeValue);
            if (result.IsFailure) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = result.Error.Code, Message = result.Error.Description });

            if (realm.Settings.AutoReveal)
            {
                var activeMemberCount = realm.Members.Count(m => m.IsOnline && !m.IsObserver && !m.IsBanned);
                var voteCount = encounter.Votes.Count;
                if (voteCount >= activeMemberCount)
                {
                    encounter.Reveal();
                }
            }

            return CommandResultDto.Ok();
        }, cancellationToken);
    }

    public async Task<CommandResultDto> HandleAsync(StartEncounterCommand request, CancellationToken cancellationToken = default)
    {
        return await ExecuteAsync(request.MemberId, request.RealmId, request.CommandId, request.ClientId, async (realm, member) =>
        {
            if (!member.IsHost) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "FORBIDDEN", Message = "Only the GM can start encounters." });
            if (realm.Version != request.RealmVersion) return CreateStaleError();

            var quest = realm.Quests.FirstOrDefault(q => q.Id == request.QuestId);
            if (quest is null) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "NOT_FOUND", Message = "Quest not found." });

            var result = realm.StartEncounter(request.QuestId);
             if (result.IsFailure) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = result.Error.Code, Message = result.Error.Description });
            
            return CommandResultDto.Ok();
        }, cancellationToken);
    }
    
    public async Task<CommandResultDto> HandleAsync(RevealProphecyCommand request, CancellationToken cancellationToken = default)
    {
         return await ExecuteAsync(request.MemberId, request.RealmId, request.CommandId, request.ClientId, async (realm, member) =>
        {
            if (!member.IsHost) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "FORBIDDEN", Message = "Only the GM can reveal prophecies." });
            
            var encounter = realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId);
            if (encounter is null) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "NO_ENCOUNTER", Message = "No active encounter." });
            
            if (encounter.Version != request.EncounterVersion) return CreateStaleError();

            var result = encounter.Reveal();
            if (result.IsFailure) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = result.Error.Code, Message = result.Error.Description });

            return CommandResultDto.Ok();
        }, cancellationToken);
    }

    public async Task<CommandResultDto> HandleAsync(ReRollFatesCommand request, CancellationToken cancellationToken = default)
    {
         return await ExecuteAsync(request.MemberId, request.RealmId, request.CommandId, request.ClientId, async (realm, member) =>
        {
            if (!member.IsHost) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "FORBIDDEN", Message = "Only the GM can re-roll fates." });
            
            var encounter = realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId);
            if (encounter is null) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "NO_ENCOUNTER", Message = "No active encounter." });
            
            if (encounter.Version != request.EncounterVersion) return CreateStaleError();

            var result = encounter.ResetVotes(); 
             if (result.IsFailure) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = result.Error.Code, Message = result.Error.Description });

            return CommandResultDto.Ok();
        }, cancellationToken);
    }

    public async Task<CommandResultDto> HandleAsync(SealOutcomeCommand request, CancellationToken cancellationToken = default)
    {
         return await ExecuteAsync(request.MemberId, request.RealmId, request.CommandId, request.ClientId, async (realm, member) =>
        {
            if (!member.IsHost) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "FORBIDDEN", Message = "Only the GM can seal outcomes." });
            
            var encounter = realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId);
            if (encounter is null) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "NO_ENCOUNTER", Message = "No active encounter." });
            
            if (encounter.Version != request.EncounterVersion) return CreateStaleError();

             var sealResult = encounter.Seal(request.Outcome);
             if (sealResult.IsFailure) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = sealResult.Error.Code, Message = sealResult.Error.Description });

             var quest = realm.Quests.FirstOrDefault(q => q.Id == encounter.QuestId);
             if (quest != null)
             {
                 quest.SealOutcome(request.Outcome);
             }

            return CommandResultDto.Ok();
        }, cancellationToken);
    }

    private async Task<CommandResultDto> ExecuteAsync(
        Guid memberId,
        Guid realmId,
        Guid? commandId,
        string clientId,
        Func<Realm, PartyMember, Task<CommandResultDto>> action,
        CancellationToken cancellationToken)
    {
        if (commandId.HasValue && deduplicator.TryGetResult(memberId, commandId.Value, out var cached))
        {
            return (CommandResultDto)cached!;
        }

        var realm = await realmRepository.GetByIdWithRelationsAsync(realmId, cancellationToken);
        if (realm is null) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "REALM_NOT_FOUND", Message = "Realm not found." });

        var member = realm.Members.FirstOrDefault(m => m.Id == memberId);
        if (member is null) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "MEMBER_NOT_FOUND", Message = "Member not found." });

        if (member.IsBanned) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "FORBIDDEN", Message = "You are banned." });

        try
        {
            var result = await action(realm, member);
            
            if (result.Success)
            {
                await realmRepository.SaveChangesAsync(cancellationToken);
                if (commandId.HasValue) deduplicator.StoreResult(memberId, commandId.Value, result);
                await broadcaster.BroadcastRealmStateAsync(realmId);
            }
            else if (result.Error?.ErrorCode == "STALE_STATE")
            {
                await broadcaster.SendRealmStateToConnectionAsync(clientId, realmId);
            }
            
            return result;
        }
        catch (Exception ex)
        {
             if (ex.GetType().Name.Contains("Concurrency") || ex.Message.Contains("concurrency"))
             {
                 await broadcaster.BroadcastRealmStateAsync(realmId);
                 return CreateStaleError();
             }
            return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "Server.Error", Message = ex.Message });
        }
    }
    
    private static CommandResultDto CreateStaleError() => 
        CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "STALE_STATE", Message = StaleMessage });
}
