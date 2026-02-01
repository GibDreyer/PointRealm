using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using PointRealm.Server.Api.Services;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Application.Commands.Handlers;
using PointRealm.Server.Application.Services;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Infrastructure.Services;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;
using Xunit;

namespace PointRealm.Tests.Api;

public class ApiServiceTests
{
    [Fact]
    public async Task CreateRealm_UsesGeneratedCodeAndReturnsResponse()
    {
        using var connection = CreateInMemoryConnection();
        var options = CreateOptions(connection);

        await using var dbContext = new PointRealmDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var service = new RealmCreationService(
            dbContext,
            new StubCodeGenerator("ABC123"),
            new RealmSettingsService());

        var request = new CreateRealmRequest
        {
            RealmName = "New Realm",
            ThemeKey = "theme"
        };

        var result = await service.CreateRealmAsync(request, new ClaimsPrincipal());

        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<CreateRealmResponse>(ok.Value);
        Assert.Equal("ABC123", response.Code);
        Assert.Equal("New Realm", response.Name);
    }

    [Fact]
    public async Task GetMyRealms_WithoutUserOrClientId_ReturnsProblem()
    {
        using var connection = CreateInMemoryConnection();
        var options = CreateOptions(connection);

        await using var dbContext = new PointRealmDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var service = new UserRealmsService(dbContext);

        var result = await service.GetMyRealmsAsync(new ClaimsPrincipal(), string.Empty);

        var problem = Assert.IsType<ObjectResult>(result);
        var details = Assert.IsType<ProblemDetails>(problem.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, details.Status);
        Assert.Equal("Auth.Required", details.Type);
    }

    [Fact]
    public async Task JoinRealm_MissingClientId_ReturnsProblem()
    {
        using var connection = CreateInMemoryConnection();
        var options = CreateOptions(connection);

        await using var dbContext = new PointRealmDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var service = new RealmMembershipService(dbContext, new StubMemberTokenService(), CreateUserManager(dbContext));

        var result = await service.JoinRealmAsync("CODE", new JoinRealmRequest(), string.Empty, new ClaimsPrincipal());

        var problem = Assert.IsType<ObjectResult>(result);
        var details = Assert.IsType<ProblemDetails>(problem.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, details.Status);
        Assert.Equal("Auth.ClientIdRequired", details.Type);
    }

    [Fact]
    public async Task ImportQuestsCsv_WithNonCsvFile_ReturnsProblem()
    {
        using var connection = CreateInMemoryConnection();
        var options = CreateOptions(connection);

        await using var dbContext = new PointRealmDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var service = new QuestCsvApiService(
            dbContext,
            new QuestCsvService(),
            new ImportQuestsCommandHandler(new StubRealmRepository(), new QuestCsvService(), new StubRealmAuthorizationService()));

        var file = new FormFile(new MemoryStream(new byte[] { 0x1 }), 0, 1, "file", "quests.txt");
        var result = await service.ImportQuestsCsvAsync("CODE", file, new ClaimsPrincipal());

        var problem = Assert.IsType<ObjectResult>(result);
        var details = Assert.IsType<ProblemDetails>(problem.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, details.Status);
        Assert.Equal("Quest.InvalidFileType", details.Type);
    }

    [Fact]
    public async Task UpdateProfile_WithOversizedDataUrl_ReturnsBadRequest()
    {
        using var connection = CreateInMemoryConnection();
        var options = CreateOptions(connection);

        await using var dbContext = new PointRealmDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var userManager = CreateUserManager(dbContext);
        var user = new ApplicationUser { UserName = "user@example.com", Email = "user@example.com" };
        var createResult = await userManager.CreateAsync(user, "Password123!");
        Assert.True(createResult.Succeeded);

        var service = new AuthProfileService(userManager, dbContext);

        var oversizedLength = ((1_048_576 + 1) * 4 / 3) + 4;
        var dataUrl = $"data:image/png;base64,{new string('A', oversizedLength)}";

        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id)
        }));

        var result = await service.UpdateProfileAsync(principal, new UpdateProfileRequest
        {
            DisplayName = "New Name",
            ProfileImageUrl = dataUrl,
            ProfileEmoji = "🔥"
        });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    private static SqliteConnection CreateInMemoryConnection()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        return connection;
    }

    private static DbContextOptions<PointRealmDbContext> CreateOptions(SqliteConnection connection)
    {
        return new DbContextOptionsBuilder<PointRealmDbContext>()
            .UseSqlite(connection)
            .Options;
    }

    private static UserManager<ApplicationUser> CreateUserManager(PointRealmDbContext dbContext)
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

    private sealed class StubCodeGenerator(string code) : IRealmCodeGenerator
    {
        public Task<string> GenerateUniqueCodeAsync(CancellationToken cancellationToken = default) => Task.FromResult(code);
    }

    private sealed class StubMemberTokenService : IMemberTokenService
    {
        public string GenerateToken(Guid memberId, Guid realmId, string role) => "token";
    }

    private sealed class StubRealmRepository : IRealmRepository
    {
        public Task<Realm?> GetByCodeWithRelationsAsync(string code, CancellationToken cancellationToken = default) => Task.FromResult<Realm?>(null);
        public Task<Realm?> GetByIdWithRelationsAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<Realm?>(null);
        public Task<Realm?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<Realm?>(null);
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class StubRealmAuthorizationService : IRealmAuthorizationService
    {
        public Task<bool> IsGm(Guid realmId, string userId) => Task.FromResult(false);
        public Task<bool> IsMemberGm(Guid realmId, Guid memberId) => Task.FromResult(false);
    }
}
