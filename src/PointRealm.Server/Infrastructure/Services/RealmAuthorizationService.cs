using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Infrastructure.Persistence;

namespace PointRealm.Server.Infrastructure.Services;

public class RealmAuthorizationService(PointRealmDbContext dbContext)
{
    public async Task<bool> IsGm(Guid realmId, Guid userId)
    {
        var realm = await dbContext.Realms
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == realmId);

        if (realm is null)
        {
            return false;
        }

        // 1. Check if user is the Owner
        // Note: Realm.CreatedByUserId is string in Identity usually, but we might store as Guid if we parse it.
        // IdentityUser Id is string. Let's assume we store it as string to match Identity, or Guid if we changed IdentityUser key type.
        // Standard IdentityUser key is string.
        // In Implementation Plan I said Guid? CreatedByUserId.
        // If ApplicationUser : IdentityUser, the Id is string.
        // I should probably use string for UserId in Realm and PartyMember to avoid conversion issues.
        
        // Let's assume string for now to be safe with default Identity.
        // Wait, I should verify ApplicationUser definition. It inherits IdentityUser which uses string by default.
        // So I should use string UserId.

        // However, in my plan I wrote Guid. I should adjust to string.
        
        // Check Owner
        if (realm.CreatedByUserId == userId.ToString()) return true; 

        // 2. Check if user is a Host PartyMember
        var isHost = await dbContext.PartyMembers
            .AnyAsync(pm => pm.RealmId == realmId && pm.UserId == userId.ToString() && pm.IsHost);
            
        return isHost;
    }
    
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
