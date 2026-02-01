using FluentAssertions;
using PointRealm.Server.Application.Services;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using Xunit;

namespace PointRealm.Tests.Application;

public class RealmStateMapperTests
{
    [Fact]
    public void MapToLobbySnapshot_MapsCustomDeckValues()
    {
        var realm = Realm.Create("realm", "Realm", "theme", RealmSettings.Default()).Value;
        var host = PartyMember.Create(realm.Id, "client", "GM", true);
        realm.AddMember(host);
        realm.UpdateSettings(new RealmSettings(RuneDeck.Custom(new[] { "1", "2" }), true, true, false));

        var mapper = new RealmStateMapper();
        var snapshot = mapper.MapToLobbySnapshot(realm, host);

        Assert.Equal("CUSTOM", snapshot.Realm.Settings.DeckType);
        Assert.Equal(new[] { "1", "2" }, snapshot.Realm.Settings.CustomDeckValues);
        Assert.Equal("GM", snapshot.Me.Role);
    }

    [Fact]
    public void MapToRealmStateDto_ExcludesBannedMembersFromEncounterVotes()
    {
        var realm = Realm.Create("realm", "Realm", "theme", RealmSettings.Default()).Value;
        var active = PartyMember.Create(realm.Id, "client", "Active", false);
        var banned = PartyMember.Create(realm.Id, "client-2", "Banned", false);
        banned.Ban();
        realm.AddMember(active);
        realm.AddMember(banned);
        realm.AddQuest("Quest", "Desc");
        realm.StartEncounter(realm.CurrentQuestId!.Value);
        var encounter = realm.Encounters.First();
        encounter.CastVote(active.Id, new RuneCardValue("1", 1));
        encounter.CastVote(banned.Id, new RuneCardValue("2", 2));
        encounter.Reveal();
        realm.UpdateSettings(new RealmSettings(RuneDeck.Standard(), false, true, true));

        var mapper = new RealmStateMapper();
        var state = mapper.MapToRealmStateDto(realm);

        Assert.NotNull(state.Encounter);
        Assert.True(state.Encounter!.HasVoted.ContainsKey(active.Id));
        Assert.False(state.Encounter.HasVoted.ContainsKey(banned.Id));
        Assert.Equal("1", state.Encounter.Votes[active.Id]);
        Assert.True(state.Encounter.ShouldHideVoteCounts);
    }

    [Fact]
    public void MapToRealmStateDto_ReturnsChoosingStatus_WhenVoteMissing()
    {
        var realm = Realm.Create("realm", "Realm", "theme", RealmSettings.Default()).Value;
        var member = PartyMember.Create(realm.Id, "client", "Member", false);
        realm.AddMember(member);
        realm.AddQuest("Quest", "Desc");
        realm.StartEncounter(realm.CurrentQuestId!.Value);

        var mapper = new RealmStateMapper();
        var state = mapper.MapToRealmStateDto(realm);

        var memberState = state.PartyRoster.Members.First(m => m.Id == member.Id);
        Assert.Equal("choosing", memberState.Status);
    }

    [Fact]
    public void MapToRealmStateDto_ConcealsVotesUntilReveal()
    {
        var realm = Realm.Create("realm", "Realm", "theme", RealmSettings.Default()).Value;
        var member = PartyMember.Create(realm.Id, "client", "Member", false);
        realm.AddMember(member);
        realm.AddQuest("Quest", "Desc");
        realm.StartEncounter(realm.CurrentQuestId!.Value);
        var encounter = realm.Encounters.First();
        encounter.CastVote(member.Id, new RuneCardValue("3", 3));
        realm.UpdateSettings(new RealmSettings(RuneDeck.Standard(), false, true, true));

        var mapper = new RealmStateMapper();
        var state = mapper.MapToRealmStateDto(realm);

        state.Encounter.Should().NotBeNull();
        state.Encounter!.Votes.Should().BeEmpty();
        state.Encounter.Distribution.Should().BeEmpty();
        state.Encounter.HasVoted[member.Id].Should().BeTrue();
        state.Encounter.ShouldHideVoteCounts.Should().BeTrue();
    }
}
