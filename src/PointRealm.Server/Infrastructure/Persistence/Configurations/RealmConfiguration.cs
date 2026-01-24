using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;

namespace PointRealm.Server.Infrastructure.Persistence.Configurations;

public sealed class RealmConfiguration : IEntityTypeConfiguration<Realm>
{
    public void Configure(EntityTypeBuilder<Realm> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.Code).IsUnique();

        builder.Property(x => x.Code).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Theme).HasMaxLength(100);

        builder.OwnsOne(x => x.Settings, settingsBuilder =>
        {
            settingsBuilder.Property(s => s.Deck)
                .HasConversion(
                    d => JsonSerializer.Serialize(d, JsonSerializerOptions.Default),
                    json => JsonSerializer.Deserialize<RuneDeck>(json, JsonSerializerOptions.Default)!);
            
            settingsBuilder.Property(s => s.AutoReveal);
            settingsBuilder.Property(s => s.AllowAbstain);
            settingsBuilder.Property(s => s.HideVoteCounts);
        });

        builder.HasMany(x => x.Quests)
            .WithOne()
            .HasForeignKey(x => x.RealmId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Encounters)
            .WithOne()
            .HasForeignKey("RealmId") // Implicit FK if we don't have navigation back to Realm on Encounter, but we do need it if we want cascade delete.
            .OnDelete(DeleteBehavior.Cascade); // Actually Encounter doesn't have RealmId in my initial plan, only linked via Quest?
            // Wait, Quest has RealmId. Encounter is linked to Quest. Or is it?
            // User request said: "Realm contains: ... Current quest and current encounter references".
            // Implementation plan: Realm has Encounters collection.
            // Encounter has QuestId.
            // If Encounter only links to Quest, how does Realm have a collection of Encounters efficiently?
            // The Realm entity has `_encounters` list. So EF needs to map this.
            // If I want Realm -> Encounters explicitly, Encounter needs a RealmId FK.
            // Let's check Encounter entity again.
    }
}
