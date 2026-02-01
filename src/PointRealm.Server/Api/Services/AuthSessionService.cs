using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Domain.Entities;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Services;

public interface IAuthSessionService
{
    Task<IActionResult> RegisterAsync(RegisterRequest request);
    Task<IActionResult> LoginAsync(LoginRequest request);
    Task<IActionResult> LogoutAsync();
}

public class AuthSessionService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IUserTokenService tokenService) : IAuthSessionService
{
    public async Task<IActionResult> RegisterAsync(RegisterRequest request)
    {
        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName
        };
        var result = await userManager.CreateAsync(user, request.Password);

        if (result.Succeeded)
        {
            await signInManager.SignInAsync(user, isPersistent: false);
            var tokenResult = tokenService.GenerateToken(user);
            return new OkObjectResult(new AuthTokenResponse(
                tokenResult.AccessToken,
                tokenResult.ExpiresAt,
                MapUserProfile(user)));
        }

        return new BadRequestObjectResult(result.Errors);
    }

    public async Task<IActionResult> LoginAsync(LoginRequest request)
    {
        var result = await signInManager.PasswordSignInAsync(request.Email, request.Password, request.RememberMe, lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            return new ObjectResult(new { message = "Account is locked. Try again later or reset your password." })
            {
                StatusCode = StatusCodes.Status423Locked
            };
        }

        if (result.Succeeded)
        {
            var user = await userManager.FindByEmailAsync(request.Email);
            if (user is null)
            {
                return new UnauthorizedResult();
            }

            var tokenResult = tokenService.GenerateToken(user);
            return new OkObjectResult(new AuthTokenResponse(
                tokenResult.AccessToken,
                tokenResult.ExpiresAt,
                MapUserProfile(user)));
        }

        return new UnauthorizedResult();
    }

    public async Task<IActionResult> LogoutAsync()
    {
        await signInManager.SignOutAsync();
        return new OkResult();
    }

    private static UserProfileResponse MapUserProfile(ApplicationUser user)
    {
        return new UserProfileResponse(
            user.Id,
            user.Email ?? string.Empty,
            user.DisplayName,
            user.ProfileImageUrl,
            user.ProfileEmoji);
    }
}
