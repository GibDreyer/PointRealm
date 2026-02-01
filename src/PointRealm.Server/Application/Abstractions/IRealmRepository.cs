using PointRealm.Server.Domain.Entities;

namespace PointRealm.Server.Application.Abstractions;

/// <summary>
/// Repository abstraction for Realm aggregate operations.
/// </summary>
public interface IRealmRepository
{
    /// <summary>
    /// Gets a realm by its unique identifier with all related data (eager loading).
    /// </summary>
    Task<Realm?> GetByIdWithRelationsAsync(Guid id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets a realm by its unique identifier (no eager loading).
    /// </summary>
    Task<Realm?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets a realm by its join code with all related data (eager loading).
    /// </summary>
    Task<Realm?> GetByCodeWithRelationsAsync(string code, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets a realm by its join code (no eager loading).
    /// </summary>
    Task<Realm?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Checks if a realm with the given code exists.
    /// </summary>
    Task<bool> ExistsByCodeAsync(string code, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets all realms for a user (as owner or member).
    /// </summary>
    Task<IReadOnlyList<Realm>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Adds a new realm.
    /// </summary>
    Task AddAsync(Realm realm, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Saves all changes to the database.
    /// </summary>
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
