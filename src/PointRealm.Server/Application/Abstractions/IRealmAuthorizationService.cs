namespace PointRealm.Server.Application.Abstractions;

/// <summary>
/// Abstraction for realm authorization checks.
/// </summary>
public interface IRealmAuthorizationService
{
    /// <summary>
    /// Checks if the user (by Guid) is a GM for the specified realm.
    /// </summary>

    
    /// <summary>
    /// Checks if the user (by string ID) is a GM for the specified realm.
    /// </summary>
    Task<bool> IsGm(Guid realmId, string userId);
    
    /// <summary>
    /// Checks if the member is a GM for the specified realm.
    /// </summary>
    Task<bool> IsMemberGm(Guid realmId, Guid memberId);
}
