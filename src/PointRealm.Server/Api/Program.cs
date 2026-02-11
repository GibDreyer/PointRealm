using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using PointRealm.Server.Api.Infrastructure;
using PointRealm.Server.Api.Options;
using PointRealm.Server.Api.Services;
using PointRealm.Server.Api.Hubs;
using PointRealm.Server.Application;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Infrastructure;
using Scalar.AspNetCore;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration);

builder.Services.Configure<CommandDeduplicationOptions>(builder.Configuration.GetSection(CommandDeduplicationOptions.SectionName));

var dedupeOptions = builder.Configuration.GetSection(CommandDeduplicationOptions.SectionName).Get<CommandDeduplicationOptions>()
    ?? new CommandDeduplicationOptions();

if (string.Equals(dedupeOptions.Provider, CommandDeduplicationOptions.Providers.Redis, StringComparison.OrdinalIgnoreCase))
{
    var redisConnectionString = dedupeOptions.Redis.ConnectionString
        ?? builder.Configuration.GetConnectionString("Redis")
        ?? builder.Configuration["Redis:ConnectionString"];

    if (string.IsNullOrWhiteSpace(redisConnectionString))
    {
        throw new InvalidOperationException("Command deduplication provider is set to Redis, but no Redis connection string was configured.");
    }

    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnectionString;
        options.InstanceName = dedupeOptions.Redis.InstanceName;
    });

    builder.Services.AddScoped<ICommandDeduplicator>(sp =>
    {
        var options = sp.GetRequiredService<IOptions<CommandDeduplicationOptions>>().Value;
        return new DistributedCommandDeduplicator(
            sp.GetRequiredService<IDistributedCache>(),
            options.MaxEntriesPerMember,
            options.Window);
    });
}
else
{
    builder.Services.AddMemoryCache();
    builder.Services.AddScoped<ICommandDeduplicator>(sp =>
    {
        var options = sp.GetRequiredService<IOptions<CommandDeduplicationOptions>>().Value;
        return new InMemoryCommandDeduplicator(
            sp.GetRequiredService<IMemoryCache>(),
            options.MaxEntriesPerMember,
            options.Window);
    });
}

builder.Services.AddScoped<IRealmBroadcaster, RealmBroadcaster>();
builder.Services.AddScoped<IAuthSessionService, AuthSessionService>();
builder.Services.AddScoped<IAuthPasswordService, AuthPasswordService>();
builder.Services.AddScoped<IAuthProfileService, AuthProfileService>();
builder.Services.AddScoped<IRealmCreationService, RealmCreationService>();
builder.Services.AddScoped<IRealmSummaryService, RealmSummaryService>();
builder.Services.AddScoped<IRealmMembershipService, RealmMembershipService>();
builder.Services.AddScoped<IRealmSettingsApiService, RealmSettingsApiService>();
builder.Services.AddScoped<IUserRealmsService, UserRealmsService>();
builder.Services.AddScoped<IRealmHistoryApiService, RealmHistoryApiService>();
builder.Services.AddScoped<IQuestCsvApiService, QuestCsvApiService>();

builder.Services.AddHealthChecks()
    .AddDbContextCheck<PointRealm.Server.Infrastructure.Persistence.PointRealmDbContext>();

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

    options.AddDefaultPolicy(policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            // Production safeguard: don't allow credentials with wildcard origins
            policy.AllowAnyMethod()
                  .AllowAnyHeader();
        }
    });
});

var app = builder.Build();

var dbPath = app.Configuration.GetValue<string>("POINTREALM_DB_PATH") ?? 
                app.Configuration["Database:Path"] ?? 
                "./data/pointrealm.db";
if (Directory.Exists(dbPath))
{
    dbPath = Path.Combine(dbPath, "pointrealm.db");
}

var dbDirName = Path.GetDirectoryName(dbPath);
if (!string.IsNullOrEmpty(dbDirName))
{
    Directory.CreateDirectory(dbDirName);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    
    // Enable Scalar API Reference UI at /scalar/v1
    app.MapScalarApiReference();
}
else
{
    app.UseHttpsRedirection();
}

app.UseExceptionHandler();

app.UseWebSockets();
app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<RealmHub>("/hubs/realm");
app.MapHealthChecks("/health");
app.MapFallbackToFile("index.html");

app.Run();
