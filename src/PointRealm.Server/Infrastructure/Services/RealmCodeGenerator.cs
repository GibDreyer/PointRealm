using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Infrastructure.Persistence;

namespace PointRealm.Server.Infrastructure.Services;

/// <summary>
/// Service for generating short, collision-resistant realm join codes.
/// </summary>
public class RealmCodeGenerator(PointRealmDbContext dbContext) : IRealmCodeGenerator
{
    private const string Alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Excluding 0, O, 1, I for readability
    private const int CodeLength = 6;
    private const int MaxAttempts = 10;

    /// <summary>
    /// Generates a unique, short realm code that doesn't collide with existing codes.
    /// </summary>
    public async Task<string> GenerateUniqueCodeAsync(CancellationToken cancellationToken = default)
    {
        for (int attempt = 0; attempt < MaxAttempts; attempt++)
        {
            var code = GenerateCode();
            
            var exists = await dbContext.Realms
                .AnyAsync(r => r.Code == code, cancellationToken);
            
            if (!exists)
            {
                return code;
            }
        }
        
        // If we couldn't generate a unique code after max attempts, increase the length
        return GenerateCodeWithLength(CodeLength + 1);
    }

    private static string GenerateCode()
    {
        return GenerateCodeWithLength(CodeLength);
    }

    private static string GenerateCodeWithLength(int length)
    {
        var random = new Random();
        var chars = new char[length];
        
        for (int i = 0; i < length; i++)
        {
            chars[i] = Alphabet[random.Next(Alphabet.Length)];
        }
        
        return new string(chars);
    }
}
