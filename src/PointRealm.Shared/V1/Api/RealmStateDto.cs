namespace PointRealm.Shared.V1.Api;

public class RealmStateDto
{
    public string RealmCode { get; set; } = string.Empty;
    public string ThemeKey { get; set; } = string.Empty;
    public int RealmVersion { get; set; }
    public int QuestLogVersion { get; set; }
    public int? EncounterVersion { get; set; }
    public RealmSettingsDto Settings { get; set; } = new();
    public QuestLogDto QuestLog { get; set; } = new();
    public PartyRosterDto PartyRoster { get; set; } = new();
    public EncounterDto? Encounter { get; set; }
}

public class RealmSettingsDto
{
    public RuneDeckDto? Deck { get; set; }
    public string? DeckType { get; set; }
    public List<string>? CustomDeckValues { get; set; }
    public bool AutoReveal { get; set; }
    public bool AllowAbstain { get; set; }
    public bool HideVoteCounts { get; set; }
}

public class QuestLogDto
{
    public List<QuestDto> Quests { get; set; } = new();
}

public class QuestDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Order { get; set; }
    public int Version { get; set; }
    public int? SealedOutcome { get; set; }
}

public class PartyRosterDto
{
    public List<PartyMemberDto> Members { get; set; } = new();
}

public class PartyMemberDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarEmoji { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? ProfileEmoji { get; set; }
    public string Role { get; set; } = "Member";
    public string Status { get; set; } = "disconnected";
    public bool IsOnline { get; set; }
    public bool IsObserver { get; set; }
    public bool IsBanned { get; set; }
}

public class EncounterDto
{
    public Guid QuestId { get; set; }
    public bool IsRevealed { get; set; }
    public Dictionary<Guid, string?> Votes { get; set; } = new();
    public Dictionary<string, int> Distribution { get; set; } = new();
    public int? Outcome { get; set; }
    public int Version { get; set; }
    public Dictionary<Guid, bool> HasVoted { get; set; } = new();
    public bool ShouldHideVoteCounts { get; set; }
}

public class PartyPresenceDto
{
    public Guid MemberId { get; set; }
    public bool IsOnline { get; set; }
}
