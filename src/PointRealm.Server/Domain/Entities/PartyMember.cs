using PointRealm.Server.Domain.Primitives;

namespace PointRealm.Server.Domain.Entities;

public sealed class PartyMember : Entity
{
    public string ClientInstanceId { get; private set; }
    public string Name { get; private set; }
    public bool IsHost { get; private set; }
    public Guid RealmId { get; private set; }

    private PartyMember(Guid realmId, string clientInstanceId, string name, bool isHost) : base(Guid.NewGuid())
    {
        RealmId = realmId;
        ClientInstanceId = clientInstanceId;
        Name = name;
        IsHost = isHost;
    }

    private PartyMember() { } // EF Core

    public static PartyMember Create(Guid realmId, string clientInstanceId, string name, bool isHost)
    {
        return new PartyMember(realmId, clientInstanceId, name, isHost);
    }
}
