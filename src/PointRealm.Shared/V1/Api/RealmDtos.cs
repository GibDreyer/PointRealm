namespace PointRealm.Shared.V1.Api;

public record CreateRealmRequest
{
    public string? RealmName { get; init; }
    public string? ThemeKey { get; init; }
    public RealmSettingsRequest? Settings { get; init; }
}

public record RealmSettingsRequest
{
    public string? DeckType { get; init; }
    public List<string>? CustomDeckValues { get; init; }
    public bool? AutoReveal { get; init; }
    public bool? AllowAbstain { get; init; }
    public bool? HideVoteCounts { get; init; }
}

public record UpdateRealmSettingsRequest
{
    public string? ThemeKey { get; init; }
    public RealmSettingsRequest? Settings { get; init; }
}

public record JoinRealmRequest
{
    public required string DisplayName { get; init; }
    public string? Role { get; init; }
    public bool? IsObserver { get; init; }
}

public record JoinRealmResponse
{
    public required string MemberToken { get; init; }
    public required string MemberId { get; init; }
    public required string RealmCode { get; init; }
    public string? RealmName { get; init; }
    public string? ThemeKey { get; init; }
    public string? Role { get; init; }
}


public record CreateRealmResponse
{
    public required string Code { get; init; }
    public string? Name { get; init; }
    public required string JoinUrl { get; init; }
    public required string ThemeKey { get; init; }
    public required RealmSettingsDto Settings { get; init; }
}

public record RealmSummaryResponse
{
    public required string Code { get; init; }
    public string? Name { get; init; }
    public required string ThemeKey { get; init; }
    public required RealmSettingsDto Settings { get; init; }
    public int MemberCount { get; init; }
    public int QuestCount { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record RuneDeckDto
{
    public required string Name { get; init; }
    public required List<RuneCardDto> Cards { get; init; }
}

public record RuneCardDto
{
    public required string Label { get; init; }
    public decimal? Value { get; init; }
}
