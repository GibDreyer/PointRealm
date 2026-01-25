using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PointRealm.Server.Domain.Entities;

namespace PointRealm.Server.Infrastructure.Persistence.Configurations;

public sealed class EncounterConfiguration : IEntityTypeConfiguration<Encounter>
{
    public void Configure(EntityTypeBuilder<Encounter> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Version).IsConcurrencyToken().HasDefaultValue(0);

        // Encounter links to Quest
        builder.HasOne<Quest>()
            .WithMany()
            .HasForeignKey(x => x.QuestId)
            .OnDelete(DeleteBehavior.Cascade);

        // Encounter owns Votes
        builder.OwnsMany(x => x.Votes, voteBuilder =>
        {
            voteBuilder.WithOwner().HasForeignKey("EncounterId");
            
            voteBuilder.ToTable("Votes");
            
            voteBuilder.HasKey(v => v.Id);
            voteBuilder.Property(v => v.Id).ValueGeneratedNever();
            
            voteBuilder.Property(v => v.PartyMemberId);
            
            voteBuilder.OwnsOne(v => v.Value, valueBuilder =>
            {
                valueBuilder.Property(val => val.Label).HasColumnName("ValueLabel");
                valueBuilder.Property(val => val.Value).HasColumnName("ValueAmount");
            });
        });
        
        builder.Navigation(x => x.Votes)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
        
        // Relationship to Realm? In Realm.cs we have `_encounters` list.
        // If Encounter doesn't have RealmId property, we can use shadow property.
        // But RealmConfiguration already configured `HasMany(Encounters)`.
        // So we need to ensure the FK matches.
    }
}
