using PointRealm.Server.Domain.Primitives;

namespace PointRealm.Server.Domain.ValueObjects;

public sealed class RealmSettings : ValueObject
{
    public RuneDeck Deck { get; }
    public bool AutoReveal { get; }
    public bool AllowAbstain { get; }
    public bool HideVoteCounts { get; }

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
