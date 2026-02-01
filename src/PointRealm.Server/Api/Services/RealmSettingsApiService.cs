using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Application.Services;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Services;

public interface IRealmSettingsApiService
{
    Task<IActionResult> UpdateRealmSettingsAsync(string code, UpdateRealmSettingsRequest request, ClaimsPrincipal user, CancellationToken cancellationToken = default);
}

public class RealmSettingsApiService(
    PointRealmDbContext dbContext,
    IRealmSettingsService settingsService,
    IRealmAuthorizationService authService) : IRealmSettingsApiService
{
    public async Task<IActionResult> UpdateRealmSettingsAsync(string code, UpdateRealmSettingsRequest request, ClaimsPrincipal user, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return ApiProblemDetailsFactory.CreateProblem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid Realm Code",
                detail: "Realm code cannot be empty.",
                type: "Realm.InvalidCode");
        }

        var realm = await dbContext.Realms
            .FirstOrDefaultAsync(r => r.Code == code, cancellationToken);

        if (realm is null)
        {
            return ApiProblemDetailsFactory.CreateProblem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Realm Not Found",
                detail: $"No realm found with code '{code}'.",
                type: "Realm.NotFound");
        }

        if (!await CheckIsGmAsync(realm.Id, user))
        {
            return ApiProblemDetailsFactory.CreateProblem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Unauthorized",
                detail: "Only the GM can update realm settings.",
                type: "Realm.Unauthorized");
        }

        var newSettings = settingsService.BuildRealmSettings(request, realm.Settings);
        realm.UpdateSettings(newSettings);

        await dbContext.SaveChangesAsync(cancellationToken);

        return new OkObjectResult(settingsService.MapToSettingsDto(newSettings));
    }

    private async Task<bool> CheckIsGmAsync(Guid realmId, ClaimsPrincipal user)
    {
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null && await authService.IsGm(realmId, userId))
        {
            return true;
        }

        var memberIdValue = user.FindFirstValue("memberId");
        if (memberIdValue != null && Guid.TryParse(memberIdValue, out var memberId))
        {
            if (await authService.IsMemberGm(realmId, memberId))
            {
                return true;
            }
        }

        return false;
    }
}
