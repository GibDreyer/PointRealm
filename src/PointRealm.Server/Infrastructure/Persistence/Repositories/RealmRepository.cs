using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Domain.Entities;

namespace PointRealm.Server.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core implementation of IRealmRepository.
/// </summary>
public sealed class RealmRepository(PointRealmDbContext context) : IRealmRepository
{
    public async Task<Realm?> GetByIdWithRelationsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Realms
            .Include(r => r.Members)
            .Include(r => r.Quests)
            .Include(r => r.Encounters).ThenInclude(e => e.Votes)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<Realm?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Realms
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<Realm?> GetByCodeWithRelationsAsync(string code, CancellationToken cancellationToken = default)
    {
        return await context.Realms
            .Include(r => r.Members)
            .Include(r => r.Quests)
            .Include(r => r.Encounters).ThenInclude(e => e.Votes)
            .FirstOrDefaultAsync(r => r.Code == code, cancellationToken);
    }

    public async Task<Realm?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await context.Realms
            .FirstOrDefaultAsync(r => r.Code == code, cancellationToken);
    }

    public async Task<bool> ExistsByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await context.Realms
            .AnyAsync(r => r.Code == code, cancellationToken);
    }

    public async Task<IReadOnlyList<Realm>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await context.Realms
            .AsNoTracking()
            .Where(r => r.CreatedByUserId == userId || r.Members.Any(m => m.UserId == userId))
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Realm realm, CancellationToken cancellationToken = default)
    {
        await context.Realms.AddAsync(realm, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }
}
