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

        services.AddAuthentication(options =>
            {
                // Default to cookies for Identity (existing) but allow JWT for SignalR/API
                options.DefaultScheme = IdentityConstants.ApplicationScheme;
                options.DefaultChallengeScheme = IdentityConstants.ApplicationScheme;
            })
            .AddJwtBearer(options =>
            {
                var memberTokenSettings = configuration.GetSection(MemberTokenSettings.SectionName).Get<MemberTokenSettings>();
                var key = System.Text.Encoding.ASCII.GetBytes(memberTokenSettings!.Key);

                options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true
                };

                // SignalR sends access token in query string
                options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/realm"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });
            
        services.AddSignalR();

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
        
        services.Configure<MemberTokenSettings>(configuration.GetSection(MemberTokenSettings.SectionName));
        services.AddScoped<MemberTokenService>();
        services.AddScoped<RealmAuthorizationService>();
        services.AddScoped<RealmCodeGenerator>();
        services.AddScoped<QuestCsvService>();

        return services;
    }
}
