using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Infrastructure.Auth;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Server.Infrastructure.Repositories;

namespace PointRealm.Server.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<RealmDbContext>(options =>
        {
            options.UseInMemoryDatabase("PointRealm");
        });

        services.AddScoped<IRealmRepository, RealmRepository>();
        services.AddSignalR();
        services.AddJwtAuthentication(configuration);

        return services;
    }
}
