using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Domain.Entities;

namespace PointRealm.Server.Infrastructure.Services;

public class UserTokenService(IOptions<UserTokenSettings> settings, IOptions<MemberTokenSettings> memberSettings) : IUserTokenService
{
    private readonly UserTokenSettings _settings = settings.Value;
    private readonly MemberTokenSettings _memberSettings = memberSettings.Value;

    public UserTokenResult GenerateToken(ApplicationUser user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var keyValue = string.IsNullOrWhiteSpace(_settings.Key) ? _memberSettings.Key : _settings.Key;
        if (string.IsNullOrWhiteSpace(keyValue))
        {
            throw new InvalidOperationException("User token signing key is not configured.");
        }
        var key = Encoding.ASCII.GetBytes(keyValue);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new("token_type", "user")
        };

        if (!string.IsNullOrWhiteSpace(user.DisplayName))
        {
            claims.Add(new("displayName", user.DisplayName));
        }

        var expiresAt = DateTime.UtcNow.AddHours(_settings.ExpirationHours);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAt,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return new UserTokenResult(tokenHandler.WriteToken(token), expiresAt);
    }
}
