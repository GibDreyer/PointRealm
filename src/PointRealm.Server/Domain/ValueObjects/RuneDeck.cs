using System.Text.Json.Serialization;
using PointRealm.Server.Domain.Primitives;

namespace PointRealm.Server.Domain.ValueObjects;

public sealed class RuneDeck : ValueObject
{
    public string Name { get; private set; }
    public List<RuneCardValue> Cards { get; private set; }

    // Parameterless constructor for EF Core
    private RuneDeck()
    {
        Name = string.Empty;
        Cards = new List<RuneCardValue>();
    }

    [JsonConstructor]
    public RuneDeck(string name, List<RuneCardValue> cards)
    {
        Name = name;
        Cards = cards;
    }

    // Factory constructor - for internal use by static factory methods
    private RuneDeck(string name, IEnumerable<RuneCardValue> cards)
    {
        Name = name;
        Cards = cards.ToList();
    }

    public static RuneDeck Standard()
    {
        return new RuneDeck("Standard", new[]
        {
            new RuneCardValue("0", 0),
            new RuneCardValue("1/2", 0.5m),
            new RuneCardValue("1", 1),
            new RuneCardValue("2", 2),
            new RuneCardValue("3", 3),
            new RuneCardValue("5", 5),
            new RuneCardValue("8", 8),
            new RuneCardValue("13", 13),
            new RuneCardValue("20", 20),
            new RuneCardValue("40", 40),
            new RuneCardValue("100", 100),
            new RuneCardValue("?", null),
            new RuneCardValue("☕", null)
        });
    }

    public static RuneDeck Fibonacci()
    {
        return new RuneDeck("Fibonacci", new[]
        {
            new RuneCardValue("0", 0),
            new RuneCardValue("1", 1),
            new RuneCardValue("2", 2),
            new RuneCardValue("3", 3),
            new RuneCardValue("5", 5),
            new RuneCardValue("8", 8),
            new RuneCardValue("13", 13),
            new RuneCardValue("21", 21),
            new RuneCardValue("?", null)
        });
    }
    
    public static RuneDeck TShirt()
    {
        return new RuneDeck("T-Shirt", new[]
        {
             new RuneCardValue("XS", 1),
             new RuneCardValue("S", 2),
             new RuneCardValue("M", 3),
             new RuneCardValue("L", 4),
             new RuneCardValue("XL", 5),
             new RuneCardValue("XXL", 6),
             new RuneCardValue("?", null)
        });
    }

    public static RuneDeck ShortFibonacci()
    {
        return new RuneDeck("Short Fibonacci", new[]
        {
            new RuneCardValue("0", 0),
            new RuneCardValue("1/2", 0.5m),
            new RuneCardValue("1", 1),
            new RuneCardValue("2", 2),
            new RuneCardValue("3", 3),
            new RuneCardValue("5", 5),
            new RuneCardValue("8", 8),
            new RuneCardValue("?", null)
        });
    }

    public static RuneDeck Custom(IEnumerable<string> labels)
    {
        return new RuneDeck("Custom", labels.Select(label => 
        {
            decimal? value = null;
            if (decimal.TryParse(label, out var parsedValue))
            {
                value = parsedValue;
            }
            return new RuneCardValue(label, value);
        }));
    }

    public override IEnumerable<object> GetAtomicValues()
    {
        yield return Name;
        foreach (var card in Cards)
        {
            yield return card;
        }
    }
}
