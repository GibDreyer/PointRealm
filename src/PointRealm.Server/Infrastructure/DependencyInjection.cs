using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PointRealm.Server.Infrastructure.Persistence;

using Microsoft.Extensions.Configuration;

namespace PointRealm.Server.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var dbPath = configuration.GetValue<string>("POINTREALM_DB_PATH") ?? 
                     configuration["Database:Path"] ?? 
                     "./data/pointrealm.db";

        services.AddDbContext<PointRealmDbContext>(options =>
            // Directory is ensured in Program.cs
            options.UseSqlite($"Data Source={dbPath}"));

        return services;
    }
}
