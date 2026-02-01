using PointRealm.Server.Domain.Entities;

namespace PointRealm.Server.Application.Abstractions;

/// <summary>
/// Result of user token generation.
/// </summary>
public record UserTokenResult(string AccessToken, DateTime ExpiresAt);

/// <summary>
/// Abstraction for generating tokens for authenticated users.
/// </summary>
public interface IUserTokenService
{
    /// <summary>
    /// Generates a JWT token for an authenticated user.
    /// </summary>
    UserTokenResult GenerateToken(ApplicationUser user);
}
