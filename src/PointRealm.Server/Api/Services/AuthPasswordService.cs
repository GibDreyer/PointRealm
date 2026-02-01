using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Domain.Entities;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Services;

public interface IAuthPasswordService
{
    Task<IActionResult> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<IActionResult> ResetPasswordAsync(ResetPasswordRequest request);
}

public class AuthPasswordService(UserManager<ApplicationUser> userManager) : IAuthPasswordService
{
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
}
