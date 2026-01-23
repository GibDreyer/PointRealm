using Microsoft.Extensions.DependencyInjection;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Application.Services;
using PointRealm.Server.Application.Validators;

namespace PointRealm.Server.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IRealmService, RealmService>();
        services.AddSingleton<IRealmNameValidator, RealmNameValidator>();

        return services;
    }
}
