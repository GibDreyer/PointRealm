using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;

namespace PointRealm.Server.Infrastructure.Persistence.Configurations;

public sealed class RealmConfiguration : IEntityTypeConfiguration<Realm>
{
    public void Configure(EntityTypeBuilder<Realm> builder)
    {
        builder.ToTable("Realms");
        builder.HasKey(realm => realm.Id);

        builder.Property(realm => realm.Name)
            .HasConversion(name => name.Value, value => new RealmName(value))
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(realm => realm.Status)
            .HasConversion<string>()
            .HasMaxLength(24)
            .IsRequired();

        builder.Property(realm => realm.CreatedAt)
            .IsRequired();
    }
}
