using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Application.Commands.Quest;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using PointRealm.Server.Domain.Primitives;
using PointRealm.Shared.V1.Realtime;

namespace PointRealm.Server.Application.Commands.Handlers;

public class QuestCommandHandler(
    IRealmRepository realmRepository,
    IRealmBroadcaster broadcaster,
    ICommandDeduplicator deduplicator)
    : ICommandHandler<AddQuestCommand, CommandResultWithPayloadDto<Guid>>,
      ICommandHandler<UpdateQuestCommand>,
      ICommandHandler<DeleteQuestCommand>,
      ICommandHandler<ReorderQuestsCommand>,
      ICommandHandler<SetActiveQuestCommand>
{
    private const string StaleMessage = "Your realm view is out of date. Refreshing prophecy…";

    public async Task<CommandResultWithPayloadDto<Guid>> HandleAsync(AddQuestCommand request, CancellationToken cancellationToken = default)
    {
        if (request.CommandId.HasValue && deduplicator.TryGetResult(request.MemberId, request.CommandId.Value, out var cached))
        {
            return (CommandResultWithPayloadDto<Guid>)cached!;
        }

        var realm = await realmRepository.GetByIdWithRelationsAsync(request.RealmId, cancellationToken);
        if (realm is null) return CommandResultWithPayloadDto<Guid>.Fail(new CommandErrorDto { ErrorCode = "NOT_FOUND", Message = "Realm not found." });

        var member = realm.Members.FirstOrDefault(m => m.Id == request.MemberId);
        if (member is null) return CommandResultWithPayloadDto<Guid>.Fail(new CommandErrorDto { ErrorCode = "NOT_FOUND", Message = "Member not found." });

        if (!member.IsHost) return CommandResultWithPayloadDto<Guid>.Fail(new CommandErrorDto { ErrorCode = "FORBIDDEN", Message = "Only the GM can manage quests." });
        if (realm.QuestLogVersion != request.QuestLogVersion) 
        {
            await broadcaster.BroadcastRealmStateAsync(request.RealmId);
            return CommandResultWithPayloadDto<Guid>.Fail(new CommandErrorDto { ErrorCode = "STALE_STATE", Message = StaleMessage });
        }

        try
        {
            var result = realm.AddQuest(request.Title, request.Description, request.ExternalId, request.ExternalUrl);
            if (result.IsFailure) return CommandResultWithPayloadDto<Guid>.Fail(new CommandErrorDto { ErrorCode = result.Error.Code, Message = result.Error.Description });
            
            await realmRepository.SaveChangesAsync(cancellationToken);
            var questId = result.Value;

            if (request.CommandId.HasValue) deduplicator.StoreResult(request.MemberId, request.CommandId.Value, CommandResultWithPayloadDto<Guid>.Ok(questId));
            await broadcaster.BroadcastRealmStateAsync(request.RealmId);
            
            return CommandResultWithPayloadDto<Guid>.Ok(questId);
        }
        catch (Exception ex)
        {
             if (ex.GetType().Name.Contains("Concurrency") || ex.Message.Contains("concurrency"))
             {
                 await broadcaster.BroadcastRealmStateAsync(request.RealmId);
                 return CommandResultWithPayloadDto<Guid>.Fail(new CommandErrorDto { ErrorCode = "STALE_STATE", Message = StaleMessage });
             }
            return CommandResultWithPayloadDto<Guid>.Fail(new CommandErrorDto { ErrorCode = "Server.Error", Message = ex.Message });
        }
    }

    public async Task<CommandResultDto> HandleAsync(UpdateQuestCommand request, CancellationToken cancellationToken = default)
    {
        return await ExecuteAsync(request.MemberId, request.RealmId, request.CommandId, request.ClientId, async (realm, member) =>
        {
            if (!member.IsHost) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "FORBIDDEN", Message = "Only the GM can manage quests." });

            var quest = realm.Quests.FirstOrDefault(q => q.Id == request.QuestId);
            if (quest is null) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "NOT_FOUND", Message = "Quest not found." });
            
            if (quest.Version != request.QuestVersion) return CreateStaleError();

            var result = realm.UpdateQuest(request.QuestId, request.Title, request.Description, request.ExternalId, request.ExternalUrl);
            if (result.IsFailure) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = result.Error.Code, Message = result.Error.Description });
            
            return CommandResultDto.Ok();
        }, cancellationToken);
    }

    public async Task<CommandResultDto> HandleAsync(DeleteQuestCommand request, CancellationToken cancellationToken = default)
    {
        return await ExecuteAsync(request.MemberId, request.RealmId, request.CommandId, request.ClientId, async (realm, member) =>
        {
            if (!member.IsHost) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "FORBIDDEN", Message = "Only the GM can manage quests." });
            if (realm.QuestLogVersion != request.QuestLogVersion) return CreateStaleError();

            var result = realm.DeleteQuest(request.QuestId);
             if (result.IsFailure) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = result.Error.Code, Message = result.Error.Description });
            
            return CommandResultDto.Ok();
        }, cancellationToken);
    }

    public async Task<CommandResultDto> HandleAsync(ReorderQuestsCommand request, CancellationToken cancellationToken = default)
    {
        return await ExecuteAsync(request.MemberId, request.RealmId, request.CommandId, request.ClientId, async (realm, member) =>
        {
            if (!member.IsHost) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "FORBIDDEN", Message = "Only the GM can manage quests." });
            if (realm.QuestLogVersion != request.QuestLogVersion) return CreateStaleError();

            var result = realm.ReorderQuests(request.QuestIds);
            if (result.IsFailure) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = result.Error.Code, Message = result.Error.Description });
            
            return CommandResultDto.Ok();
        }, cancellationToken);
    }

    public async Task<CommandResultDto> HandleAsync(SetActiveQuestCommand request, CancellationToken cancellationToken = default)
    {
        return await ExecuteAsync(request.MemberId, request.RealmId, request.CommandId, request.ClientId, async (realm, member) =>
        {
            if (!member.IsHost) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "FORBIDDEN", Message = "Only the GM can manage quests." });
            
            var result = realm.SetActiveQuest(request.QuestId);
            if (result.IsFailure) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = result.Error.Code, Message = result.Error.Description });
            
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
