using PointRealm.Server.Domain.Primitives;

namespace PointRealm.Server.Domain.Entities;

public sealed class PartyMember : Entity
{
    public string ClientInstanceId { get; private set; }
    public string Name { get; private set; }
    public bool IsHost { get; private set; }
    public Guid RealmId { get; private set; }
    public string? UserId { get; private set; }

    private PartyMember(Guid realmId, string clientInstanceId, string name, bool isHost, string? userId) : base(Guid.NewGuid())
    {
        RealmId = realmId;
        ClientInstanceId = clientInstanceId;
        Name = name;
        IsHost = isHost;
        UserId = userId;
    }

    private PartyMember() { } // EF Core

    public static PartyMember Create(Guid realmId, string clientInstanceId, string name, bool isHost, string? userId = null)
    {
        return new PartyMember(realmId, clientInstanceId, name, isHost, userId);
    }

    public void UpdateName(string name)
    {
        Name = name;
    }
}
