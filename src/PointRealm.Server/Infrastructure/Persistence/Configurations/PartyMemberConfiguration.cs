using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PointRealm.Server.Domain.Entities;

namespace PointRealm.Server.Infrastructure.Persistence.Configurations;

public sealed class PartyMemberConfiguration : IEntityTypeConfiguration<PartyMember>
{
    public void Configure(EntityTypeBuilder<PartyMember> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.HasIndex(x => new { x.RealmId, x.ClientInstanceId }).IsUnique();

        builder.Property(x => x.ClientInstanceId).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(100);
        builder.Property(x => x.AvatarEmoji).HasMaxLength(16);
        builder.Property(x => x.ProfileEmoji).HasMaxLength(16);
        builder.Property(x => x.IsObserver).HasDefaultValue(false);
        builder.Property(x => x.IsBanned).HasDefaultValue(false);
        builder.Property(x => x.IsOnline).HasDefaultValue(true);
    }
}
