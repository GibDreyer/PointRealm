using PointRealm.Server.Common;
using PointRealm.Server.Domain.Primitives;
using PointRealm.Server.Domain.ValueObjects;

namespace PointRealm.Server.Domain.Entities;

public enum EncounterStatus
{
    Voting = 1,
    Revealed = 2
}

public sealed class Encounter : Entity
{
    private readonly List<Vote> _votes = new();

    public Guid QuestId { get; private set; }
    public EncounterStatus Status { get; private set; }
    public IReadOnlyCollection<Vote> Votes => _votes.AsReadOnly();
    public int Version { get; private set; }
    
    public int? Outcome { get; private set; }

    internal Encounter(Guid questId) : base(Guid.NewGuid())
    {
        QuestId = questId;
        Status = EncounterStatus.Voting;
    }

    private Encounter() { }

    public Result CastVote(Guid partyMemberId, RuneCardValue value)
    {
        if (Status == EncounterStatus.Revealed)
        {
            return Result.Failure(new Error("Encounter.AlreadyRevealed", "Votes cannot be cast after the encounter is revealed."));
        }

        var existingVote = _votes.FirstOrDefault(x => x.PartyMemberId == partyMemberId);
        if (existingVote is not null)
        {
            _votes.Remove(existingVote);
        }

        _votes.Add(new Vote(partyMemberId, value));
        
        return Result.Success();
    }

    public Result Reveal()
    {
        if (Status == EncounterStatus.Revealed)
        {
             return Result.Failure(new Error("Encounter.AlreadyRevealed", "The encounter is already revealed."));
        }

        Status = EncounterStatus.Revealed;
        return Result.Success();
    }

    public Result ResetVotes()
    {
        _votes.Clear();
        Status = EncounterStatus.Voting;
        Outcome = null;
        return Result.Success();
    }

    public Result Seal(int outcome)
    {
        if (Status != EncounterStatus.Revealed)
        {
             return Result.Failure(new Error("Encounter.NotRevealed", "The encounter must be revealed before sealing an outcome."));
        }

        Outcome = outcome;
        return Result.Success();
    }
}
