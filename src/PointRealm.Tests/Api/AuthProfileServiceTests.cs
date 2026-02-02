using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Api.Services;
using PointRealm.Server.Domain.Entities;
using PointRealm.Shared.V1.Api;
using Xunit;

namespace PointRealm.Tests.Api;

public class AuthProfileServiceTests
{
    [Fact]
    public async Task UpdateProfile_WithOversizedDataUrl_ReturnsBadRequest()
    {
        using var connection = ApiServiceTestHelpers.CreateInMemoryConnection();
        var options = ApiServiceTestHelpers.CreateOptions(connection);

        await using var dbContext = new PointRealm.Server.Infrastructure.Persistence.PointRealmDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var userManager = ApiServiceTestHelpers.CreateUserManager(dbContext);
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

        var result = await service.UpdateProfileAsync(
            principal,
            new UpdateProfileRequest("New Name", dataUrl, "🔥"));

        Assert.IsType<BadRequestObjectResult>(result);
    }
}
