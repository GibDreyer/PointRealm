using PointRealm.Server.Application.Services;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using Xunit;

namespace PointRealm.Tests.Application;

public class RealmHistoryServiceTests
{
    [Fact]
    public void BuildRealmHistory_OnlyIncludesRevealedEncounters()
    {
        var realm = Realm.Create("realm", "Realm", "theme", RealmSettings.Default()).Value;
        var memberA = PartyMember.Create(realm.Id, "client-a", "Aria", false);
        var memberB = PartyMember.Create(realm.Id, "client-b", "Bram", false);
        realm.AddMember(memberA);
        realm.AddMember(memberB);
        realm.AddQuest("Quest One", "First");
        realm.AddQuest("Quest Two", "Second");

        var questOneId = realm.Quests.First(q => q.Order == 1).Id;
        var questTwoId = realm.Quests.First(q => q.Order == 2).Id;

        realm.StartEncounter(questOneId);
        var encounterOne = realm.Encounters.Last();
        encounterOne.CastVote(memberA.Id, new RuneCardValue("3", 3));
        encounterOne.CastVote(memberB.Id, new RuneCardValue("5", 5));
        encounterOne.Reveal();

        realm.StartEncounter(questTwoId);

        var service = new RealmHistoryService();
        var history = service.BuildRealmHistory(realm);

        Assert.Equal("realm", history.RealmCode);
        Assert.Equal(2, history.QuestHistories.Count);

        var questOneHistory = history.QuestHistories.First(q => q.Title == "Quest One");
        Assert.Single(questOneHistory.Encounters);
        Assert.Equal(2, questOneHistory.Encounters[0].Votes.Count);
        Assert.Equal(1, questOneHistory.Encounters[0].Distribution["3"]);
        Assert.Equal(1, questOneHistory.Encounters[0].Distribution["5"]);

        var questTwoHistory = history.QuestHistories.First(q => q.Title == "Quest Two");
        Assert.Empty(questTwoHistory.Encounters);
    }

    [Fact]
    public void BuildRealmHistory_UsesMemberNamesOrFallback()
    {
        var realm = Realm.Create("realm", "Realm", "theme", RealmSettings.Default()).Value;
        var member = PartyMember.Create(realm.Id, "client-a", "Aria", false);
        realm.AddMember(member);
        realm.AddQuest("Quest One", "First");

        var questId = realm.Quests.First().Id;
        realm.StartEncounter(questId);
        var encounter = realm.Encounters.Last();
        encounter.CastVote(member.Id, new RuneCardValue("3", 3));
        encounter.CastVote(Guid.NewGuid(), new RuneCardValue("5", 5));
        encounter.Reveal();

        var service = new RealmHistoryService();
        var history = service.BuildRealmHistory(realm);
        var votes = history.QuestHistories.First().Encounters.First().Votes;

        Assert.Contains(votes, vote => vote.MemberName == "Aria");
        Assert.Contains(votes, vote => vote.MemberName == "Unknown");
    }
}
