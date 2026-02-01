using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Api.Services;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController(IAuthApiService authService) : ControllerBase
{
    [HttpPost("register")]
    public Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        return authService.RegisterAsync(request);
    }

    [HttpPost("login")]
    public Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        return authService.LoginAsync(request);
    }

    [HttpPost("forgot-password")]
    public Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        return authService.ForgotPasswordAsync(request);
    }

    [HttpPost("reset-password")]
    public Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        return authService.ResetPasswordAsync(request);
    }

    [HttpPost("logout")]
    public Task<IActionResult> Logout()
    {
        return authService.LogoutAsync();
    }

    [HttpGet("whoami")]
    [Authorize(AuthenticationSchemes = "Identity.Application,Bearer")]
    public Task<IActionResult> WhoAmI()
    {
        return authService.WhoAmIAsync(User);
    }

    [HttpPut("profile")]
    [Authorize(AuthenticationSchemes = "Identity.Application,Bearer")]
    public Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        return authService.UpdateProfileAsync(User, request);
    }
}
