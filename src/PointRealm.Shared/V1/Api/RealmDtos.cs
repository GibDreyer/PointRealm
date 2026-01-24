namespace PointRealm.Shared.V1.Api;

// Request DTOs
public record CreateRealmRequest
{
    public string? ThemeKey { get; init; }
    public RealmSettingsRequest? Settings { get; init; }
}

public record RealmSettingsRequest
{
    public string? DeckName { get; init; }
    public bool? AutoReveal { get; init; }
    public bool? AllowAbstain { get; init; }
    public bool? HideVoteCounts { get; init; }
}

// Alias for clarity - update and create use the same request structure
public record UpdateRealmSettingsRequest : RealmSettingsRequest;


// Response DTOs
public record CreateRealmResponse
{
    public required string RealmCode { get; init; }
    public required string JoinUrl { get; init; }
    public required string ThemeKey { get; init; }
    public required RealmSettingsDto Settings { get; init; }
}

public record RealmSummaryResponse
{
    public required string RealmCode { get; init; }
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
