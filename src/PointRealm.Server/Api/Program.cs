using PointRealm.Server.Api.Infrastructure;
using PointRealm.Server.Application;
using PointRealm.Server.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration.GetConnectionString("DefaultConnection") ?? 
                       throw new InvalidOperationException("Connection string 'DefaultConnection' not found."));

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseExceptionHandler();

app.UseAuthorization();

app.MapControllers();

app.Run();
