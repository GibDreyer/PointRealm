using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Application.Services;

public sealed class RealmStateMapper : IRealmStateMapper
{
    public LobbySnapshotDto MapToLobbySnapshot(Realm realm, PartyMember currentMember)
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
                    DeckType = MapDeckType(realm.Settings?.Deck ?? RealmSettings.Default().Deck),
                    AutoReveal = realm.Settings?.AutoReveal ?? true,
                    AllowAbstain = realm.Settings?.AllowAbstain ?? true,
                    HideVoteCounts = realm.Settings?.HideVoteCounts ?? false,
                    CustomDeckValues = (realm.Settings?.Deck?.Name ?? "FIBONACCI") == "Custom"
                        ? realm.Settings!.Deck.Cards.Select(c => c.Label).ToList()
                        : null
                }
            },
            Me = new MyInfoDto
            {
                MemberId = currentMember.Id.ToString(),
                DisplayName = currentMember.Name,
                Role = currentMember.IsHost ? "GM" : (currentMember.IsObserver ? "Observer" : "Participant")
            },
            Party = realm.Members.Select(m => new PartyMemberSnapshotDto
            {
                MemberId = m.Id.ToString(),
                DisplayName = m.Name,
                AvatarEmoji = m.AvatarEmoji,
                Presence = m.IsOnline ? "Online" : "Offline",
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

    public RealmStateDto MapToRealmStateDto(Realm realm)
    {
        var activeEncounter = realm.CurrentEncounterId.HasValue
            ? realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId)
            : null;

        var settings = realm.Settings ?? RealmSettings.Default();

        return new RealmStateDto
        {
            RealmCode = realm.Code ?? "UNKNOWN",
            ThemeKey = realm.Theme ?? "default",
            RealmVersion = realm.Version,
            QuestLogVersion = realm.QuestLogVersion,
            EncounterVersion = activeEncounter?.Version,
            Settings = new RealmSettingsDto
            {
                Deck = new RuneDeckDto
                {
                    Name = settings.Deck.Name,
                    Cards = settings.Deck.Cards.Select(card => new RuneCardDto
                    {
                        Label = card.Label,
                        Value = card.Value
                    }).ToList()
                },
                DeckType = MapDeckType(settings.Deck),
                CustomDeckValues = settings.Deck.Name == "Custom"
                    ? settings.Deck.Cards.Select(c => c.Label).ToList()
                    : null,
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
                    Order = q.Order,
                    Version = q.Version,
                    SealedOutcome = q.SealedOutcome
                }).ToList()
            },
            Encounter = MapToEncounterDto(activeEncounter, realm.Members, settings.HideVoteCounts)
        };
    }

    private PartyMemberDto MapToMemberDto(PartyMember m, Encounter? activeEncounter)
    {
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
            AvatarEmoji = m.AvatarEmoji,
            Role = m.IsHost ? "GM" : (m.IsObserver ? "Observer" : "Member"),
            Status = m.IsOnline ? status : "disconnected",
            IsOnline = m.IsOnline,
            IsObserver = m.IsObserver,
            IsBanned = m.IsBanned
        };
    }

    private EncounterDto? MapToEncounterDto(Encounter? encounter, IReadOnlyCollection<PartyMember> members, bool hideVoteCounts)
    {
        if (encounter is null) return null;

        var isRevealed = encounter.Status == EncounterStatus.Revealed;
        var votes = new Dictionary<Guid, string?>();
        var distribution = new Dictionary<string, int>();
        var hasVoted = new Dictionary<Guid, bool>();

        foreach (var member in members.Where(m => !m.IsBanned))
        {
            var memberVote = encounter.Votes?.FirstOrDefault(v => v?.PartyMemberId == member.Id);
            var voted = memberVote is not null;
            hasVoted[member.Id] = voted;

            if (isRevealed && memberVote?.Value is not null)
            {
                votes[member.Id] = memberVote.Value.Label;
                if (!distribution.ContainsKey(memberVote.Value.Label))
                {
                    distribution[memberVote.Value.Label] = 0;
                }
                distribution[memberVote.Value.Label]++;
            }
        }

        return new EncounterDto
        {
            QuestId = encounter.QuestId,
            IsRevealed = isRevealed,
            Votes = isRevealed ? votes : new Dictionary<Guid, string?>(),
            Distribution = isRevealed ? distribution : new Dictionary<string, int>(),
            Outcome = encounter.Outcome,
            Version = encounter.Version,
            HasVoted = hasVoted,
            ShouldHideVoteCounts = hideVoteCounts
        };
    }

    private string GetVoteState(PartyMember member, Realm realm)
    {
        if (member.IsObserver) return "NotVoting";
        if (realm.CurrentEncounterId == null) return "NotVoting";

        var encounter = realm.Encounters.FirstOrDefault(e => e.Id == realm.CurrentEncounterId);
        if (encounter == null || encounter.Status != EncounterStatus.Voting) return "NotVoting";

        var hasVoted = encounter.Votes?.Any(v => v?.PartyMemberId == member.Id) ?? false;
        return hasVoted ? "LockedIn" : "Choosing";
    }

    private static string MapDeckType(RuneDeck deck)
    {
        return deck.Name switch
        {
            "Fibonacci" => "FIBONACCI",
            "Short Fibonacci" => "SHORT_FIBONACCI",
            "T-Shirt" => "TSHIRT",
            "Custom" => "CUSTOM",
            _ => "FIBONACCI"
        };
    }
}
