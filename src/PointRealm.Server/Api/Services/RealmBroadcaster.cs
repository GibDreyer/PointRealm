using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Api.Hubs;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;
using PointRealm.Shared.V1.Realtime;

namespace PointRealm.Server.Api.Services;

public sealed class RealmBroadcaster : IRealmBroadcaster
{
    private readonly IHubContext<RealmHub, IRealmClient> _hubContext;
    private readonly PointRealmDbContext _dbContext;
    private readonly RealmStateMapper _mapper;

    public RealmBroadcaster(IHubContext<RealmHub, IRealmClient> hubContext, PointRealmDbContext dbContext, RealmStateMapper mapper)
    {
        _hubContext = hubContext;
        _dbContext = dbContext;
        _mapper = mapper;
    }

    public async Task BroadcastRealmStateAsync(Guid realmId)
    {
        var realm = await LoadRealmAsync(realmId);
        if (realm is null) return;
        var dto = _mapper.MapToRealmStateDto(realm);
        await _hubContext.Clients.Group(realmId.ToString()).RealmStateUpdated(dto);
    }

    public async Task SendRealmStateToConnectionAsync(string connectionId, Guid realmId)
    {
        var realm = await LoadRealmAsync(realmId);
        if (realm is null) return;
        var dto = _mapper.MapToRealmStateDto(realm);
        await _hubContext.Clients.Client(connectionId).RealmStateUpdated(dto);
    }

    public Task SendRealmSnapshotToConnectionAsync(string connectionId, LobbySnapshotDto snapshot)
    {
        return _hubContext.Clients.Client(connectionId).RealmSnapshot(snapshot);
    }

    private Task<Domain.Entities.Realm?> LoadRealmAsync(Guid realmId)
    {
        return _dbContext.Realms
            .Include(r => r.Members)
            .Include(r => r.Quests)
            .Include(r => r.Encounters).ThenInclude(e => e.Votes)
            .FirstOrDefaultAsync(r => r.Id == realmId);
    }
}
