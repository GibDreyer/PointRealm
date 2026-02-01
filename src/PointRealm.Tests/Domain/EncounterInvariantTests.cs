using FluentAssertions;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using Xunit;

namespace PointRealm.Tests.Domain;

public class EncounterInvariantTests
{
    [Fact]
    public void Reveal_ShouldFail_WhenAlreadyRevealed()
    {
        var realm = Realm.Create("realm", "Realm", "theme", RealmSettings.Default()).Value;
        realm.AddQuest("Quest", "Desc");
        realm.StartEncounter(realm.CurrentQuestId!.Value);
        var encounter = realm.Encounters.First();

        encounter.Reveal();
        var result = encounter.Reveal();

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Encounter.AlreadyRevealed");
    }

    [Fact]
    public void CastVote_ShouldReplaceExistingVote()
    {
        var realm = Realm.Create("realm", "Realm", "theme", RealmSettings.Default()).Value;
        realm.AddQuest("Quest", "Desc");
        realm.StartEncounter(realm.CurrentQuestId!.Value);
        var encounter = realm.Encounters.First();
        var memberId = Guid.NewGuid();

        encounter.CastVote(memberId, new RuneCardValue("1", 1));
        encounter.CastVote(memberId, new RuneCardValue("5", 5));

        encounter.Votes.Should().HaveCount(1);
        encounter.Votes.Single().Value.Label.Should().Be("5");
    }

    [Fact]
    public void Seal_ShouldFail_WhenNotRevealed()
    {
        var realm = Realm.Create("realm", "Realm", "theme", RealmSettings.Default()).Value;
        realm.AddQuest("Quest", "Desc");
        realm.StartEncounter(realm.CurrentQuestId!.Value);
        var encounter = realm.Encounters.First();

        var result = encounter.Seal(3);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Encounter.NotRevealed");
    }
}
