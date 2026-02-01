using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PointRealm.Server.Application.Abstractions;

namespace PointRealm.Server.Infrastructure.Services;

public class MemberTokenService(IOptions<MemberTokenSettings> settings) : IMemberTokenService
{
    private readonly MemberTokenSettings _settings = settings.Value;

    public string GenerateToken(Guid memberId, Guid realmId, string role)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_settings.Key);
        
        var claims = new List<Claim>
        {
            new("memberId", memberId.ToString()),
            new("realmId", realmId.ToString()),
            new(ClaimTypes.Role, role)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(24), // Short lived, but enough for a session
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
