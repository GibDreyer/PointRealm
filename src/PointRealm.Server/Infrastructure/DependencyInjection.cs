using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PointRealm.Server.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using PointRealm.Server.Domain.Entities;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Configuration;
using PointRealm.Server.Infrastructure.Services;
using Microsoft.IdentityModel.Tokens;
using System.Text;

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
        services.Configure<IdentityOptions>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequiredLength = 12;
            options.Password.RequiredUniqueChars = 4;
            options.Lockout.AllowedForNewUsers = true;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.MaxFailedAccessAttempts = 5;
        });

        services.AddAuthentication(options =>
            {
                // Default to cookies for Identity (existing) but allow JWT for SignalR/API
                options.DefaultScheme = IdentityConstants.ApplicationScheme;
                options.DefaultChallengeScheme = IdentityConstants.ApplicationScheme;
            })
            .AddJwtBearer(options =>
            {
                var memberTokenSection = configuration.GetSection(MemberTokenSettings.SectionName);
                var memberTokenSettings = memberTokenSection.Get<MemberTokenSettings>();
                
                string memberKeyStr = memberTokenSettings?.Key ?? configuration["MemberToken:Key"] ?? string.Empty;
                var userTokenSection = configuration.GetSection(UserTokenSettings.SectionName);
                var userTokenSettings = userTokenSection.Get<UserTokenSettings>();
                string userKeyStr = userTokenSettings?.Key ?? configuration["UserToken:Key"] ?? memberKeyStr;
                if (string.IsNullOrWhiteSpace(memberKeyStr) || string.IsNullOrWhiteSpace(userKeyStr))
                {
                    throw new InvalidOperationException("MemberToken and UserToken signing keys must be configured.");
                }
                var keyBytes = new[] { memberKeyStr, userKeyStr }
                    .Where(key => !string.IsNullOrWhiteSpace(key))
                    .Distinct()
                    .Select(key => new SymmetricSecurityKey(Encoding.ASCII.GetBytes(key)))
                    .ToArray();

                options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKeyResolver = (_, _, _, _) => keyBytes,
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
        services.Configure<UserTokenSettings>(configuration.GetSection(UserTokenSettings.SectionName));
        services.AddScoped<MemberTokenService>();
        services.AddScoped<UserTokenService>();
        services.AddScoped<RealmAuthorizationService>();
        services.AddScoped<RealmCodeGenerator>();
        services.AddScoped<QuestCsvService>();

        return services;
    }
}
