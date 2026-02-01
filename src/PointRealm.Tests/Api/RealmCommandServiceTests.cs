using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Application.Commands;
using PointRealm.Server.Application.Commands.Encounter;
using PointRealm.Server.Application.Commands.Handlers;
using PointRealm.Server.Application.Commands.Quest;
using PointRealm.Server.Application.Services;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Server.Infrastructure.Persistence.Repositories;
using PointRealm.Shared.V1.Api;
using PointRealm.Shared.V1.Realtime;
using Xunit;

namespace PointRealm.Tests.Api;

public class RealmCommandServiceTests
{
    [Fact]
    public async Task UpdateQuest_WithConcurrencyConflict_ReturnsStaleAndSendsSnapshot()
    {
        using var connection = CreateInMemoryConnection();
        var options = CreateOptions(connection);

        Guid realmId;
        Guid memberId;
        Guid questId;
        int questVersion;

        using (var setup = new PointRealmDbContext(options))
        {
            setup.Database.EnsureCreated();
            var realm = Realm.Create("realm", "Dark", "theme", RealmSettings.Default()).Value;
            var gm = PartyMember.Create(realm.Id, "client", "GM", true);
            realm.AddMember(gm);
            realm.AddQuest("Quest", "Desc");
            setup.Realms.Add(realm);
            setup.PartyMembers.Add(gm);
            setup.SaveChanges();

            realmId = realm.Id;
            memberId = gm.Id;
            questId = realm.Quests.First().Id;
            questVersion = realm.Quests.First().Version;
        }

        using var context1 = new PointRealmDbContext(options);
        using var context2 = new PointRealmDbContext(options);

        var realm1 = await context1.Realms
            .Include(r => r.Members)
            .Include(r => r.Quests)
            .Include(r => r.Encounters).ThenInclude(e => e.Votes)
            .FirstAsync(r => r.Id == realmId);

        var realm2 = await context2.Realms
            .Include(r => r.Quests)
            .FirstAsync(r => r.Id == realmId);

        realm2.UpdateQuest(questId, "Updated", "New Desc");
        await context2.SaveChangesAsync();

        var broadcaster = new TestBroadcaster();
        var service = new RealmCommandService(context1, broadcaster, new NoOpDeduplicator());

        var result = await service.UpdateQuestAsync(
            new RealmCommandContext(memberId, realmId, "conn-1"),
            new UpdateQuestRequest
            {
                QuestId = questId,
                Title = "Stale",
                Description = "Desc",
                QuestVersion = questVersion
            });

        Assert.False(result.Success);
        Assert.Equal("STALE_STATE", result.Error?.ErrorCode);
        Assert.Equal(1, broadcaster.StateSentToConnectionCount);
    }

    [Fact]
    public async Task ReorderQuests_WithMissingOrDuplicateIds_FailsValidation()
    {
        using var connection = CreateInMemoryConnection();
        var options = CreateOptions(connection);

        Guid realmId;
        Guid memberId;
        List<Guid> questIds;
        int questLogVersion;

        using (var setup = new PointRealmDbContext(options))
        {
            setup.Database.EnsureCreated();
            var realm = Realm.Create("realm", "Dark", "theme", RealmSettings.Default()).Value;
            var gm = PartyMember.Create(realm.Id, "client", "GM", true);
            realm.AddMember(gm);
            realm.AddQuest("Quest 1", "Desc");
            realm.AddQuest("Quest 2", "Desc");
            setup.Realms.Add(realm);
            setup.PartyMembers.Add(gm);
            setup.SaveChanges();

            realmId = realm.Id;
            memberId = gm.Id;
            questIds = realm.Quests.Select(q => q.Id).ToList();
            questLogVersion = realm.QuestLogVersion;
        }

        using var context = new PointRealmDbContext(options);
        var broadcaster = new TestBroadcaster();
        var service = new RealmCommandService(context, broadcaster, new NoOpDeduplicator());

        var result = await service.ReorderQuestsAsync(
            new RealmCommandContext(memberId, realmId, "conn-1"),
            new ReorderQuestsRequest
            {
                NewOrder = new List<Guid> { questIds[0], questIds[0] },
                QuestLogVersion = questLogVersion
            });

        Assert.False(result.Success);
        Assert.Equal("Realm.InvalidQuestOrder", result.Error?.ErrorCode);
    }

    [Fact]
    public async Task SelectRune_AfterReveal_IsRejected()
    {
        using var connection = CreateInMemoryConnection();
        var options = CreateOptions(connection);

        Guid realmId;
        Guid memberId;
        int encounterVersion;

        using (var setup = new PointRealmDbContext(options))
        {
            setup.Database.EnsureCreated();
            var realm = Realm.Create("realm", "Dark", "theme", RealmSettings.Default()).Value;
            var member = PartyMember.Create(realm.Id, "client", "Member", false);
            realm.AddMember(member);
            realm.AddQuest("Quest", "Desc");
            realm.StartEncounter(realm.CurrentQuestId!.Value);
            var encounter = realm.Encounters.First();
            encounter.Reveal();
            setup.Realms.Add(realm);
            setup.PartyMembers.Add(member);
            setup.SaveChanges();

            realmId = realm.Id;
            memberId = member.Id;
            encounterVersion = encounter.Version;
        }

        using var context = new PointRealmDbContext(options);
        var broadcaster = new TestBroadcaster();
        var service = new RealmCommandService(context, broadcaster, new NoOpDeduplicator());

        var result = await service.SelectRuneAsync(
            new RealmCommandContext(memberId, realmId, "conn-1"),
            new SelectRuneRequest { Value = "1", EncounterVersion = encounterVersion });

        Assert.False(result.Success);
        Assert.Equal("Encounter.AlreadyRevealed", result.Error?.ErrorCode);
    }

    [Fact]
    public void VoteSecrecy_BeforeReveal_DoesNotExposeValues()
    {
        var realm = Realm.Create("realm", "Dark", "theme", RealmSettings.Default()).Value;
        var member = PartyMember.Create(realm.Id, "client", "Member", false);
        realm.AddMember(member);
        realm.AddQuest("Quest", "Desc");
        realm.StartEncounter(realm.CurrentQuestId!.Value);
        var encounter = realm.Encounters.First();
        encounter.CastVote(member.Id, new RuneCardValue("1", 1));

        var mapper = new RealmStateMapper();
        var dto = mapper.MapToRealmStateDto(realm);

        Assert.NotNull(dto.Encounter);
        Assert.Empty(dto.Encounter!.Votes);
        Assert.True(dto.Encounter.HasVoted[member.Id]);
    }

    [Fact]
    public async Task GmCommands_RequireGmRole()
    {
        using var connection = CreateInMemoryConnection();
        var options = CreateOptions(connection);

        Guid realmId;
        Guid memberId;
        int encounterVersion;

        using (var setup = new PointRealmDbContext(options))
        {
            setup.Database.EnsureCreated();
            var realm = Realm.Create("realm", "Dark", "theme", RealmSettings.Default()).Value;
            var member = PartyMember.Create(realm.Id, "client", "Member", false);
            realm.AddMember(member);
            realm.AddQuest("Quest", "Desc");
            realm.StartEncounter(realm.CurrentQuestId!.Value);
            setup.Realms.Add(realm);
            setup.PartyMembers.Add(member);
            setup.SaveChanges();

            realmId = realm.Id;
            memberId = member.Id;
            encounterVersion = realm.Encounters.First().Version;
        }

        using var context = new PointRealmDbContext(options);
        var broadcaster = new TestBroadcaster();
        var service = new RealmCommandService(context, broadcaster, new NoOpDeduplicator());
        var ctx = new RealmCommandContext(memberId, realmId, "conn-1");

        var reveal = await service.RevealProphecyAsync(ctx, new RevealProphecyRequest { EncounterVersion = encounterVersion });
        var reroll = await service.ReRollFatesAsync(ctx, new ReRollFatesRequest { EncounterVersion = encounterVersion });
        var seal = await service.SealOutcomeAsync(ctx, new SealOutcomeRequest { EncounterVersion = encounterVersion, FinalValue = 1 });

        Assert.Equal("FORBIDDEN", reveal.Error?.ErrorCode);
        Assert.Equal("FORBIDDEN", reroll.Error?.ErrorCode);
        Assert.Equal("FORBIDDEN", seal.Error?.ErrorCode);
    }

    [Fact]
    public async Task Diagnostic_Repository_ShouldFindMember()
    {
        using var connection = CreateInMemoryConnection();
        var options = CreateOptions(connection);

        Guid realmId;
        Guid memberId;

        using (var setup = new PointRealmDbContext(options))
        {
            setup.Database.EnsureCreated();
            var realm = Realm.Create("realm", "Dark", "theme", RealmSettings.Default()).Value;
            var member = PartyMember.Create(realm.Id, "client", "Member", false);
            realm.AddMember(member);
            setup.Realms.Add(realm);
            setup.PartyMembers.Add(member);
            setup.SaveChanges();
            realmId = realm.Id;
            memberId = member.Id;
        }

        using var context = new PointRealmDbContext(options);
        var repo = new RealmRepository(context);
        var realmLoaded = await repo.GetByIdWithRelationsAsync(realmId);
        
        Assert.NotNull(realmLoaded);
        Assert.Contains(realmLoaded!.Members, m => m.Id == memberId);
    }

    private static SqliteConnection CreateInMemoryConnection()
    {
        var connection = new SqliteConnection("Filename=:memory:");
        connection.Open();
        return connection;
    }

    private static DbContextOptions<PointRealmDbContext> CreateOptions(SqliteConnection connection)
    {
        return new DbContextOptionsBuilder<PointRealmDbContext>()
            .UseSqlite(connection)
            .EnableSensitiveDataLogging()
            .Options;
    }

    private sealed class TestBroadcaster : IRealmBroadcaster
    {
        public int BroadcastCount { get; private set; }
        public int StateSentToConnectionCount { get; private set; }

        public Task BroadcastRealmStateAsync(Guid realmId)
        {
            BroadcastCount++;
            return Task.CompletedTask;
        }

        public Task SendRealmStateToConnectionAsync(string connectionId, Guid realmId)
        {
            StateSentToConnectionCount++;
            return Task.CompletedTask;
        }

        public Task SendRealmSnapshotToConnectionAsync(string connectionId, PointRealm.Shared.V1.Api.LobbySnapshotDto snapshot)
            => Task.CompletedTask;
    }

    private sealed class NoOpDeduplicator : ICommandDeduplicator
    {
        public bool TryGetResult(Guid memberId, Guid commandId, out object? payload)
        {
            payload = null;
            return false;
        }

        public void StoreResult(Guid memberId, Guid commandId, object? payload)
        {
        }
    }

    private sealed class RealmCommandService(
        PointRealmDbContext context,
        IRealmBroadcaster broadcaster,
        ICommandDeduplicator deduplicator)
    {
        private readonly QuestCommandHandler _questHandler = new(new RealmRepository(context), broadcaster, deduplicator);
        private readonly EncounterCommandHandler _encounterHandler = new(new RealmRepository(context), broadcaster, deduplicator);

        public Task<CommandResultDto> UpdateQuestAsync(RealmCommandContext ctx, UpdateQuestRequest req)
            => _questHandler.HandleAsync(new UpdateQuestCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, req.QuestId, req.Title, req.Description, null, null, req.QuestVersion, null));

        public Task<CommandResultDto> ReorderQuestsAsync(RealmCommandContext ctx, ReorderQuestsRequest req)
            => _questHandler.HandleAsync(new ReorderQuestsCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, req.NewOrder, req.QuestLogVersion, null));

        public Task<CommandResultDto> SelectRuneAsync(RealmCommandContext ctx, SelectRuneRequest req)
            => _encounterHandler.HandleAsync(new SelectRuneCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, req.Value, req.EncounterVersion, null));

        public Task<CommandResultDto> RevealProphecyAsync(RealmCommandContext ctx, RevealProphecyRequest req)
            => _encounterHandler.HandleAsync(new RevealProphecyCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, req.EncounterVersion, null));

        public Task<CommandResultDto> ReRollFatesAsync(RealmCommandContext ctx, ReRollFatesRequest req)
            => _encounterHandler.HandleAsync(new ReRollFatesCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, req.EncounterVersion, null));

        public Task<CommandResultDto> SealOutcomeAsync(RealmCommandContext ctx, SealOutcomeRequest req)
            => _encounterHandler.HandleAsync(new SealOutcomeCommand(ctx.MemberId, ctx.RealmId, ctx.ClientId, req.FinalValue, req.EncounterVersion, null));
    }
}
