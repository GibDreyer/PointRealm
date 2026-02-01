using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using PointRealm.Server.Infrastructure.Persistence;
using Xunit;

namespace PointRealm.Tests.Infrastructure;

public class PointRealmDbContextTests
{
    [Fact]
    public void DbContext_CanPersistRealm_InMemorySqlite()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<PointRealmDbContext>()
            .UseSqlite(connection)
            .Options;

        using (var context = new PointRealmDbContext(options))
        {
            context.Database.EnsureCreated();
            var realm = Realm.Create("realm", "Realm", "theme", RealmSettings.Default()).Value;
            context.Realms.Add(realm);
            context.SaveChanges();
        }

        using (var context = new PointRealmDbContext(options))
        {
            var savedRealm = context.Realms.SingleOrDefault(r => r.Code == "realm");
            savedRealm.Should().NotBeNull();
            savedRealm!.Name.Should().Be("Realm");
        }
    }
}
