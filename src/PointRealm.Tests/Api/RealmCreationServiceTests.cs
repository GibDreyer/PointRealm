using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Api.Services;
using PointRealm.Server.Application.Services;
using PointRealm.Tests.TestDoubles;
using PointRealm.Shared.V1.Api;
using Xunit;

namespace PointRealm.Tests.Api;

public class RealmCreationServiceTests
{
    [Fact]
    public async Task CreateRealm_UsesGeneratedCodeAndReturnsResponse()
    {
        using var connection = ApiServiceTestHelpers.CreateInMemoryConnection();
        var options = ApiServiceTestHelpers.CreateOptions(connection);

        await using var dbContext = new PointRealm.Server.Infrastructure.Persistence.PointRealmDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var service = new RealmCreationService(
            dbContext,
            new ApiServiceTestHelpers.StubCodeGenerator("ABC123"),
            new RealmSettingsService(),
            new StubQuestNameGenerator());

        var request = new CreateRealmRequest
        {
            RealmName = "New Realm",
            ThemeKey = "theme"
        };

        var result = await service.CreateRealmAsync(request, new System.Security.Claims.ClaimsPrincipal());

        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<CreateRealmResponse>(ok.Value);
        Assert.Equal("ABC123", response.Code);
        Assert.Equal("New Realm", response.Name);
    }
}
