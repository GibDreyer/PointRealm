using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;
using PointRealm.Shared.V1.Realtime;

namespace PointRealm.Server.Api.Hubs;

[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class RealmHub : Hub<IRealmClient>
{
    private readonly PointRealmDbContext _dbContext;

    public RealmHub(PointRealmDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public override async Task OnConnectedAsync()
    {
        // On connect, the user is already authenticated via JWT
        // Extract claims and auto-join their realm group
        var memberIdStr = Context.User?.FindFirst("memberId")?.Value;
        var realmIdStr = Context.User?.FindFirst("realmId")?.Value;
        
        if (!string.IsNullOrEmpty(realmIdStr) && Guid.TryParse(realmIdStr, out var realmId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, realmIdStr);
            
            // Store in context for later use
            Context.Items["RealmId"] = realmIdStr;
            Context.Items["MemberId"] = memberIdStr;
            
            // Send initial state
            if (!string.IsNullOrEmpty(memberIdStr) && Guid.TryParse(memberIdStr, out var memberId))
            {
                var realm = await _dbContext.Realms
                    .Include(r => r.Members)
                    .Include(r => r.Quests)
                    .Include(r => r.Encounters).ThenInclude(e => e.Votes)
                    .FirstOrDefaultAsync(r => r.Id == realmId);

                if (realm != null)
                {
                    var member = realm.Members.FirstOrDefault(m => m.Id == memberId);
                    if (member != null)
                    {
                        await SendRealmSnapshotToCallerAsync(realm, member);
                    }
                }
            }
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Explicit join for clients that want to join a specific realm.
    /// With JWT auth, the realmId is already in claims, so this mainly validates and sends snapshot.
    /// </summary>
    public async Task JoinRealm(string realmCode)
    {
        // Get identity from JWT claims
        var memberIdStr = Context.User?.FindFirst("memberId")?.Value;
        var realmIdFromToken = Context.User?.FindFirst("realmId")?.Value;
        
        if (string.IsNullOrEmpty(memberIdStr) || !Guid.TryParse(memberIdStr, out var memberId))
        {
            throw new HubException("Invalid member identity in token.");
        }

        var realm = await _dbContext.Realms
            .Include(r => r.Members)
            .Include(r => r.Quests)
            .Include(r => r.Encounters).ThenInclude(e => e.Votes)
            .FirstOrDefaultAsync(r => r.Code == realmCode);

        if (realm == null) throw new HubException("Realm not found.");

        // Verify the token's realmId matches
        if (!Guid.TryParse(realmIdFromToken, out var tokenRealmId) || tokenRealmId != realm.Id)
        {
            throw new HubException("Token not valid for this realm.");
        }

        var member = realm.Members.FirstOrDefault(m => m.Id == memberId);
        if (member == null) throw new HubException("Member not found in realm.");

        // Store in context and join group
        Context.Items["RealmId"] = realm.Id.ToString();
        Context.Items["MemberId"] = member.Id.ToString();

        await Groups.AddToGroupAsync(Context.ConnectionId, realm.Id.ToString());

        // Send snapshot to caller
        await SendRealmSnapshotToCallerAsync(realm, member);
        await SendRealmStateToCallerAsync(realm.Id);
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

    public async Task AddQuest(string title, string description)
    {
        var (realm, member) = await GetCallerContextAsync();
        EnsureGM(member);

        var result = realm.AddQuest(title, description);
        if (result.IsFailure) throw new HubException(result.Error.Description);

        try
        {
            await _dbContext.SaveChangesAsync();
            await SendRealmStateAsync(realm.Id);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            // If we hit concurrency, try refreshing from DB and retrying once
            _dbContext.Entry(realm).Reload();
            realm.AddQuest(title, description);
            await _dbContext.SaveChangesAsync();
            await SendRealmStateAsync(realm.Id);
        }
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

    private async Task SendRealmSnapshotToCallerAsync(Realm realm, PartyMember currentMember)
    {
        var snapshot = MapToLobbySnapshot(realm, currentMember);
        await Clients.Caller.RealmSnapshot(snapshot);
    }

    private async Task SendRealmSnapshotToGroupAsync(Guid realmId, Guid currentMemberId)
    {
        var realm = await _dbContext.Realms
            .Include(r => r.Members)
            .Include(r => r.Quests)
            .Include(r => r.Encounters).ThenInclude(e => e.Votes)
            .FirstOrDefaultAsync(r => r.Id == realmId);

        if (realm == null) return;
        
        // For each connected client in the group, send a personalized snapshot
        // For now, we send a generic snapshot (me will be derived client-side or we need connection tracking)
        var currentMember = realm.Members.FirstOrDefault(m => m.Id == currentMemberId);
        if (currentMember != null)
        {
            var snapshot = MapToLobbySnapshot(realm, currentMember);
            await Clients.Caller.RealmSnapshot(snapshot);
        }
    }

    private LobbySnapshotDto MapToLobbySnapshot(Realm realm, PartyMember currentMember)
    {
        var activeQuest = realm.CurrentQuestId.HasValue 
            ? realm.Quests.FirstOrDefault(q => q.Id == realm.CurrentQuestId) 
            : null;

        return new LobbySnapshotDto
        {
            Realm = new RealmInfoDto
            {
                Code = realm.Code,
                Name = realm.Name,
                ThemeKey = realm.Theme,
                Settings = new LobbyRealmSettingsDto
                {
                    DeckType = realm.Settings.Deck.Name,
                    AutoReveal = realm.Settings.AutoReveal,
                    AllowAbstain = realm.Settings.AllowAbstain,
                    HideVoteCounts = realm.Settings.HideVoteCounts
                }
            },
            Me = new MyInfoDto
            {
                MemberId = currentMember.Id.ToString(),
                DisplayName = currentMember.Name,
                Role = currentMember.IsHost ? "GM" : "Participant"
            },
            Party = realm.Members.Select(m => new PartyMemberSnapshotDto
            {
                MemberId = m.Id.ToString(),
                DisplayName = m.Name,
                Presence = "Online", // Simplified - would need connection tracking
                VoteState = GetVoteState(m, realm),
                IsGM = m.IsHost
            }).ToList(),
            Portal = new PortalInfoDto
            {
                JoinUrl = $"/realm/{realm.Code}"
            },
            QuestLogSummary = new QuestLogSummaryDto
            {
                TotalQuests = realm.Quests.Count,
                ActiveQuestId = activeQuest?.Id.ToString(),
                ActiveQuestTitle = activeQuest?.Title,
                Quests = realm.Quests.OrderBy(q => q.Order).Select(q => new LobbyQuestDto
                {
                    Id = q.Id.ToString(),
                    Title = q.Title
                }).ToList()
            },
            ActiveEncounterId = realm.CurrentEncounterId?.ToString()
        };
    }

    private string GetVoteState(PartyMember member, Realm realm)
    {
        if (realm.CurrentEncounterId == null) return "NotVoting";
        
        var encounter = realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId);
        if (encounter == null || encounter.Status != EncounterStatus.Voting) return "NotVoting";
        
        var hasVoted = encounter.Votes?.Any(v => v?.PartyMemberId == member.Id) ?? false;
        return hasVoted ? "LockedIn" : "Choosing";
    }

    private RealmStateDto MapToRealmStateDto(Realm realm)
    {
        var activeEncounter = realm.CurrentEncounterId.HasValue
            ? realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId)
            : null;

        var settings = realm.Settings ?? RealmSettings.Default();

        return new RealmStateDto
        {
            RealmCode = realm.Code ?? "UNKNOWN",
            ThemeKey = realm.Theme ?? "default",
            Settings = new RealmSettingsDto
            {
                AutoReveal = settings.AutoReveal,
                AllowAbstain = settings.AllowAbstain,
                HideVoteCounts = settings.HideVoteCounts
            },
            PartyRoster = new PartyRosterDto
            {
                Members = realm.Members
                    .Where(m => m != null)
                    .Select(m => MapToMemberDto(m, activeEncounter))
                    .OrderBy(m => m.Name ?? "")
                    .ToList()
            },
            QuestLog = new QuestLogDto
            {
                Quests = realm.Quests.OrderBy(q => q.Order).Select(q => new QuestDto
                {
                    Id = q.Id,
                    Title = q.Title ?? "Untitled Quest",
                    Description = q.Description ?? "",
                    Status = q.Status.ToString(),
                    Order = q.Order
                }).ToList()
            },
            Encounter = MapToEncounterDto(activeEncounter, settings.HideVoteCounts)
        };
    }

    private PartyMemberDto MapToMemberDto(PartyMember m, Encounter? activeEncounter)
    {
        if (m == null) return new PartyMemberDto();

        // Status logic: ready/choosing/disconnected
        string status = "ready";
        if (activeEncounter is not null && activeEncounter.Status == EncounterStatus.Voting)
        {
            var hasVoted = activeEncounter.Votes?.Any(v => v?.PartyMemberId == m.Id) ?? false;
            status = hasVoted ? "ready" : "choosing";
        }

        return new PartyMemberDto
        {
            Id = m.Id,
            Name = m.Name ?? "Unknown Traveler",
            Role = m.IsHost ? "GM" : "Member",
            Status = status,
            IsOnline = true // Simplified - would need connection tracker for real implementation
        };
    }

    private EncounterDto? MapToEncounterDto(Encounter? encounter, bool hideVoteCounts)
    {
        if (encounter is null) return null;

        var isRevealed = encounter.Status == EncounterStatus.Revealed;
        var votes = new Dictionary<Guid, string?>();
        var distribution = new Dictionary<string, int>();

        if (encounter.Votes != null)
        {
            foreach (var v in encounter.Votes)
            {
                if (v == null) continue;

                if (isRevealed)
                {
                    // Show actual value after reveal
                    votes[v.PartyMemberId] = v.Value?.Label;
                    if (v.Value != null)
                    {
                        if (!distribution.ContainsKey(v.Value.Label)) distribution[v.Value.Label] = 0;
                        distribution[v.Value.Label]++;
                    }
                }
                else
                {
                    // Before reveal: clients only see whether each member has voted, not values
                    votes[v.PartyMemberId] = null; // masked
                }
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
