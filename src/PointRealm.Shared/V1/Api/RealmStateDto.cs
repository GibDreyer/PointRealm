namespace PointRealm.Shared.V1.Api;

public class RealmStateDto
{
    public string RealmCode { get; set; } = string.Empty;
    public string ThemeKey { get; set; } = string.Empty;
    public RealmSettingsDto Settings { get; set; } = new();
    public QuestLogDto QuestLog { get; set; } = new();
    public PartyRosterDto PartyRoster { get; set; } = new();
    public EncounterDto? Encounter { get; set; }
}

public class RealmSettingsDto
{
    public RuneDeckDto? Deck { get; set; }
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
    public string Status { get; set; } = string.Empty; // Pending, Active, Completed
    public int Order { get; set; }
}

public class PartyRosterDto
{
    public List<PartyMemberDto> Members { get; set; } = new();
}

public class PartyMemberDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = "Member"; // GM, Member
    public string Status { get; set; } = "disconnected"; // ready, choosing, disconnected
    public bool IsOnline { get; set; }
}

public class EncounterDto
{
    public Guid QuestId { get; set; }
    public bool IsRevealed { get; set; }
    public Dictionary<Guid, string?> Votes { get; set; } = new(); // MemberId -> Value (masked if hidden)
    public Dictionary<string, int> Distribution { get; set; } = new(); // Value -> Count (only valid when revealed)
    public int? Outcome { get; set; }
}

public class PartyPresenceDto
{
    public Guid MemberId { get; set; }
    public bool IsOnline { get; set; }
}
