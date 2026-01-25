using PointRealm.Server.Domain.ValueObjects;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Application.Services;

public interface IRealmSettingsService
{
    RealmSettings BuildRealmSettings(RealmSettingsRequest? request, RealmSettings? existing = null);
    RealmSettingsDto MapToSettingsDto(RealmSettings settings);
}
