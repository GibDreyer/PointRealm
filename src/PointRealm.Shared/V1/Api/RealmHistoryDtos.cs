namespace PointRealm.Shared.V1.Api;

public record UserRealmListItem
{
    public required string RealmCode { get; init; }
    public required string ThemeKey { get; init; }
    public DateTime CreatedAt { get; init; }
    public int MemberCount { get; init; }
    public int QuestCount { get; init; }
    public bool IsOwner { get; init; }
    public string? LastAccessedAt { get; init; }
}

public record UserRealmsResponse
{
    public required List<UserRealmListItem> Realms { get; init; }
}

public record MinimalRealmInfo
{
    public required string RealmCode { get; init; }
    public required string ThemeKey { get; init; }
}

public record AnonymousRealmsResponse
{
    public required List<MinimalRealmInfo> Realms { get; init; }
}

public record RealmHistoryResponse
{
    public required string RealmCode { get; init; }
    public required List<QuestHistory> QuestHistories { get; init; }
}

public record QuestHistory
{
    public Guid QuestId { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public string? ExternalId { get; init; }
    public string? ExternalUrl { get; init; }
    public int Order { get; init; }
    public required List<EncounterHistory> Encounters { get; init; }
}

public record EncounterHistory
{
    public Guid EncounterId { get; init; }
    public DateTime CompletedAt { get; init; }
    public int? SealedOutcome { get; init; }
    public required List<VoteHistory> Votes { get; init; }
    public Dictionary<string, int> Distribution { get; init; } = new();
}

public record VoteHistory
{
    public Guid MemberId { get; init; }
    public required string MemberName { get; init; }
    public required string VoteValue { get; init; }
}
