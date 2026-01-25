using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Realtime;

namespace PointRealm.Server.Api.Services;

public sealed record RealmCommandContext(Guid RealmId, Guid MemberId, string ConnectionId);

public sealed class RealmCommandService
{
    private const string StaleMessage = "Your realm view is out of date. Refreshing prophecy…";

    private readonly PointRealmDbContext _dbContext;
    private readonly IRealmBroadcaster _broadcaster;
    private readonly ICommandDeduplicator _deduplicator;

    public RealmCommandService(PointRealmDbContext dbContext, IRealmBroadcaster broadcaster, ICommandDeduplicator deduplicator)
    {
        _dbContext = dbContext;
        _broadcaster = broadcaster;
        _deduplicator = deduplicator;
    }

    public Task<CommandResultDto> SetDisplayNameAsync(RealmCommandContext context, SetDisplayNameRequest request)
    {
        return ExecuteAsync(context, request.CommandId, async (realm, member) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return CommandResultDto.Fail(CreateError("VALIDATION_ERROR", "Display name cannot be empty."));
            }

            member.UpdateName(request.Name.Trim());
            await SaveAndBroadcastAsync(realm.Id);
            return CommandResultDto.Ok();
        });
    }

    public Task<CommandResultDto> JoinPresenceAsync(RealmCommandContext context, JoinPresenceRequest request)
    {
        return ExecuteAsync(context, request.CommandId, async (realm, member) =>
        {
            member.SetOnline(true);
            await SaveAndBroadcastAsync(realm.Id);
            return CommandResultDto.Ok();
        });
    }

    public Task<CommandResultDto> LeavePresenceAsync(RealmCommandContext context, LeavePresenceRequest request)
    {
        return ExecuteAsync(context, request.CommandId, async (realm, member) =>
        {
            member.SetOnline(false);
            await SaveAndBroadcastAsync(realm.Id);
            return CommandResultDto.Ok();
        });
    }

    public Task<CommandResultDto> SelectRuneAsync(RealmCommandContext context, SelectRuneRequest request)
    {
        return ExecuteAsync(context, request.CommandId, async (realm, member) =>
        {
            if (member.IsObserver)
            {
                return CommandResultDto.Fail(CreateError("FORBIDDEN", "Observers cannot cast runes."));
            }

            if (realm.CurrentEncounterId == null)
            {
                return CommandResultDto.Fail(CreateError("INVALID_STATE", "No active encounter."));
            }

            var encounter = realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId);
            if (encounter == null)
            {
                return CommandResultDto.Fail(CreateError("NOT_FOUND", "Encounter not found."));
            }

            if (encounter.Version != request.EncounterVersion)
            {
                return await HandleStaleAsync(realm, context);
            }

            if (encounter.Status == EncounterStatus.Revealed)
            {
                return CommandResultDto.Fail(CreateError("INVALID_STATE", "Votes cannot be cast after the prophecy is revealed."));
            }

            if (!realm.Settings.AllowAbstain && request.Value == "?")
            {
                return CommandResultDto.Fail(CreateError("VALIDATION_ERROR", "Abstaining is not allowed in this realm."));
            }

            if (!IsValidRuneValue(realm.Settings.Deck, request.Value))
            {
                return CommandResultDto.Fail(CreateError("VALIDATION_ERROR", "That rune is not part of this deck."));
            }

            var runeValue = new RuneCardValue(request.Value, null);
            var result = encounter.CastVote(member.Id, runeValue);
            if (result.IsFailure)
            {
                return CommandResultDto.Fail(CreateError("INVALID_STATE", result.Error.Description));
            }

            if (realm.Settings.AutoReveal && encounter.Status == EncounterStatus.Voting)
            {
                var eligibleMembers = realm.Members.Where(m => !m.IsObserver && !m.IsBanned).ToList();
                var allVoted = eligibleMembers.All(m => encounter.Votes.Any(v => v.PartyMemberId == m.Id));
                if (allVoted)
                {
                    encounter.Reveal();
                }
            }

            await SaveAndBroadcastAsync(realm.Id);
            return CommandResultDto.Ok();
        });
    }

    public Task<CommandResultDto> StartEncounterAsync(RealmCommandContext context, StartEncounterRequest request)
    {
        return ExecuteAsync(context, request.CommandId, async (realm, member) =>
        {
            if (!member.IsHost)
            {
                return CommandResultDto.Fail(CreateError("FORBIDDEN", "Only the GM can start an encounter."));
            }

            if (realm.Version != request.RealmVersion)
            {
                return await HandleStaleAsync(realm, context);
            }

            var quest = realm.Quests.FirstOrDefault(q => q.Id == request.QuestId);
            if (quest == null)
            {
                return CommandResultDto.Fail(CreateError("NOT_FOUND", "Quest not found."));
            }

            if (quest.Version != request.QuestVersion)
            {
                return await HandleStaleAsync(realm, context);
            }

            var result = realm.StartEncounter(request.QuestId);
            if (result.IsFailure)
            {
                return CommandResultDto.Fail(CreateError("INVALID_STATE", result.Error.Description));
            }

            await SaveAndBroadcastAsync(realm.Id);
            return CommandResultDto.Ok();
        });
    }

    public Task<CommandResultDto> RevealProphecyAsync(RealmCommandContext context, RevealProphecyRequest request)
    {
        return ExecuteAsync(context, request.CommandId, async (realm, member) =>
        {
            if (!member.IsHost)
            {
                return CommandResultDto.Fail(CreateError("FORBIDDEN", "Only the GM can reveal the prophecy."));
            }

            if (realm.CurrentEncounterId == null)
            {
                return CommandResultDto.Fail(CreateError("INVALID_STATE", "No active encounter."));
            }

            var encounter = realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId);
            if (encounter == null)
            {
                return CommandResultDto.Fail(CreateError("NOT_FOUND", "Encounter not found."));
            }

            if (encounter.Version != request.EncounterVersion)
            {
                return await HandleStaleAsync(realm, context);
            }

            if (encounter.Status == EncounterStatus.Revealed)
            {
                return CommandResultDto.Ok();
            }

            var result = encounter.Reveal();
            if (result.IsFailure)
            {
                return CommandResultDto.Fail(CreateError("INVALID_STATE", result.Error.Description));
            }

            await SaveAndBroadcastAsync(realm.Id);
            return CommandResultDto.Ok();
        });
    }

    public Task<CommandResultDto> ReRollFatesAsync(RealmCommandContext context, ReRollFatesRequest request)
    {
        return ExecuteAsync(context, request.CommandId, async (realm, member) =>
        {
            if (!member.IsHost)
            {
                return CommandResultDto.Fail(CreateError("FORBIDDEN", "Only the GM can re-roll the fates."));
            }

            if (realm.CurrentEncounterId == null)
            {
                return CommandResultDto.Fail(CreateError("INVALID_STATE", "No active encounter."));
            }

            var encounter = realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId);
            if (encounter == null)
            {
                return CommandResultDto.Fail(CreateError("NOT_FOUND", "Encounter not found."));
            }

            if (encounter.Version != request.EncounterVersion)
            {
                return await HandleStaleAsync(realm, context);
            }

            var result = encounter.ResetVotes();
            if (result.IsFailure)
            {
                return CommandResultDto.Fail(CreateError("INVALID_STATE", result.Error.Description));
            }

            await SaveAndBroadcastAsync(realm.Id);
            return CommandResultDto.Ok();
        });
    }

    public Task<CommandResultDto> SealOutcomeAsync(RealmCommandContext context, SealOutcomeRequest request)
    {
        return ExecuteAsync(context, request.CommandId, async (realm, member) =>
        {
            if (!member.IsHost)
            {
                return CommandResultDto.Fail(CreateError("FORBIDDEN", "Only the GM can seal the outcome."));
            }

            if (realm.CurrentEncounterId == null)
            {
                return CommandResultDto.Fail(CreateError("INVALID_STATE", "No active encounter."));
            }

            var encounter = realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId);
            if (encounter == null)
            {
                return CommandResultDto.Fail(CreateError("NOT_FOUND", "Encounter not found."));
            }

            if (encounter.Version != request.EncounterVersion)
            {
                return await HandleStaleAsync(realm, context);
            }

            if (encounter.Status != EncounterStatus.Revealed)
            {
                return CommandResultDto.Fail(CreateError("INVALID_STATE", "Reveal the prophecy before sealing an outcome."));
            }

            if (!IsValidOutcome(realm.Settings.Deck, request.FinalValue))
            {
                return CommandResultDto.Fail(CreateError("VALIDATION_ERROR", "That outcome does not exist in the deck."));
            }

            var result = encounter.Seal(request.FinalValue);
            if (result.IsFailure)
            {
                return CommandResultDto.Fail(CreateError("INVALID_STATE", result.Error.Description));
            }

            var quest = realm.Quests.FirstOrDefault(q => q.Id == encounter.QuestId);
            if (quest != null)
            {
                quest.SealOutcome(request.FinalValue);
            }

            await SaveAndBroadcastAsync(realm.Id);
            return CommandResultDto.Ok();
        });
    }

    public Task<CommandResultWithPayloadDto<Guid>> AddQuestAsync(RealmCommandContext context, AddQuestRequest request)
    {
        return ExecuteAsync(context, request.CommandId, async (realm, member) =>
        {
            if (!member.IsHost)
            {
                return CommandResultWithPayloadDto<Guid>.Fail(CreateError("FORBIDDEN", "Only the GM can add quests."));
            }

            if (realm.QuestLogVersion != request.QuestLogVersion)
            {
                return await HandleStaleAsync<Guid>(realm, context);
            }

            var result = realm.AddQuest(request.Title, request.Description);
            if (result.IsFailure)
            {
                return CommandResultWithPayloadDto<Guid>.Fail(CreateError("VALIDATION_ERROR", result.Error.Description));
            }

            await SaveAndBroadcastAsync(realm.Id);
            return CommandResultWithPayloadDto<Guid>.Ok(result.Value);
        });
    }

    public Task<CommandResultDto> UpdateQuestAsync(RealmCommandContext context, UpdateQuestRequest request)
    {
        return ExecuteAsync(context, request.CommandId, async (realm, member) =>
        {
            if (!member.IsHost)
            {
                return CommandResultDto.Fail(CreateError("FORBIDDEN", "Only the GM can update quests."));
            }

            var quest = realm.Quests.FirstOrDefault(q => q.Id == request.QuestId);
            if (quest == null)
            {
                return CommandResultDto.Fail(CreateError("NOT_FOUND", "Quest not found."));
            }

            if (quest.Version != request.QuestVersion)
            {
                return await HandleStaleAsync(realm, context);
            }

            var result = realm.UpdateQuest(request.QuestId, request.Title, request.Description);
            if (result.IsFailure)
            {
                return CommandResultDto.Fail(CreateError("VALIDATION_ERROR", result.Error.Description));
            }

            await SaveAndBroadcastAsync(realm.Id);
            return CommandResultDto.Ok();
        });
    }

    public Task<CommandResultDto> DeleteQuestAsync(RealmCommandContext context, DeleteQuestRequest request)
    {
        return ExecuteAsync(context, request.CommandId, async (realm, member) =>
        {
            if (!member.IsHost)
            {
                return CommandResultDto.Fail(CreateError("FORBIDDEN", "Only the GM can delete quests."));
            }

            if (realm.QuestLogVersion != request.QuestLogVersion)
            {
                return await HandleStaleAsync(realm, context);
            }

            var quest = realm.Quests.FirstOrDefault(q => q.Id == request.QuestId);
            if (quest == null)
            {
                return CommandResultDto.Fail(CreateError("NOT_FOUND", "Quest not found."));
            }

            if (quest.Version != request.QuestVersion)
            {
                return await HandleStaleAsync(realm, context);
            }

            var result = realm.DeleteQuest(request.QuestId);
            if (result.IsFailure)
            {
                return CommandResultDto.Fail(CreateError("VALIDATION_ERROR", result.Error.Description));
            }

            await SaveAndBroadcastAsync(realm.Id);
            return CommandResultDto.Ok();
        });
    }

    public Task<CommandResultDto> ReorderQuestsAsync(RealmCommandContext context, ReorderQuestsRequest request)
    {
        return ExecuteAsync(context, request.CommandId, async (realm, member) =>
        {
            if (!member.IsHost)
            {
                return CommandResultDto.Fail(CreateError("FORBIDDEN", "Only the GM can reorder quests."));
            }

            if (realm.QuestLogVersion != request.QuestLogVersion)
            {
                return await HandleStaleAsync(realm, context);
            }

            var result = realm.ReorderQuests(request.NewOrder);
            if (result.IsFailure)
            {
                return CommandResultDto.Fail(CreateError("VALIDATION_ERROR", result.Error.Description));
            }

            await SaveAndBroadcastAsync(realm.Id);
            return CommandResultDto.Ok();
        });
    }

    public Task<CommandResultDto> SetActiveQuestAsync(RealmCommandContext context, SetActiveQuestRequest request)
    {
        return ExecuteAsync(context, request.CommandId, async (realm, member) =>
        {
            if (!member.IsHost)
            {
                return CommandResultDto.Fail(CreateError("FORBIDDEN", "Only the GM can set the active quest."));
            }

            if (realm.QuestLogVersion != request.QuestLogVersion)
            {
                return await HandleStaleAsync(realm, context);
            }

            var result = realm.SetActiveQuest(request.QuestId);
            if (result.IsFailure)
            {
                return CommandResultDto.Fail(CreateError("VALIDATION_ERROR", result.Error.Description));
            }

            await SaveAndBroadcastAsync(realm.Id);
            return CommandResultDto.Ok();
        });
    }

    private async Task<CommandResultDto> ExecuteAsync(
        RealmCommandContext context,
        Guid? commandId,
        Func<Realm, PartyMember, Task<CommandResultDto>> execute)
    {
        if (commandId.HasValue && _deduplicator.TryGetResult(context.MemberId, commandId.Value, out _))
        {
            return CommandResultDto.Ok();
        }

        var (realm, member, error) = await LoadRealmAndMemberAsync(context);
        if (error is not null)
        {
            return CommandResultDto.Fail(error);
        }

        try
        {
            var result = await execute(realm!, member!);
            if (commandId.HasValue && result.Success)
            {
                _deduplicator.StoreResult(context.MemberId, commandId.Value, null);
            }
            return result;
        }
        catch (DbUpdateConcurrencyException)
        {
            return await HandleStaleAsync(realm!, context);
        }
    }

    private async Task<CommandResultWithPayloadDto<T>> ExecuteAsync<T>(
        RealmCommandContext context,
        Guid? commandId,
        Func<Realm, PartyMember, Task<CommandResultWithPayloadDto<T>>> execute)
    {
        if (commandId.HasValue && _deduplicator.TryGetResult(context.MemberId, commandId.Value, out var payload))
        {
            if (payload is T typedPayload)
            {
                return CommandResultWithPayloadDto<T>.Ok(typedPayload);
            }
            return CommandResultWithPayloadDto<T>.Ok(default!);
        }

        var (realm, member, error) = await LoadRealmAndMemberAsync(context);
        if (error is not null)
        {
            return CommandResultWithPayloadDto<T>.Fail(error);
        }

        try
        {
            var result = await execute(realm!, member!);
            if (commandId.HasValue && result.Success)
            {
                _deduplicator.StoreResult(context.MemberId, commandId.Value, result.Payload);
            }
            return result;
        }
        catch (DbUpdateConcurrencyException)
        {
            return await HandleStaleAsync<T>(realm!, context);
        }
    }

    private async Task<(Realm? realm, PartyMember? member, CommandErrorDto? error)> LoadRealmAndMemberAsync(RealmCommandContext context)
    {
        var realm = await _dbContext.Realms
            .Include(r => r.Members)
            .Include(r => r.Quests)
            .Include(r => r.Encounters).ThenInclude(e => e.Votes)
            .FirstOrDefaultAsync(r => r.Id == context.RealmId);

        if (realm is null)
        {
            return (null, null, CreateError("NOT_FOUND", "Realm not found."));
        }

        var member = realm.Members.FirstOrDefault(m => m.Id == context.MemberId);
        if (member is null)
        {
            return (realm, null, CreateError("NOT_FOUND", "Member not found in realm."));
        }

        if (member.IsBanned)
        {
            return (realm, member, CreateError("FORBIDDEN", "You have been banished from this realm."));
        }

        return (realm, member, null);
    }

    private async Task SaveAndBroadcastAsync(Guid realmId)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();
        await _broadcaster.BroadcastRealmStateAsync(realmId);
    }

    private async Task<CommandResultDto> HandleStaleAsync(Realm realm, RealmCommandContext context)
    {
        await _broadcaster.SendRealmStateToConnectionAsync(context.ConnectionId, realm.Id);
        return CommandResultDto.Fail(CreateStaleError(realm.Code));
    }

    private async Task<CommandResultWithPayloadDto<T>> HandleStaleAsync<T>(Realm realm, RealmCommandContext context)
    {
        await _broadcaster.SendRealmStateToConnectionAsync(context.ConnectionId, realm.Id);
        return CommandResultWithPayloadDto<T>.Fail(CreateStaleError(realm.Code));
    }

    private static CommandErrorDto CreateError(string code, string message, string? details = null)
    {
        return new CommandErrorDto
        {
            ErrorCode = code,
            Message = message,
            Details = details
        };
    }

    private static CommandErrorDto CreateStaleError(string realmCode)
    {
        return new CommandErrorDto
        {
            ErrorCode = "STALE_STATE",
            Message = StaleMessage,
            RealmCode = realmCode,
            ServerNow = DateTime.UtcNow
        };
    }

    private static bool IsValidRuneValue(RuneDeck deck, string value)
    {
        if (string.Equals(value, "coffee", StringComparison.OrdinalIgnoreCase))
        {
            return deck.Cards.Any(card => card.Label == "coffee" || card.Label == "â˜•");
        }

        return deck.Cards.Any(card => string.Equals(card.Label, value, StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsValidOutcome(RuneDeck deck, int finalValue)
    {
        return deck.Cards.Any(card => card.Value.HasValue && (int)card.Value.Value == finalValue);
    }
}
