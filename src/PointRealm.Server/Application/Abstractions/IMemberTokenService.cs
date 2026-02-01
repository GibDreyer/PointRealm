namespace PointRealm.Server.Application.Abstractions;

/// <summary>
/// Abstraction for generating tokens for party members.
/// </summary>
public interface IMemberTokenService
{
    /// <summary>
    /// Generates a JWT token for a party member.
    /// </summary>
    string GenerateToken(Guid memberId, Guid realmId, string role);
}
