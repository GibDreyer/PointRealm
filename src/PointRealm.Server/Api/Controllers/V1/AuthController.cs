using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Infrastructure.Services;

namespace PointRealm.Server.Api.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    UserTokenService tokenService) : ControllerBase
{
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

        user.DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? null : request.DisplayName.Trim();
        user.ProfileImageUrl = string.IsNullOrWhiteSpace(request.ProfileImageUrl) ? null : request.ProfileImageUrl.Trim();

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return Ok(MapUserProfile(user));
    }

    private static UserProfileResponse MapUserProfile(ApplicationUser user)
    {
        return new UserProfileResponse(
            user.Id,
            user.Email ?? string.Empty,
            user.DisplayName,
            user.ProfileImageUrl);
    }
}

public record RegisterRequest(string Email, string Password, string? DisplayName);
public record LoginRequest(string Email, string Password, bool RememberMe);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);
public record PasswordResetTokenResponse(string Email, string Token);
public record UpdateProfileRequest(string? DisplayName, string? ProfileImageUrl);
public record UserProfileResponse(string Id, string Email, string? DisplayName, string? ProfileImageUrl);
public record AuthTokenResponse(string AccessToken, DateTime ExpiresAt, UserProfileResponse User);
