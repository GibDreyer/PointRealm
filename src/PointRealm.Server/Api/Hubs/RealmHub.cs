using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Api.Services;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Realtime;

namespace PointRealm.Server.Api.Hubs;

[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class RealmHub : Hub<IRealmClient>
{
    private readonly PointRealmDbContext _dbContext;
    private readonly RealmStateMapper _mapper;
    private readonly RealmCommandService _commandService;
    private readonly IRealmBroadcaster _broadcaster;

    public RealmHub(
        PointRealmDbContext dbContext,
        RealmStateMapper mapper,
        RealmCommandService commandService,
        IRealmBroadcaster broadcaster)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _commandService = commandService;
        _broadcaster = broadcaster;
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
        => await _commandService.SetDisplayNameAsync(await GetCommandContextAsync(), request);

    public async Task<CommandResultDto> SetAvatarEmoji(SetAvatarEmojiRequest request)
        => await _commandService.SetAvatarEmojiAsync(await GetCommandContextAsync(), request);

    public async Task<CommandResultDto> JoinPresence(JoinPresenceRequest request)
        => await _commandService.JoinPresenceAsync(await GetCommandContextAsync(), request);

    public async Task<CommandResultDto> LeavePresence(LeavePresenceRequest request)
        => await _commandService.LeavePresenceAsync(await GetCommandContextAsync(), request);

    public async Task<CommandResultDto> SelectRune(SelectRuneRequest request)
        => await _commandService.SelectRuneAsync(await GetCommandContextAsync(), request);

    public async Task<CommandResultDto> StartEncounter(StartEncounterRequest request)
        => await _commandService.StartEncounterAsync(await GetCommandContextAsync(), request);

    public async Task<CommandResultDto> RevealProphecy(RevealProphecyRequest request)
        => await _commandService.RevealProphecyAsync(await GetCommandContextAsync(), request);

    public async Task<CommandResultDto> ReRollFates(ReRollFatesRequest request)
        => await _commandService.ReRollFatesAsync(await GetCommandContextAsync(), request);

    public async Task<CommandResultDto> SealOutcome(SealOutcomeRequest request)
        => await _commandService.SealOutcomeAsync(await GetCommandContextAsync(), request);

    public async Task<CommandResultWithPayloadDto<Guid>> AddQuest(AddQuestRequest request)
        => await _commandService.AddQuestAsync(await GetCommandContextAsync(), request);

    public async Task<CommandResultDto> UpdateQuest(UpdateQuestRequest request)
        => await _commandService.UpdateQuestAsync(await GetCommandContextAsync(), request);

    public async Task<CommandResultDto> DeleteQuest(DeleteQuestRequest request)
        => await _commandService.DeleteQuestAsync(await GetCommandContextAsync(), request);

    public async Task<CommandResultDto> ReorderQuests(ReorderQuestsRequest request)
        => await _commandService.ReorderQuestsAsync(await GetCommandContextAsync(), request);

    public async Task<CommandResultDto> SetActiveQuest(SetActiveQuestRequest request)
        => await _commandService.SetActiveQuestAsync(await GetCommandContextAsync(), request);

    private async Task<RealmCommandContext> GetCommandContextAsync()
    {
        var (realmId, memberId, connectionId) = await GetCallerIdsAsync();
        return new RealmCommandContext(realmId, memberId, connectionId);
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
