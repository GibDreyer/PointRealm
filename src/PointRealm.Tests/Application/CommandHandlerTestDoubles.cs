using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Domain.Entities;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Tests.Application;

internal sealed class FakeRealmRepository : IRealmRepository
{
    public Realm? Realm { get; set; }
    public bool SaveChangesCalled { get; private set; }

    public Task<Realm?> GetByIdWithRelationsAsync(Guid id, CancellationToken cancellationToken = default)
        => Task.FromResult(Realm?.Id == id ? Realm : null);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SaveChangesCalled = true;
        return Task.CompletedTask;
    }

    public Task<Realm?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => Task.FromResult(Realm?.Id == id ? Realm : null);

    public Task<Realm?> GetByCodeWithRelationsAsync(string code, CancellationToken cancellationToken = default)
        => Task.FromResult(Realm?.Code == code ? Realm : null);

    public Task<Realm?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
        => Task.FromResult(Realm?.Code == code ? Realm : null);

    public Task<bool> ExistsByCodeAsync(string code, CancellationToken cancellationToken = default)
        => Task.FromResult(Realm?.Code == code);

    public Task<IReadOnlyList<Realm>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<Realm>>(Realm is null ? Array.Empty<Realm>() : new[] { Realm });

    public Task AddAsync(Realm realm, CancellationToken cancellationToken = default)
    {
        Realm = realm;
        return Task.CompletedTask;
    }
}

internal sealed class FakeRealmBroadcaster : IRealmBroadcaster
{
    public int BroadcastCalls { get; private set; }
    public int SnapshotCalls { get; private set; }
    public int StateToConnectionCalls { get; private set; }

    public Task BroadcastRealmStateAsync(Guid realmId)
    {
        BroadcastCalls++;
        return Task.CompletedTask;
    }

    public Task SendRealmStateToConnectionAsync(string connectionId, Guid realmId)
    {
        StateToConnectionCalls++;
        return Task.CompletedTask;
    }

    public Task SendRealmSnapshotToConnectionAsync(string connectionId, LobbySnapshotDto snapshot)
    {
        SnapshotCalls++;
        return Task.CompletedTask;
    }
}

internal sealed class FakeCommandDeduplicator : ICommandDeduplicator
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
