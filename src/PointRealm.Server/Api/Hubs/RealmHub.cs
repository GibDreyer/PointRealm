using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;
using PointRealm.Shared.V1.Realtime;

namespace PointRealm.Server.Api.Hubs;

[Authorize]
public class RealmHub : Hub<IRealmClient>
{
    private readonly PointRealmDbContext _dbContext;

    public RealmHub(PointRealmDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public override async Task OnConnectedAsync()
    {
        // Reconnect logic: on hub connect, send full snapshot if user has realm context
        var realmIdStr = Context.User?.FindFirst("realmId")?.Value;
        if (!string.IsNullOrEmpty(realmIdStr) && Guid.TryParse(realmIdStr, out var realmId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, realmIdStr);
            await SendRealmStateToCallerAsync(realmId);
        }

        await base.OnConnectedAsync();
    }

    public async Task JoinRealm(string realmCode, Guid memberToken)
    {
        var realm = await _dbContext.Realms
            .Include(r => r.Members)
            .Include(r => r.Quests)
            .Include(r => r.Encounters).ThenInclude(e => e.Votes)
            .FirstOrDefaultAsync(r => r.Code == realmCode);

        if (realm == null) throw new HubException("Realm not found.");

        var member = realm.Members.FirstOrDefault(m => m.Id == memberToken);
        if (member == null) throw new HubException("Member not found.");

        Context.Items["RealmId"] = realm.Id.ToString();
        Context.Items["MemberId"] = member.Id.ToString();

        await Groups.AddToGroupAsync(Context.ConnectionId, realm.Id.ToString());

        // On any mutation, broadcast updated snapshot to the realm group
        await SendRealmStateAsync(realm.Id);
    }

    public async Task SetDisplayName(string name)
    {
        var (realm, member) = await GetCallerContextAsync();
        member.UpdateName(name);
        await _dbContext.SaveChangesAsync();
        await SendRealmStateAsync(realm.Id);
    }

    public async Task SelectRune(string value)
    {
        var (realm, member) = await GetCallerContextAsync();

        if (realm.CurrentEncounterId == null) throw new HubException("No active encounter.");
        var encounter = realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId);
        if (encounter == null) throw new HubException("Encounter not found.");

        var runeValue = new RuneCardValue(value, null);
        var result = encounter.CastVote(member.Id, runeValue);
        if (result.IsFailure) throw new HubException(result.Error.Description);

        await _dbContext.SaveChangesAsync();
        await SendRealmStateAsync(realm.Id); // Full snapshot on mutation
    }

    // GM Methods
    public async Task StartEncounter(Guid questId)
    {
        var (realm, member) = await GetCallerContextAsync();
        EnsureGM(member);

        var result = realm.StartEncounter(questId);
        if (result.IsFailure) throw new HubException(result.Error.Description);

        await _dbContext.SaveChangesAsync();
        await SendRealmStateAsync(realm.Id);
    }

    public async Task RevealProphecy()
    {
        var (realm, member) = await GetCallerContextAsync();
        EnsureGM(member);

        if (realm.CurrentEncounterId == null) throw new HubException("No active encounter.");
        var encounter = realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId);
        if (encounter == null) throw new HubException("Encounter not found.");

        var result = encounter.Reveal();
        if (result.IsFailure) throw new HubException(result.Error.Description);

        await _dbContext.SaveChangesAsync();
        await SendRealmStateAsync(realm.Id);
    }

    public async Task ReRollFates()
    {
        var (realm, member) = await GetCallerContextAsync();
        EnsureGM(member);

        if (realm.CurrentEncounterId == null) throw new HubException("No active encounter.");
        var encounter = realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId);
        if (encounter == null) throw new HubException("Encounter not found.");

        var result = encounter.ResetVotes();
        if (result.IsFailure) throw new HubException(result.Error.Description);

        await _dbContext.SaveChangesAsync();
        await SendRealmStateAsync(realm.Id);
    }

    public async Task SealOutcome(int finalValue)
    {
        var (realm, member) = await GetCallerContextAsync();
        EnsureGM(member);

        if (realm.CurrentEncounterId == null) throw new HubException("No active encounter.");
        var encounter = realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId);
        if (encounter == null) throw new HubException("Encounter not found.");

        var result = encounter.Seal(finalValue);
        if (result.IsFailure) throw new HubException(result.Error.Description);

        await _dbContext.SaveChangesAsync();
        await SendRealmStateAsync(realm.Id);
    }

    // Quest Management
    public async Task AddQuest(string title, string description)
    {
        var (realm, member) = await GetCallerContextAsync();
        EnsureGM(member);

        var result = realm.AddQuest(title, description);
        if (result.IsFailure) throw new HubException(result.Error.Description);

        await _dbContext.SaveChangesAsync();
        await SendRealmStateAsync(realm.Id);
    }

    public async Task UpdateQuest(Guid questId, string title, string description)
    {
        var (realm, member) = await GetCallerContextAsync();
        EnsureGM(member);

        var result = realm.UpdateQuest(questId, title, description);
        if (result.IsFailure) throw new HubException(result.Error.Description);

        await _dbContext.SaveChangesAsync();
        await SendRealmStateAsync(realm.Id);
    }

    public async Task DeleteQuest(Guid questId)
    {
        var (realm, member) = await GetCallerContextAsync();
        EnsureGM(member);

        var result = realm.DeleteQuest(questId);
        if (result.IsFailure) throw new HubException(result.Error.Description);

        await _dbContext.SaveChangesAsync();
        await SendRealmStateAsync(realm.Id);
    }

    public async Task ReorderQuests(List<Guid> newOrder)
    {
        var (realm, member) = await GetCallerContextAsync();
        EnsureGM(member);

        var result = realm.ReorderQuests(newOrder);
        if (result.IsFailure) throw new HubException(result.Error.Description);

        await _dbContext.SaveChangesAsync();
        await SendRealmStateAsync(realm.Id);
    }

    // Helpers
    private async Task<(Realm, PartyMember)> GetCallerContextAsync()
    {
        Guid realmId = Guid.Empty;
        Guid memberId = Guid.Empty;

        if (Context.Items.TryGetValue("RealmId", out var rIdObj) && rIdObj is string rIdStr && Guid.TryParse(rIdStr, out realmId))
        {
            // Found in context items
        }
        else
        {
            var cRealmId = Context.User?.FindFirst("realmId")?.Value;
            if (!string.IsNullOrEmpty(cRealmId) && Guid.TryParse(cRealmId, out realmId))
            {
                // Found via claims
            }
            else
            {
                throw new HubException("Context Realm ID missing. Please join.");
            }
        }

        var realm = await _dbContext.Realms
            .Include(r => r.Members)
            .Include(r => r.Quests)
            .Include(r => r.Encounters).ThenInclude(e => e.Votes)
            .FirstOrDefaultAsync(r => r.Id == realmId);

        if (realm == null) throw new HubException("Realm not found.");

        if (Context.Items.TryGetValue("MemberId", out var mIdObj) && mIdObj is string mIdStr && Guid.TryParse(mIdStr, out memberId))
        {
            // found
        }
        else
        {
            var cMemberId = Context.User?.FindFirst("memberId")?.Value;
            if (!string.IsNullOrEmpty(cMemberId) && Guid.TryParse(cMemberId, out memberId))
            {
                // found
            }
        }

        var member = realm.Members.FirstOrDefault(m => m.Id == memberId);
        if (member != null) return (realm, member);

        throw new HubException("Member context invalid.");
    }

    private void EnsureGM(PartyMember member)
    {
        if (!member.IsHost)
        {
            throw new HubException("Only GM can perform this action.");
        }
    }

    private async Task SendRealmStateAsync(Guid realmId)
    {
        var realm = await _dbContext.Realms
            .Include(r => r.Members)
            .Include(r => r.Quests)
            .Include(r => r.Encounters).ThenInclude(e => e.Votes)
            .FirstOrDefaultAsync(r => r.Id == realmId);

        if (realm != null)
        {
            var dto = MapToRealmStateDto(realm);
            await Clients.Group(realmId.ToString()).RealmStateUpdated(dto);
        }
    }

    private async Task SendRealmStateToCallerAsync(Guid realmId)
    {
        var realm = await _dbContext.Realms
            .Include(r => r.Members)
            .Include(r => r.Quests)
            .Include(r => r.Encounters).ThenInclude(e => e.Votes)
            .FirstOrDefaultAsync(r => r.Id == realmId);

        if (realm != null)
        {
            var dto = MapToRealmStateDto(realm);
            await Clients.Caller.RealmStateUpdated(dto);
        }
    }

    private RealmStateDto MapToRealmStateDto(Realm realm)
    {
        var activeEncounter = realm.CurrentEncounterId.HasValue
            ? realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId)
            : null;

        return new RealmStateDto
        {
            RealmCode = realm.Code,
            ThemeKey = realm.Theme,
            Settings = new RealmSettingsDto
            {
                AutoReveal = realm.Settings.AutoReveal,
                AllowAbstain = realm.Settings.AllowAbstain,
                HideVoteCounts = realm.Settings.HideVoteCounts
            },
            PartyRoster = new PartyRosterDto
            {
                Members = realm.Members.Select(m => MapToMemberDto(m, activeEncounter)).OrderBy(m => m.Name).ToList()
            },
            QuestLog = new QuestLogDto
            {
                Quests = realm.Quests.OrderBy(q => q.Order).Select(q => new QuestDto
                {
                    Id = q.Id,
                    Title = q.Title,
                    Description = q.Description,
                    Status = q.Status.ToString(),
                    Order = q.Order
                }).ToList()
            },
            Encounter = MapToEncounterDto(activeEncounter, realm.Settings.HideVoteCounts)
        };
    }

    private PartyMemberDto MapToMemberDto(PartyMember m, Encounter? activeEncounter)
    {
        // Status logic: ready/choosing/disconnected
        string status = "ready";
        if (activeEncounter != null && activeEncounter.Status == EncounterStatus.Voting)
        {
            var hasVoted = activeEncounter.Votes.Any(v => v.PartyMemberId == m.Id);
            status = hasVoted ? "ready" : "choosing";
        }

        return new PartyMemberDto
        {
            Id = m.Id,
            Name = m.Name,
            Role = m.IsHost ? "GM" : "Member",
            Status = status,
            IsOnline = true // Simplified - would need connection tracker for real implementation
        };
    }

    private EncounterDto? MapToEncounterDto(Encounter? encounter, bool hideVoteCounts)
    {
        if (encounter == null) return null;

        var isRevealed = encounter.Status == EncounterStatus.Revealed;
        var votes = new Dictionary<Guid, string?>();
        var distribution = new Dictionary<string, int>();

        foreach (var v in encounter.Votes)
        {
            if (isRevealed)
            {
                // Show actual value after reveal
                votes[v.PartyMemberId] = v.Value.Label;
                if (!distribution.ContainsKey(v.Value.Label)) distribution[v.Value.Label] = 0;
                distribution[v.Value.Label]++;
            }
            else
            {
                // Before reveal: clients only see whether each member has voted, not values
                votes[v.PartyMemberId] = null; // masked
            }
        }

        return new EncounterDto
        {
            QuestId = encounter.QuestId,
            IsRevealed = isRevealed,
            Votes = votes,
            Distribution = isRevealed ? distribution : new Dictionary<string, int>(),
            Outcome = encounter.Outcome
        };
    }
}
