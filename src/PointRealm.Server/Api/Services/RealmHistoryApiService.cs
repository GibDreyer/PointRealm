using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Application.Services;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Services;

public interface IRealmHistoryApiService
{
    Task<IActionResult> GetRealmHistoryAsync(string code, CancellationToken cancellationToken = default);
}

public class RealmHistoryApiService(
    PointRealmDbContext dbContext,
    IRealmHistoryService historyService) : IRealmHistoryApiService
{
    public async Task<IActionResult> GetRealmHistoryAsync(string code, CancellationToken cancellationToken = default)
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
            .Include(r => r.Quests)
            .Include(r => r.Encounters)
                .ThenInclude(e => e.Votes)
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r => r.Code == code, cancellationToken);

        if (realm is null)
        {
            return ApiProblemDetailsFactory.CreateProblem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Realm Not Found",
                detail: $"No realm found with code '{code}'.",
                type: "Realm.NotFound");
        }

        var response = historyService.BuildRealmHistory(realm);

        return new OkObjectResult(response);
    }
}
