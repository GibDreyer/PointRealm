using PointRealm.Shared.V1.Api;

namespace PointRealm.Shared.V1.Realtime;

public interface IRealmClient
{
    Task RealmSnapshot(LobbySnapshotDto snapshot);
    Task RealmStateUpdated(RealmStateDto state);
    Task PartyPresenceUpdated(PartyPresenceDto presence);
    Task EncounterUpdated(EncounterDto encounter);
    Task Toast(string message);
}
