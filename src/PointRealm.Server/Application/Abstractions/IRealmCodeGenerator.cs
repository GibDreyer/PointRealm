namespace PointRealm.Server.Application.Abstractions;

/// <summary>
/// Abstraction for generating unique realm codes.
/// </summary>
public interface IRealmCodeGenerator
{
    /// <summary>
    /// Generates a unique realm code that doesn't collide with existing codes.
    /// </summary>
    Task<string> GenerateUniqueCodeAsync(CancellationToken cancellationToken = default);
}
