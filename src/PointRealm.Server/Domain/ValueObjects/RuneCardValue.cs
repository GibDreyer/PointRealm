using PointRealm.Server.Domain.Primitives;

namespace PointRealm.Server.Domain.ValueObjects;

public sealed class RuneCardValue : ValueObject
{
    public string Label { get; }
    public decimal? Value { get; }

    public RuneCardValue(string label, decimal? value)
    {
        Label = label;
        Value = value;
    }

    public override IEnumerable<object> GetAtomicValues()
    {
        yield return Label;
        if (Value.HasValue)
        {
            yield return Value.Value;
        }
    }
}
