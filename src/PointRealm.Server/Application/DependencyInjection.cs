using Microsoft.Extensions.DependencyInjection;
using PointRealm.Server.Application.Services;

namespace PointRealm.Server.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Change to use FluentValidation, MediatR etc as needed.
        services.AddScoped<IRealmHistoryService, RealmHistoryService>();
        services.AddScoped<IRealmSettingsService, RealmSettingsService>();

        return services;
    }
}
