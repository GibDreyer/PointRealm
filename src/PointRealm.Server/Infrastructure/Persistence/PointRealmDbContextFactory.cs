using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace PointRealm.Server.Infrastructure.Persistence;

public class PointRealmDbContextFactory : IDesignTimeDbContextFactory<PointRealmDbContext>
{
    public PointRealmDbContext CreateDbContext(string[] args)
    {
        var currentDirectory = Directory.GetCurrentDirectory();
        
        // Try to find the solution root and then the Api project
        var searchDirectory = currentDirectory;
        string? apiPath = null;

        while (!string.IsNullOrEmpty(searchDirectory))
        {
            var potentialPath = Path.Combine(searchDirectory, "src", "PointRealm.Server", "Api");
            if (Directory.Exists(potentialPath))
            {
                apiPath = potentialPath;
                break;
            }

            // Also check if we are already inside the Server directory
            potentialPath = Path.Combine(searchDirectory, "Api");
            if (Directory.Exists(potentialPath) && File.Exists(Path.Combine(potentialPath, "PointRealm.Server.Api.csproj")))
            {
                apiPath = potentialPath;
                break;
            }

            var parent = Directory.GetParent(searchDirectory)?.FullName;
            if (parent == searchDirectory || parent == null) break;
            searchDirectory = parent;
        }

        if (apiPath == null)
        {
            // Fallback to current directory or Infrastructure's sibling
            if (currentDirectory.EndsWith("Infrastructure"))
            {
                apiPath = Path.GetFullPath(Path.Combine(currentDirectory, "..", "Api"));
            }
            else
            {
                apiPath = currentDirectory;
            }
        }

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiPath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var dbPath = configuration.GetValue<string>("POINTREALM_DB_PATH") ?? 
                     configuration["Database:Path"] ?? 
                     "./data/pointrealm.db";

        // Make sure it's absolute
        if (!Path.IsPathRooted(dbPath))
        {
            dbPath = Path.GetFullPath(Path.Combine(apiPath, dbPath));
        }

        // Ensure directory exists
        var directory = Path.GetDirectoryName(dbPath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        var optionsBuilder = new DbContextOptionsBuilder<PointRealmDbContext>();
        optionsBuilder.UseSqlite($"Data Source={dbPath}");

        return new PointRealmDbContext(optionsBuilder.Options);
    }
}
