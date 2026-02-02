using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Api.Services;
using Xunit;

namespace PointRealm.Tests.Api;

public class RealmMembershipServiceTests
{
    [Fact]
    public async Task JoinRealm_MissingClientId_ReturnsProblem()
    {
        using var connection = ApiServiceTestHelpers.CreateInMemoryConnection();
        var options = ApiServiceTestHelpers.CreateOptions(connection);

        await using var dbContext = new PointRealm.Server.Infrastructure.Persistence.PointRealmDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var service = new RealmMembershipService(
            dbContext,
            new ApiServiceTestHelpers.StubMemberTokenService(),
            ApiServiceTestHelpers.CreateUserManager(dbContext));

        var result = await service.JoinRealmAsync("CODE", new PointRealm.Shared.V1.Api.JoinRealmRequest() { DisplayName = "Test" }, string.Empty, new System.Security.Claims.ClaimsPrincipal());

        var problem = Assert.IsType<ObjectResult>(result);
        var details = Assert.IsType<ProblemDetails>(problem.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, details.Status);
        Assert.Equal("Auth.ClientIdRequired", details.Type);
    }
}
