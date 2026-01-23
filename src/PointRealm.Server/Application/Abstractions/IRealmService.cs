using PointRealm.Server.Common;
using PointRealm.Server.Contracts;

namespace PointRealm.Server.Application.Abstractions;

public interface IRealmService
{
    Task<Result<RealmDto>> CreateAsync(string name, CancellationToken cancellationToken);
    Task<Result<RealmDto>> GetAsync(Guid id, CancellationToken cancellationToken);
}
