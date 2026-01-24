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
                    json => JsonSerializer.Deserialize<RuneDeck>(json, JsonSerializerOptions.Default)!,
                    new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<RuneDeck>(
                        (l, r) => JsonSerializer.Serialize(l, JsonSerializerOptions.Default) == JsonSerializer.Serialize(r, JsonSerializerOptions.Default),
                        v => v == null ? 0 : JsonSerializer.Serialize(v, JsonSerializerOptions.Default).GetHashCode(),
                        v => JsonSerializer.Deserialize<RuneDeck>(JsonSerializer.Serialize(v, JsonSerializerOptions.Default), JsonSerializerOptions.Default)!));
            
            settingsBuilder.Property(s => s.AutoReveal);
            settingsBuilder.Property(s => s.AllowAbstain);
            settingsBuilder.Property(s => s.HideVoteCounts);
        });

        builder.HasMany(x => x.Quests)
            .WithOne()
            .HasForeignKey(x => x.RealmId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(x => x.Quests)
            .HasField("_quests")
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasMany(x => x.Encounters)
            .WithOne()
            .HasForeignKey("RealmId")
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(x => x.Encounters)
            .HasField("_encounters")
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasMany(x => x.Members)
            .WithOne(x => x.Realm)
            .HasForeignKey(x => x.RealmId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(x => x.Members)
            .HasField("_members")
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
