using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Api.Services;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Domain.Entities;
using Xunit;

namespace PointRealm.Tests.Api;

public class AuthSessionServiceTests
{
    [Fact]
    public async Task RefreshAsync_ReturnsUnauthorized_WhenClaimMissing()
    {
        using var connection = ApiServiceTestHelpers.CreateInMemoryConnection();
        var options = ApiServiceTestHelpers.CreateOptions(connection);

        await using var dbContext = new PointRealm.Server.Infrastructure.Persistence.PointRealmDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var userManager = ApiServiceTestHelpers.CreateUserManager(dbContext);
        var tokenService = new StubUserTokenService();
        var service = new AuthSessionService(userManager, signInManager: null!, tokenService);

        var result = await service.RefreshAsync(new ClaimsPrincipal(new ClaimsIdentity()));

        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task RefreshAsync_ReturnsToken_WhenUserExists()
    {
        using var connection = ApiServiceTestHelpers.CreateInMemoryConnection();
        var options = ApiServiceTestHelpers.CreateOptions(connection);

        await using var dbContext = new PointRealm.Server.Infrastructure.Persistence.PointRealmDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var userManager = ApiServiceTestHelpers.CreateUserManager(dbContext);
        var user = new ApplicationUser { UserName = "refresh@example.com", Email = "refresh@example.com" };
        var createResult = await userManager.CreateAsync(user, "Password123!");
        Assert.True(createResult.Succeeded);

        var tokenService = new StubUserTokenService();
        var service = new AuthSessionService(userManager, signInManager: null!, tokenService);
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, user.Id) }));

        var result = await service.RefreshAsync(principal);

        var ok = Assert.IsType<OkObjectResult>(result);
        var payload = Assert.IsType<PointRealm.Shared.V1.Api.AuthTokenResponse>(ok.Value);
        Assert.Equal("stub-token", payload.AccessToken);
        Assert.Equal(user.Email, payload.User.Email);
    }

    private sealed class StubUserTokenService : IUserTokenService
    {
        public UserTokenResult GenerateToken(ApplicationUser user)
            => new("stub-token", DateTime.UtcNow.AddMinutes(30));
    }
}
