using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PointRealm.Server.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using PointRealm.Server.Domain.Entities;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Configuration;
using PointRealm.Server.Infrastructure.Services;

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

        services.AddIdentity<ApplicationUser, IdentityRole>()
            .AddEntityFrameworkStores<PointRealmDbContext>()
            .AddDefaultTokenProviders();

        services.Configure<CookieAuthenticationOptions>(IdentityConstants.ApplicationScheme, options =>
        {
            options.Cookie.HttpOnly = true;
            options.ExpireTimeSpan = TimeSpan.FromDays(30);
            options.SlidingExpiration = true;
            options.Events.OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = 401;
                return Task.CompletedTask;
            };
        });
        
        services.AddScoped<RealmAuthorizationService>();

        return services;
    }
}
