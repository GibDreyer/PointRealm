using PointRealm.Server.Domain.Enums;
using PointRealm.Server.Domain.Events;
using PointRealm.Server.Domain.ValueObjects;

namespace PointRealm.Server.Domain.Entities;

public sealed class Realm
{
    private readonly List<object> _domainEvents = new();

    private Realm(Guid id, RealmName name)
    {
        Id = id;
        Name = name;
        Status = RealmStatus.Draft;
        CreatedAt = DateTimeOffset.UtcNow;
        AddDomainEvent(new RealmCreatedEvent(Id, Name.Value, CreatedAt));
    }

    private Realm()
    {
    }

    public Guid Id { get; private set; }
    public RealmName Name { get; private set; } = new("Unknown");
    public RealmStatus Status { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public IReadOnlyCollection<object> DomainEvents => _domainEvents;

    public static Realm Create(string name)
    {
        var realmName = RealmName.From(name);
        return new Realm(Guid.NewGuid(), realmName);
    }

    public void Activate() => Status = RealmStatus.Active;

    private void AddDomainEvent(object domainEvent) => _domainEvents.Add(domainEvent);
}
