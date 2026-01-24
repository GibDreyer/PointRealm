using PointRealm.Server.Api.Infrastructure;
using PointRealm.Server.Api.Hubs;
using PointRealm.Server.Application;
using PointRealm.Server.Infrastructure;

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

var app = builder.Build();

var dbPath = app.Configuration.GetValue<string>("POINTREALM_DB_PATH") ?? 
                app.Configuration["Database:Path"] ?? 
                "./data/pointrealm.db";
Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseExceptionHandler();

app.UseAuthorization();

app.MapControllers();
app.MapHub<RealmHub>("/hubs/realm");
app.MapHealthChecks("/health");

app.Run();
