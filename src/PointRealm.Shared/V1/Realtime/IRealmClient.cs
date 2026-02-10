using PointRealm.Shared.V1.Api;

namespace PointRealm.Shared.V1.Realtime;

public record EmojiReactionDto
{
    public required string Emoji { get; init; }
    public required string ThrownByMemberId { get; init; }
    public required string ThrownByName { get; init; }
    public DateTime OccurredAtUtc { get; init; }
}


public interface IRealmClient
{
    Task RealmSnapshot(LobbySnapshotDto snapshot);
    Task RealmStateUpdated(RealmStateDto state);
    Task PartyPresenceUpdated(PartyPresenceDto presence);
    Task EncounterUpdated(EncounterDto encounter);
    Task Toast(string message);
    Task EmojiReactionThrown(EmojiReactionDto reaction);
}
