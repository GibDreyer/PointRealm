using FluentAssertions;
using PointRealm.Server.Application.Commands.Handlers;
using PointRealm.Server.Application.Commands.Quest;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using Xunit;

namespace PointRealm.Tests.Application;

public class QuestCommandHandlerTests
{
    [Fact]
    public async Task ReorderQuests_ShouldUpdateOrderAndQuestLogVersion()
    {
        var realm = Realm.Create("realm", "Realm", "theme", RealmSettings.Default()).Value;
        var host = PartyMember.Create(realm.Id, "client-host", "GM", true);
        realm.AddMember(host);
        realm.AddQuest("Quest A", "Desc");
        realm.AddQuest("Quest B", "Desc");
        realm.AddQuest("Quest C", "Desc");

        var originalQuestLogVersion = realm.QuestLogVersion;
        var questOrder = new List<Guid>
        {
            realm.Quests.Single(q => q.Title == "Quest C").Id,
            realm.Quests.Single(q => q.Title == "Quest A").Id,
            realm.Quests.Single(q => q.Title == "Quest B").Id
        };

        var repository = new FakeRealmRepository { Realm = realm };
        var handler = new QuestCommandHandler(repository, new FakeRealmBroadcaster(), new FakeCommandDeduplicator());

        var result = await handler.HandleAsync(new ReorderQuestsCommand(
            host.Id,
            realm.Id,
            "client-host",
            questOrder,
            originalQuestLogVersion));

        result.Success.Should().BeTrue();
        realm.QuestLogVersion.Should().Be(originalQuestLogVersion + 1);
        realm.Quests.OrderBy(q => q.OrderIndex).Select(q => q.Id).Should().Equal(questOrder);
        repository.SaveChangesCalled.Should().BeTrue();
    }
}
