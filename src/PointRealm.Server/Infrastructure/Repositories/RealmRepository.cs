using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Infrastructure.Persistence;

namespace PointRealm.Server.Infrastructure.Repositories;

public sealed class RealmRepository : IRealmRepository
{
    private readonly RealmDbContext _dbContext;

    public RealmRepository(RealmDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Realm realm, CancellationToken cancellationToken)
    {
        _dbContext.Realms.Add(realm);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task<Realm?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbContext.Realms.AsNoTracking().FirstOrDefaultAsync(realm => realm.Id == id, cancellationToken);
    }
}
