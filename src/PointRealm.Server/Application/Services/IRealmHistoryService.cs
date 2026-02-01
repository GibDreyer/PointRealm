using PointRealm.Server.Domain.Entities;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Application.Services;

public interface IRealmHistoryService
{
    RealmHistoryResponse BuildRealmHistory(Realm realm);
}
