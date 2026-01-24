using System.Text.Json.Serialization;
using PointRealm.Server.Domain.Primitives;

namespace PointRealm.Server.Domain.ValueObjects;

public sealed class RuneCardValue : ValueObject
{
    public string Label { get; private set; }
    public decimal? Value { get; private set; }

    // Parameterless constructor for EF Core
    private RuneCardValue()
    {
        Label = string.Empty;
    }

    [JsonConstructor]
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
