using PointRealm.Server.Api.Infrastructure;
using PointRealm.Server.Api.Hubs;
using PointRealm.Server.Application;
using PointRealm.Server.Infrastructure;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration);

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
Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);

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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<RealmHub>("/hubs/realm");
app.MapHealthChecks("/health");

app.Run();
