using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Services;

public interface IAuthProfileService
{
    Task<IActionResult> WhoAmIAsync(ClaimsPrincipal user);
    Task<IActionResult> UpdateProfileAsync(ClaimsPrincipal user, UpdateProfileRequest request);
}

public class AuthProfileService(
    UserManager<ApplicationUser> userManager,
    PointRealmDbContext dbContext) : IAuthProfileService
{
    private const int MaxProfileImageBytes = 1_048_576;

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
