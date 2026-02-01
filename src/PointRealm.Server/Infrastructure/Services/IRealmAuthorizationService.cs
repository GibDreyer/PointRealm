namespace PointRealm.Server.Infrastructure.Services;

public interface IRealmAuthorizationService
{
    Task<bool> IsGm(Guid realmId, string userId);
    Task<bool> IsMemberGm(Guid realmId, Guid memberId);
}
