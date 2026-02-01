using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;
using System.Security.Claims;

namespace PointRealm.Server.Api.Services;

public interface IAuthApiService
{
    Task<IActionResult> RegisterAsync(RegisterRequest request);
    Task<IActionResult> LoginAsync(LoginRequest request);
    Task<IActionResult> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<IActionResult> ResetPasswordAsync(ResetPasswordRequest request);
    Task<IActionResult> LogoutAsync();
    Task<IActionResult> WhoAmIAsync(ClaimsPrincipal user);
    Task<IActionResult> UpdateProfileAsync(ClaimsPrincipal user, UpdateProfileRequest request);
}

public class AuthApiService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IUserTokenService tokenService,
    PointRealmDbContext dbContext) : IAuthApiService
{
    private const int MaxProfileImageBytes = 1_048_576;

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

    public async Task<IActionResult> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !await userManager.IsEmailConfirmedAsync(user))
        {
            return new OkObjectResult(new { message = "If the account exists, a reset link will be sent." });
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        return new OkObjectResult(new PasswordResetTokenResponse(user.Email ?? request.Email, token));
    }

    public async Task<IActionResult> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return new OkObjectResult(new { message = "If the account exists, the password has been reset." });
        }

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            return new BadRequestObjectResult(result.Errors);
        }

        return new OkObjectResult(new { message = "Password has been reset." });
    }

    public async Task<IActionResult> LogoutAsync()
    {
        await signInManager.SignOutAsync();
        return new OkResult();
    }

    public async Task<IActionResult> WhoAmIAsync(ClaimsPrincipal user)
    {
        var currentUser = await userManager.GetUserAsync(user);
        if (currentUser is null)
        {
            return new UnauthorizedResult();
        }

        return new OkObjectResult(MapUserProfile(currentUser));
    }

    public async Task<IActionResult> UpdateProfileAsync(ClaimsPrincipal user, UpdateProfileRequest request)
    {
        var currentUser = await userManager.GetUserAsync(user);
        if (currentUser is null)
        {
            return new UnauthorizedResult();
        }

        var profileImageUrl = string.IsNullOrWhiteSpace(request.ProfileImageUrl) ? null : request.ProfileImageUrl.Trim();
        var profileEmoji = string.IsNullOrWhiteSpace(request.ProfileEmoji) ? null : request.ProfileEmoji.Trim();

        if (!string.IsNullOrWhiteSpace(profileImageUrl) && IsDataUrl(profileImageUrl))
        {
            var estimatedBytes = EstimateDataUrlBytes(profileImageUrl);
            if (estimatedBytes > MaxProfileImageBytes)
            {
                return new BadRequestObjectResult(new { message = $"Profile image must be {MaxProfileImageBytes / 1024}KB or smaller." });
            }
        }

        currentUser.DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? null : request.DisplayName.Trim();
        currentUser.ProfileImageUrl = profileImageUrl;
        currentUser.ProfileEmoji = profileEmoji;

        var result = await userManager.UpdateAsync(currentUser);
        if (!result.Succeeded)
        {
            return new BadRequestObjectResult(result.Errors);
        }

        if (!string.IsNullOrWhiteSpace(currentUser.Id))
        {
            var members = dbContext.PartyMembers.Where(member => member.UserId == currentUser.Id).ToList();
            foreach (var member in members)
            {
                member.UpdateProfileAvatar(currentUser.ProfileImageUrl, currentUser.ProfileEmoji);
            }

            if (members.Count > 0)
            {
                await dbContext.SaveChangesAsync();
            }
        }

        return new OkObjectResult(MapUserProfile(currentUser));
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

    private static bool IsDataUrl(string value)
    {
        return value.StartsWith("data:", StringComparison.OrdinalIgnoreCase);
    }

    private static int EstimateDataUrlBytes(string dataUrl)
    {
        var commaIndex = dataUrl.IndexOf(',');
        if (commaIndex < 0 || commaIndex == dataUrl.Length - 1)
        {
            return 0;
        }

        var base64 = dataUrl[(commaIndex + 1)..];
        var padding = 0;
        if (base64.EndsWith("==", StringComparison.Ordinal))
        {
            padding = 2;
        }
        else if (base64.EndsWith("=", StringComparison.Ordinal))
        {
            padding = 1;
        }

        var base64Length = base64.Length;
        return (base64Length * 3 / 4) - padding;
    }
}
