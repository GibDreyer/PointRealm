namespace PointRealm.Server.Domain.Events;

public sealed record RealmCreatedEvent(Guid RealmId, string Name, DateTimeOffset CreatedAt);
