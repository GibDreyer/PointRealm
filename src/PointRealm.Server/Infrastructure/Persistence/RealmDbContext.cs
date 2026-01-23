using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Domain.Entities;

namespace PointRealm.Server.Infrastructure.Persistence;

public sealed class RealmDbContext : DbContext
{
    public RealmDbContext(DbContextOptions<RealmDbContext> options)
        : base(options)
    {
    }

    public DbSet<Realm> Realms => Set<Realm>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(RealmDbContext).Assembly);
    }
}
