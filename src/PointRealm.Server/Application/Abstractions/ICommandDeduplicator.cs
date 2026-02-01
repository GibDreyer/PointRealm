namespace PointRealm.Server.Application.Abstractions;

/// <summary>
/// Abstraction for command deduplication to prevent processing duplicate commands.
/// </summary>
public interface ICommandDeduplicator
{
    /// <summary>
    /// Tries to get a cached result for a previously executed command.
    /// </summary>
    bool TryGetResult(Guid memberId, Guid commandId, out object? payload);
    
    /// <summary>
    /// Stores the result of a command for future deduplication checks.
    /// </summary>
    void StoreResult(Guid memberId, Guid commandId, object? payload);
}
