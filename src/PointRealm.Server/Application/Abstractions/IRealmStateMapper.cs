using PointRealm.Server.Domain.Entities;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Application.Abstractions;

/// <summary>
/// Abstraction for mapping domain realm state to client DTOs.
/// </summary>
public interface IRealmStateMapper
{
    /// <summary>
    /// Maps a realm and current member to a lobby snapshot DTO.
    /// </summary>
    LobbySnapshotDto MapToLobbySnapshot(Realm realm, PartyMember currentMember);
    
    /// <summary>
    /// Maps a realm to a real-time state DTO.
    /// </summary>
    RealmStateDto MapToRealmStateDto(Realm realm);
}
