using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Services;

public interface IRealmBroadcaster
{
    Task BroadcastRealmStateAsync(Guid realmId);
    Task SendRealmStateToConnectionAsync(string connectionId, Guid realmId);
    Task SendRealmSnapshotToConnectionAsync(string connectionId, LobbySnapshotDto snapshot);
}
