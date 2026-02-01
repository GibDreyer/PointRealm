using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Application.Commands;
using PointRealm.Server.Application.Commands.Encounter;
using PointRealm.Server.Application.Commands.Handlers;
using PointRealm.Server.Application.Commands.Member;
using PointRealm.Server.Application.Commands.Quest;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Realtime;

namespace PointRealm.Server.Api.Hubs;

[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class RealmHub : Hub<IRealmClient>
{
    private readonly PointRealmDbContext _dbContext;
    private readonly IRealmStateMapper _mapper;
    private readonly IRealmBroadcaster _broadcaster;
    private readonly MemberCommandHandler _memberHandler;
    private readonly EncounterCommandHandler _encounterHandler;
    private readonly QuestCommandHandler _questHandler;

    public RealmHub(
        PointRealmDbContext dbContext,
        IRealmStateMapper mapper,
        IRealmBroadcaster broadcaster,
        MemberCommandHandler memberHandler,
        EncounterCommandHandler encounterHandler,
        QuestCommandHandler questHandler)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _broadcaster = broadcaster;
        _memberHandler = memberHandler;
        _encounterHandler = encounterHandler;
        _questHandler = questHandler;
    }

    public override async Task OnConnectedAsync()
    {
        var memberIdStr = Context.User?.FindFirst("memberId")?.Value;
        var realmIdStr = Context.User?.FindFirst("realmId")?.Value;

        if (!string.IsNullOrEmpty(realmIdStr) && Guid.TryParse(realmIdStr, out var realmId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, realmIdStr);

            Context.Items["RealmId"] = realmIdStr;
            Context.Items["MemberId"] = memberIdStr;

            if (!string.IsNullOrEmpty(memberIdStr) && Guid.TryParse(memberIdStr, out var memberId))
            {
                var realm = await LoadRealmAsync(realmId);
                if (realm != null)
                {
                    var member = realm.Members.FirstOrDefault(m => m.Id == memberId);
                    if (member != null)
                    {
                        var snapshot = _mapper.MapToLobbySnapshot(realm, member);
                        await _broadcaster.SendRealmSnapshotToConnectionAsync(Context.ConnectionId, snapshot);
                    }
                }
            }
        }

        await base.OnConnectedAsync();
    }

    public async Task JoinRealm(string realmCode)
    {
        var (realmId, memberId, _) = await GetCallerIdsAsync();

        var realm = await _dbContext.Realms
            .Include(r => r.Members)
            .Include(r => r.Quests)
            .Include(r => r.Encounters).ThenInclude(e => e.Votes)
            .FirstOrDefaultAsync(r => r.Code == realmCode);

        if (realm == null)
        {
            throw new HubException("Realm not found.");
        }

        if (realm.Id != realmId)
        {
            throw new HubException("Token not valid for this realm.");
        }

        var member = realm.Members.FirstOrDefault(m => m.Id == memberId);
        if (member == null)
        {
            throw new HubException("Member not found in realm.");
        }

        Context.Items["RealmId"] = realm.Id.ToString();
        Context.Items["MemberId"] = member.Id.ToString();

        await Groups.AddToGroupAsync(Context.ConnectionId, realm.Id.ToString());

        var snapshot = _mapper.MapToLobbySnapshot(realm, member);
        await _broadcaster.SendRealmSnapshotToConnectionAsync(Context.ConnectionId, snapshot);
        await _broadcaster.SendRealmStateToConnectionAsync(Context.ConnectionId, realm.Id);
    }

    public async Task RequestFullSnapshot()
    {
        var (realmId, _, _) = await GetCallerIdsAsync();
        await _broadcaster.SendRealmStateToConnectionAsync(Context.ConnectionId, realmId);
    }

    public async Task<CommandResultDto> SetDisplayName(SetDisplayNameRequest request)
    {
        var ctx = await GetCommandContextAsync();
        return await _memberHandler.HandleAsync(new SetDisplayNameCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, request.Name, request.CommandId));
    }

    public async Task<CommandResultDto> SetAvatarEmoji(SetAvatarEmojiRequest request)
    {
        var ctx = await GetCommandContextAsync();
        return await _memberHandler.HandleAsync(new SetAvatarEmojiCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, request.Emoji, 0, request.CommandId));
    }

    public async Task<CommandResultDto> JoinPresence(JoinPresenceRequest request)
    {
        var ctx = await GetCommandContextAsync();
        return await _memberHandler.HandleAsync(new JoinPresenceCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId));
    }

    public async Task<CommandResultDto> LeavePresence(LeavePresenceRequest request)
    {
        var ctx = await GetCommandContextAsync();
        return await _memberHandler.HandleAsync(new LeavePresenceCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId));
    }

    public async Task<CommandResultDto> SelectRune(SelectRuneRequest request)
    {
        var ctx = await GetCommandContextAsync();
        return await _encounterHandler.HandleAsync(new SelectRuneCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, request.Value, request.EncounterVersion, request.CommandId));
    }

    public async Task<CommandResultDto> StartEncounter(StartEncounterRequest request)
    {
        var ctx = await GetCommandContextAsync();
        return await _encounterHandler.HandleAsync(new StartEncounterCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, request.QuestId, request.RealmVersion, request.QuestVersion, request.CommandId));
    }

    public async Task<CommandResultDto> RevealProphecy(RevealProphecyRequest request)
    {
        var ctx = await GetCommandContextAsync();
        return await _encounterHandler.HandleAsync(new RevealProphecyCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, request.EncounterVersion, request.CommandId));
    }

    public async Task<CommandResultDto> ReRollFates(ReRollFatesRequest request)
    {
        var ctx = await GetCommandContextAsync();
        return await _encounterHandler.HandleAsync(new ReRollFatesCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, request.EncounterVersion, request.CommandId));
    }

    public async Task<CommandResultDto> SealOutcome(SealOutcomeRequest request)
    {
        var ctx = await GetCommandContextAsync();
        return await _encounterHandler.HandleAsync(new SealOutcomeCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, request.FinalValue, request.EncounterVersion, request.CommandId));
    }

    public async Task<CommandResultWithPayloadDto<Guid>> AddQuest(AddQuestRequest request)
    {
        var ctx = await GetCommandContextAsync();
        return await _questHandler.HandleAsync(new AddQuestCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, request.Title, request.Description, null, null, request.QuestLogVersion, request.CommandId));
    }

    public async Task<CommandResultDto> UpdateQuest(UpdateQuestRequest request)
    {
        var ctx = await GetCommandContextAsync();
        return await _questHandler.HandleAsync(new UpdateQuestCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, request.QuestId, request.Title, request.Description, null, null, request.QuestVersion, request.CommandId));
    }

    public async Task<CommandResultDto> DeleteQuest(DeleteQuestRequest request)
    {
        var ctx = await GetCommandContextAsync();
        return await _questHandler.HandleAsync(new DeleteQuestCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, request.QuestId, request.QuestLogVersion, request.CommandId));
    }

    public async Task<CommandResultDto> ReorderQuests(ReorderQuestsRequest request)
    {
        var ctx = await GetCommandContextAsync();
        return await _questHandler.HandleAsync(new ReorderQuestsCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, request.NewOrder, request.QuestLogVersion, request.CommandId));
    }

    public async Task<CommandResultDto> SetActiveQuest(SetActiveQuestRequest request)
    {
        var ctx = await GetCommandContextAsync();
        return await _questHandler.HandleAsync(new SetActiveQuestCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, request.QuestId, request.QuestLogVersion, request.CommandId));
    }

    private async Task<RealmCommandContext> GetCommandContextAsync()
    {
        var (realmId, memberId, connectionId) = await GetCallerIdsAsync();
        return new RealmCommandContext(memberId, realmId, connectionId);
    }

    private async Task<(Guid realmId, Guid memberId, string connectionId)> GetCallerIdsAsync()
    {
        var realmId = Guid.Empty;
        var memberId = Guid.Empty;

        if (Context.Items.TryGetValue("RealmId", out var rIdObj) && rIdObj is string rIdStr && Guid.TryParse(rIdStr, out realmId))
        {
        }
        else if (Guid.TryParse(Context.User?.FindFirst("realmId")?.Value, out var claimRealmId))
        {
            realmId = claimRealmId;
        }
        else
        {
            throw new HubException("Context Realm ID missing. Please join.");
        }

        if (Context.Items.TryGetValue("MemberId", out var mIdObj) && mIdObj is string mIdStr && Guid.TryParse(mIdStr, out memberId))
        {
        }
        else if (Guid.TryParse(Context.User?.FindFirst("memberId")?.Value, out var claimMemberId))
        {
            memberId = claimMemberId;
        }
        else
        {
            throw new HubException("Member context invalid.");
        }

        return (realmId, memberId, Context.ConnectionId);
    }

    private Task<Domain.Entities.Realm?> LoadRealmAsync(Guid realmId)
    {
        return _dbContext.Realms
            .Include(r => r.Members)
            .Include(r => r.Quests)
            .Include(r => r.Encounters).ThenInclude(e => e.Votes)
            .FirstOrDefaultAsync(r => r.Id == realmId);
    }
}
