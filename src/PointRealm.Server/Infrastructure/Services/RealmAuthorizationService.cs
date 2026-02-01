using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Infrastructure.Persistence;

namespace PointRealm.Server.Infrastructure.Services;

public class RealmAuthorizationService(PointRealmDbContext dbContext) : IRealmAuthorizationService
{

    
    public async Task<bool> IsGm(Guid realmId, string userId)
    {
        if (string.IsNullOrEmpty(userId)) return false;

        var realm = await dbContext.Realms
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == realmId);

        if (realm is not null && realm.CreatedByUserId == userId)
        {
            return true;
        }
        
        // Check PartyMember
        var isHost = await dbContext.PartyMembers
            .AnyAsync(pm => pm.RealmId == realmId && pm.UserId == userId && pm.IsHost);
            
        return isHost;
    }

    public async Task<bool> IsMemberGm(Guid realmId, Guid memberId)
    {
        return await dbContext.PartyMembers
            .AnyAsync(pm => pm.Id == memberId && pm.RealmId == realmId && pm.IsHost);
    }
}
