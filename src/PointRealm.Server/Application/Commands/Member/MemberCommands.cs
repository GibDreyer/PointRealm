namespace PointRealm.Server.Application.Commands.Member;

/// <summary>
/// Command to update a member's display name.
/// </summary>
public record SetDisplayNameCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId,
    string Name,
    Guid? CommandId = null);

/// <summary>
/// Command to update a member's avatar emoji.
/// </summary>
public record SetAvatarEmojiCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId,
    string Emoji,
    int Version,
    Guid? CommandId = null);

/// <summary>
/// Command to indicate a member is joining presence (coming online).
/// </summary>
public record JoinPresenceCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId);

/// <summary>
/// Command to indicate a member is leaving presence (going offline).
/// </summary>
public record LeavePresenceCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId);
