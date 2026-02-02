using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Infrastructure.Persistence;

namespace PointRealm.Tests.Api;

public static class ApiServiceTestHelpers
{
    public static SqliteConnection CreateInMemoryConnection()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        return connection;
    }

    public static DbContextOptions<PointRealmDbContext> CreateOptions(SqliteConnection connection)
    {
        return new DbContextOptionsBuilder<PointRealmDbContext>()
            .UseSqlite(connection)
            .Options;
    }

    public static UserManager<ApplicationUser> CreateUserManager(PointRealmDbContext dbContext)
    {
        var store = new UserStore<ApplicationUser, IdentityRole, PointRealmDbContext>(dbContext);
        var identityOptions = Options.Create(new IdentityOptions());
        var passwordHasher = new PasswordHasher<ApplicationUser>();
        var userValidators = new List<IUserValidator<ApplicationUser>> { new UserValidator<ApplicationUser>() };
        var passwordValidators = new List<IPasswordValidator<ApplicationUser>> { new PasswordValidator<ApplicationUser>() };
        var normalizer = new UpperInvariantLookupNormalizer();
        var describer = new IdentityErrorDescriber();

        return new UserManager<ApplicationUser>(
            store,
            identityOptions,
            passwordHasher,
            userValidators,
            passwordValidators,
            normalizer,
            describer,
            null,
            NullLogger<UserManager<ApplicationUser>>.Instance);
    }

    public sealed class StubCodeGenerator(string code) : IRealmCodeGenerator
    {
        public Task<string> GenerateUniqueCodeAsync(CancellationToken cancellationToken = default) => Task.FromResult(code);
    }

    public sealed class StubMemberTokenService : IMemberTokenService
    {
        public string GenerateToken(Guid memberId, Guid realmId, string role) => "token";
    }

    public sealed class StubRealmRepository : IRealmRepository
    {
        public Task<Realm?> GetByCodeWithRelationsAsync(string code, CancellationToken cancellationToken = default) => Task.FromResult<Realm?>(null);
        public Task<Realm?> GetByIdWithRelationsAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<Realm?>(null);
        public Task<Realm?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<Realm?>(null);
        public Task<Realm?> GetByCodeAsync(string code, CancellationToken cancellationToken = default) => Task.FromResult<Realm?>(null);
        public Task<bool> ExistsByCodeAsync(string code, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task<IReadOnlyList<Realm>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<Realm>>(new List<Realm>());
        public Task AddAsync(Realm realm, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    public sealed class StubRealmAuthorizationService : IRealmAuthorizationService
    {
        public Task<bool> IsGm(Guid realmId, string userId) => Task.FromResult(false);
        public Task<bool> IsMemberGm(Guid realmId, Guid memberId) => Task.FromResult(false);
    }

    public sealed class StubRealmBroadcaster : IRealmBroadcaster
    {
        public Task BroadcastRealmStateAsync(Guid realmId) => Task.CompletedTask;
        public Task SendRealmStateToConnectionAsync(string connectionId, Guid realmId) => Task.CompletedTask;
        public Task SendRealmSnapshotToConnectionAsync(string connectionId, Shared.V1.Api.LobbySnapshotDto snapshot) => Task.CompletedTask;
    }
}
