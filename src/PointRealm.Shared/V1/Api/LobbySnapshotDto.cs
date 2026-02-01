namespace PointRealm.Shared.V1.Api;

/// <summary>
/// DTO matching the frontend's LobbySnapshot type exactly.
/// </summary>
public class LobbySnapshotDto
{
    public RealmInfoDto Realm { get; set; } = new();
    public MyInfoDto Me { get; set; } = new();
    public List<PartyMemberSnapshotDto> Party { get; set; } = new();
    public PortalInfoDto Portal { get; set; } = new();
    public QuestLogSummaryDto QuestLogSummary { get; set; } = new();
    public string? ActiveEncounterId { get; set; }
}

public class RealmInfoDto
{
    public string Code { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string ThemeKey { get; set; } = string.Empty;
    public LobbyRealmSettingsDto Settings { get; set; } = new();
}

public class LobbyRealmSettingsDto
{
    public string DeckType { get; set; } = string.Empty;
    public List<string>? CustomDeckValues { get; set; }
    public bool AutoReveal { get; set; }
    public bool AllowAbstain { get; set; }
    public bool HideVoteCounts { get; set; }
}

public class MyInfoDto
{
    public string MemberId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = "Participant"; // GM, Participant, Observer
}

public class PartyMemberSnapshotDto
{
    public string MemberId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarEmoji { get; set; }
    public string? ClassBadgeKey { get; set; }
    public string Presence { get; set; } = "Offline"; // Online, Offline
    public string VoteState { get; set; } = "NotVoting"; // NotVoting, Choosing, LockedIn
    public bool IsGM { get; set; }
}

public class PortalInfoDto
{
    public string JoinUrl { get; set; } = string.Empty;
}

public class QuestLogSummaryDto
{
    public int TotalQuests { get; set; }
    public string? ActiveQuestId { get; set; }
    public string? ActiveQuestTitle { get; set; }
    public List<LobbyQuestDto> Quests { get; set; } = new();
}

public class LobbyQuestDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
}
