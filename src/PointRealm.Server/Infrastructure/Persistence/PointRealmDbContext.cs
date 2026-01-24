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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PointRealmDbContext).Assembly);
        
        base.OnModelCreating(modelBuilder);
    }
}
