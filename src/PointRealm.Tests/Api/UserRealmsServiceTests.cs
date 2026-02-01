using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Api.Services;
using Xunit;

namespace PointRealm.Tests.Api;

public class UserRealmsServiceTests
{
    [Fact]
    public async Task GetMyRealms_WithoutUserOrClientId_ReturnsProblem()
    {
        using var connection = ApiServiceTestHelpers.CreateInMemoryConnection();
        var options = ApiServiceTestHelpers.CreateOptions(connection);

        await using var dbContext = new PointRealm.Server.Infrastructure.Persistence.PointRealmDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var service = new UserRealmsService(dbContext);

        var result = await service.GetMyRealmsAsync(new System.Security.Claims.ClaimsPrincipal(), string.Empty);

        var problem = Assert.IsType<ObjectResult>(result);
        var details = Assert.IsType<ProblemDetails>(problem.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, details.Status);
        Assert.Equal("Auth.Required", details.Type);
    }
}
