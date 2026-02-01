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
            // Check for 'Api' or 'PointRealm.Server.Api' folders
            var potentialPaths = new[] 
            {
                Path.Combine(searchDirectory, "src", "PointRealm.Server", "Api"),
                Path.Combine(searchDirectory, "src", "PointRealm.Server", "PointRealm.Server.Api"),
                Path.Combine(searchDirectory, "Api"),
                Path.Combine(searchDirectory, "PointRealm.Server.Api")
            };

            foreach (var potentialPath in potentialPaths)
            {
                if (Directory.Exists(potentialPath) && File.Exists(Path.Combine(potentialPath, "PointRealm.Server.Api.csproj")))
                {
                    apiPath = potentialPath;
                    break;
                }
            }

            if (apiPath != null) break;

            var parent = Directory.GetParent(searchDirectory)?.FullName;
            if (parent == searchDirectory || parent == null) break;
            searchDirectory = parent;
        }

        if (apiPath == null)
        {
            // Fallback to current directory or Infrastructure's sibling
            if (currentDirectory.EndsWith("Infrastructure"))
            {
                var siblingApi = Path.GetFullPath(Path.Combine(currentDirectory, "..", "Api"));
                var siblingFullApi = Path.GetFullPath(Path.Combine(currentDirectory, "..", "PointRealm.Server.Api"));
                
                apiPath = Directory.Exists(siblingFullApi) ? siblingFullApi : siblingApi;
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
        
        // Safety check: If dbPath is a directory, it's definitely wrong (likely an env var misconfiguration)
        if (Directory.Exists(dbPath))
        {
            dbPath = Path.Combine(dbPath, "pointrealm.db");
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
