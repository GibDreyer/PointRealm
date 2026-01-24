using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Domain;

namespace PointRealm.Server.Infrastructure.Persistence;

public sealed class PointRealmDbContext(DbContextOptions<PointRealmDbContext> options) : DbContext(options)
{
    // DbSet<T> properties will be added here as domains are implemented.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PointRealmDbContext).Assembly);
        
        base.OnModelCreating(modelBuilder);
    }
}
