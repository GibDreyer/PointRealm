using PointRealm.Server.Domain.Entities;

namespace PointRealm.Server.Contracts;

public sealed record RealmDto(Guid Id, string Name, string Status, DateTimeOffset CreatedAt)
{
    public static RealmDto From(Realm realm) => new(realm.Id, realm.Name.Value, realm.Status.ToString(), realm.CreatedAt);
}
