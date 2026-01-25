using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Domain;
using PointRealm.Server.Domain.Entities;

namespace PointRealm.Server.Infrastructure.Persistence;

public sealed class PointRealmDbContext(DbContextOptions<PointRealmDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Realm> Realms { get; set; }
    public DbSet<Quest> Quests { get; set; }
    public DbSet<Encounter> Encounters { get; set; }
    public DbSet<PartyMember> PartyMembers { get; set; }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyConcurrencyTokens();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ApplyConcurrencyTokens();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PointRealmDbContext).Assembly);
        
        base.OnModelCreating(modelBuilder);
    }

    private void ApplyConcurrencyTokens()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified))
            {
                continue;
            }

            switch (entry.Entity)
            {
                case Realm:
                case Quest:
                case Encounter:
                    var versionProperty = entry.Property("Version");
                    if (versionProperty.Metadata.ClrType == typeof(int))
                    {
                        var current = (int)(versionProperty.CurrentValue ?? 0);
                        versionProperty.CurrentValue = current + 1;
                    }
                    break;
            }
        }
    }
}
