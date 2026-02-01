using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Application.Services;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Services;

public interface IRealmSummaryService
{
    Task<IActionResult> GetRealmSummaryAsync(string code, CancellationToken cancellationToken = default);
}

public class RealmSummaryService(
    PointRealmDbContext dbContext,
    IRealmSettingsService settingsService) : IRealmSummaryService
{
    public async Task<IActionResult> GetRealmSummaryAsync(string code, CancellationToken cancellationToken = default)
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
            .AsNoTracking()
            .Include(r => r.Members)
            .Include(r => r.Quests)
            .FirstOrDefaultAsync(r => r.Code == code, cancellationToken);

        if (realm is null)
        {
            return ApiProblemDetailsFactory.CreateProblem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Realm Not Found",
                detail: $"No realm found with code '{code}'.",
                type: "Realm.NotFound");
        }

        var response = new RealmSummaryResponse
        {
            Code = realm.Code,
            Name = realm.Name,
            ThemeKey = realm.Theme,
            Settings = settingsService.MapToSettingsDto(realm.Settings),
            MemberCount = realm.Members.Count,
            QuestCount = realm.Quests.Count,
            CreatedAt = realm.CreatedAt
        };

        return new OkObjectResult(response);
    }
}
