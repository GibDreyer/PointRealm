using System.Text.Json.Serialization;
using PointRealm.Server.Domain.Primitives;

namespace PointRealm.Server.Domain.ValueObjects;

public sealed class RealmSettings : ValueObject
{
    public RuneDeck Deck { get; private set; }
    public bool AutoReveal { get; private set; }
    public bool AllowAbstain { get; private set; }
    public bool HideVoteCounts { get; private set; }

    private RealmSettings()
    {
        Deck = RuneDeck.Standard();
    }

    [JsonConstructor]
    public RealmSettings(RuneDeck deck, bool autoReveal, bool allowAbstain, bool hideVoteCounts)
    {
        Deck = deck;
        AutoReveal = autoReveal;
        AllowAbstain = allowAbstain;
        HideVoteCounts = hideVoteCounts;
    }
    
    public static RealmSettings Default() => new(RuneDeck.Standard(), false, true, false);

    public override IEnumerable<object> GetAtomicValues()
    {
        yield return Deck;
        yield return AutoReveal;
        yield return AllowAbstain;
        yield return HideVoteCounts;
    }
}
