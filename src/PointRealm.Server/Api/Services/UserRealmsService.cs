using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Services;

public interface IUserRealmsService
{
    Task<IActionResult> GetMyRealmsAsync(ClaimsPrincipal user, string clientId, CancellationToken cancellationToken = default);
}

public class UserRealmsService(PointRealmDbContext dbContext) : IUserRealmsService
{
    public async Task<IActionResult> GetMyRealmsAsync(ClaimsPrincipal user, string clientId, CancellationToken cancellationToken = default)
    {
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId) && string.IsNullOrWhiteSpace(clientId))
        {
            return ApiProblemDetailsFactory.CreateProblem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Authentication Required",
                detail: "Either user authentication or X-PointRealm-ClientId header is required.",
                type: "Auth.Required");
        }

        if (!string.IsNullOrWhiteSpace(userId))
        {
            var realms = await dbContext.Realms
                .AsNoTracking()
                .Include(r => r.Members)
                .Include(r => r.Quests)
                .Where(r => r.CreatedByUserId == userId || r.Members.Any(m => m.UserId == userId))
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(cancellationToken);

            var response = new UserRealmsResponse
            {
                Realms = realms.Select(r => new UserRealmListItem
                {
                    RealmCode = r.Code,
                    ThemeKey = r.Theme,
                    CreatedAt = r.CreatedAt,
                    MemberCount = r.Members.Count,
                    QuestCount = r.Quests.Count,
                    IsOwner = r.CreatedByUserId == userId,
                    LastAccessedAt = null
                }).ToList()
            };

            return new OkObjectResult(response);
        }

        var anonymousRealms = await dbContext.PartyMembers
            .AsNoTracking()
            .Include(m => m.Realm)
            .Where(m => m.ClientInstanceId == clientId)
            .Select(m => m.Realm)
            .Distinct()
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        var anonymousResponse = new AnonymousRealmsResponse
        {
            Realms = anonymousRealms.Select(r => new MinimalRealmInfo
            {
                RealmCode = r.Code,
                ThemeKey = r.Theme
            }).ToList()
        };

        return new OkObjectResult(anonymousResponse);
    }
}
