namespace PointRealm.Server.Domain.ValueObjects;

public sealed record RealmName(string Value)
{
    public static RealmName From(string value) => new(value.Trim());

    public override string ToString() => Value;
}
