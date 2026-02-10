using PointRealm.Server.Domain.Primitives;
using PointRealm.Server.Domain.ValueObjects;

namespace PointRealm.Server.Domain.Entities;

public sealed class Vote : Entity
{
    public Guid PartyMemberId { get; private set; }
    public RuneCardValue Value { get; private set; } = null!;

    internal Vote(Guid partyMemberId, RuneCardValue value) : base(Guid.NewGuid())
    {
        PartyMemberId = partyMemberId;
        Value = value;
    }

    private Vote() { }
}
