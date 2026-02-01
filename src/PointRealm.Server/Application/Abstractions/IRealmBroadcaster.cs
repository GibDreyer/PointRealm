using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Application.Abstractions;

/// <summary>
/// Abstraction for broadcasting realm state to connected clients.
/// </summary>
public interface IRealmBroadcaster
{
    /// <summary>
    /// Broadcasts the current realm state to all connected clients.
    /// </summary>
    Task BroadcastRealmStateAsync(Guid realmId);
    
    /// <summary>
    /// Sends realm state to a specific connection.
    /// </summary>
    Task SendRealmStateToConnectionAsync(string connectionId, Guid realmId);
    
    /// <summary>
    /// Sends a lobby snapshot to a specific connection.
    /// </summary>
    Task SendRealmSnapshotToConnectionAsync(string connectionId, LobbySnapshotDto snapshot);
}
