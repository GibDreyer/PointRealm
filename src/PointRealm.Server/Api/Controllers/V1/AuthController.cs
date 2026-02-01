using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;
using System.Linq;

namespace PointRealm.Server.Api.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IUserTokenService tokenService,
    PointRealmDbContext dbContext) : ControllerBase
{
    private const int MaxProfileImageBytes = 1_048_576;

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
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
            return Ok(new AuthTokenResponse(
                tokenResult.AccessToken,
                tokenResult.ExpiresAt,
                MapUserProfile(user)));
        }

        return BadRequest(result.Errors);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await signInManager.PasswordSignInAsync(request.Email, request.Password, request.RememberMe, lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            return StatusCode(StatusCodes.Status423Locked, new { message = "Account is locked. Try again later or reset your password." });
        }

        if (result.Succeeded)
        {
            var user = await userManager.FindByEmailAsync(request.Email);
            if (user is null) return Unauthorized();

            var tokenResult = tokenService.GenerateToken(user);
            return Ok(new AuthTokenResponse(
                tokenResult.AccessToken,
                tokenResult.ExpiresAt,
                MapUserProfile(user)));
        }

        return Unauthorized();
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !await userManager.IsEmailConfirmedAsync(user))
        {
            return Ok(new { message = "If the account exists, a reset link will be sent." });
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        return Ok(new PasswordResetTokenResponse(user.Email ?? request.Email, token));
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return Ok(new { message = "If the account exists, the password has been reset." });
        }

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return Ok(new { message = "Password has been reset." });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return Ok();
    }

    [HttpGet("whoami")]
    [Authorize(AuthenticationSchemes = "Identity.Application,Bearer")]
    public async Task<IActionResult> WhoAmI()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();
        
        return Ok(MapUserProfile(user));
    }

    [HttpPut("profile")]
    [Authorize(AuthenticationSchemes = "Identity.Application,Bearer")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var profileImageUrl = string.IsNullOrWhiteSpace(request.ProfileImageUrl) ? null : request.ProfileImageUrl.Trim();
        var profileEmoji = string.IsNullOrWhiteSpace(request.ProfileEmoji) ? null : request.ProfileEmoji.Trim();

        if (!string.IsNullOrWhiteSpace(profileImageUrl) && IsDataUrl(profileImageUrl))
        {
            var estimatedBytes = EstimateDataUrlBytes(profileImageUrl);
            if (estimatedBytes > MaxProfileImageBytes)
            {
                return BadRequest(new { message = $"Profile image must be {MaxProfileImageBytes / 1024}KB or smaller." });
            }
        }

        user.DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? null : request.DisplayName.Trim();
        user.ProfileImageUrl = profileImageUrl;
        user.ProfileEmoji = profileEmoji;

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        if (!string.IsNullOrWhiteSpace(user.Id))
        {
            var members = dbContext.PartyMembers.Where(member => member.UserId == user.Id).ToList();
            foreach (var member in members)
            {
                member.UpdateProfileAvatar(user.ProfileImageUrl, user.ProfileEmoji);
            }

            if (members.Count > 0)
            {
                await dbContext.SaveChangesAsync();
            }
        }

        return Ok(MapUserProfile(user));
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
