using PointRealm.Server.Domain.Primitives;

namespace PointRealm.Server.Domain.Entities;

public sealed class PartyMember : Entity
{
    public string ClientInstanceId { get; private set; }
    public string Name { get; private set; }
    public bool IsHost { get; private set; }
    public bool IsObserver { get; private set; }
    public bool IsBanned { get; private set; }
    public bool IsOnline { get; private set; }
    public Guid RealmId { get; private set; }
    public string? UserId { get; private set; }
    public string? AvatarEmoji { get; private set; }
    public string? ProfileImageUrl { get; private set; }
    public string? ProfileEmoji { get; private set; }

    // Navigation property
    public Realm Realm { get; private set; } = null!;

    private PartyMember(Guid realmId, string clientInstanceId, string name, bool isHost, string? userId, bool isObserver) : base(Guid.NewGuid())
    {
        RealmId = realmId;
        ClientInstanceId = clientInstanceId;
        Name = name;
        IsHost = isHost;
        IsObserver = isObserver;
        IsBanned = false;
        IsOnline = true;
        UserId = userId;
    }

    private PartyMember() { } // EF Core

    public static PartyMember Create(Guid realmId, string clientInstanceId, string name, bool isHost, string? userId = null, bool isObserver = false)
    {
        return new PartyMember(realmId, clientInstanceId, name, isHost, userId, isObserver);
    }

    public void UpdateName(string name)
    {
        Name = name;
    }

    public void UpdateAvatarEmoji(string? emoji)
    {
        AvatarEmoji = string.IsNullOrWhiteSpace(emoji) ? null : emoji.Trim();
    }

    public void UpdateProfileAvatar(string? profileImageUrl, string? profileEmoji)
    {
        ProfileImageUrl = string.IsNullOrWhiteSpace(profileImageUrl) ? null : profileImageUrl.Trim();
        ProfileEmoji = string.IsNullOrWhiteSpace(profileEmoji) ? null : profileEmoji.Trim();
    }

    public void SetObserver(bool isObserver)
    {
        IsObserver = isObserver;
    }

    public void Ban()
    {
        IsBanned = true;
    }

    public void SetOnline(bool isOnline)
    {
        IsOnline = isOnline;
    }
}
