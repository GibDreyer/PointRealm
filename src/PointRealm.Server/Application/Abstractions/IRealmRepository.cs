using PointRealm.Server.Domain.Entities;

namespace PointRealm.Server.Application.Abstractions;

public interface IRealmRepository
{
    Task AddAsync(Realm realm, CancellationToken cancellationToken);
    Task<Realm?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
}
