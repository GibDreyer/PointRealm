using FluentAssertions;
using PointRealm.Server.Application.Commands.Encounter;
using PointRealm.Server.Application.Commands.Handlers;
using PointRealm.Server.Application.Commands.Quest;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using PointRealm.Tests.TestDoubles;
using Xunit;

namespace PointRealm.Tests.Application;

public class CommandAuthorizationTests
{
    [Fact]
    public async Task StartEncounter_ShouldFail_WhenMemberIsNotHost()
    {
        var realm = Realm.Create("realm", "Realm", "theme", RealmSettings.Default()).Value;
        var host = PartyMember.Create(realm.Id, "client-host", "GM", true);
        var member = PartyMember.Create(realm.Id, "client-member", "Member", false);
        realm.AddMember(host);
        realm.AddMember(member);
        realm.AddQuest("Quest A", "Desc");

        var repository = new FakeRealmRepository { Realm = realm };
        var handler = new EncounterCommandHandler(repository, new FakeRealmBroadcaster(), new FakeCommandDeduplicator());

        var quest = realm.Quests.First();
        var result = await handler.HandleAsync(new StartEncounterCommand(
            member.Id,
            realm.Id,
            "client-member",
            quest.Id,
            realm.Version,
            quest.Version));

        result.Success.Should().BeFalse();
        result.Error.Should().NotBeNull();
        result.Error!.ErrorCode.Should().Be("FORBIDDEN");
        repository.SaveChangesCalled.Should().BeFalse();
    }

    [Fact]
    public async Task ReorderQuests_ShouldFail_WhenMemberIsNotHost()
    {
        var realm = Realm.Create("realm", "Realm", "theme", RealmSettings.Default()).Value;
        var host = PartyMember.Create(realm.Id, "client-host", "GM", true);
        var member = PartyMember.Create(realm.Id, "client-member", "Member", false);
        realm.AddMember(host);
        realm.AddMember(member);
        realm.AddQuest("Quest A", "Desc");
        realm.AddQuest("Quest B", "Desc");

        var repository = new FakeRealmRepository { Realm = realm };
        var handler = new QuestCommandHandler(repository, new FakeRealmBroadcaster(), new FakeCommandDeduplicator(), new StubQuestNameGenerator());

        var result = await handler.HandleAsync(new ReorderQuestsCommand(
            member.Id,
            realm.Id,
            "client-member",
            realm.Quests.Select(q => q.Id).Reverse().ToList(),
            realm.QuestLogVersion));

        result.Success.Should().BeFalse();
        result.Error.Should().NotBeNull();
        result.Error!.ErrorCode.Should().Be("FORBIDDEN");
        repository.SaveChangesCalled.Should().BeFalse();
    }
}
