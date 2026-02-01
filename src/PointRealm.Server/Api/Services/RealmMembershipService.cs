using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Services;

public interface IRealmMembershipService
{
    Task<IActionResult> JoinRealmAsync(string code, JoinRealmRequest request, string clientId, ClaimsPrincipal user, CancellationToken cancellationToken = default);
}

public class RealmMembershipService(
    PointRealmDbContext dbContext,
    IMemberTokenService tokenService,
    UserManager<ApplicationUser> userManager) : IRealmMembershipService
{
    public async Task<IActionResult> JoinRealmAsync(string code, JoinRealmRequest request, string clientId, ClaimsPrincipal user, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return ApiProblemDetailsFactory.CreateProblem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Client Id Required",
                detail: "X-PointRealm-ClientId header is required.",
                type: "Auth.ClientIdRequired");
        }

        var realm = await dbContext.Realms
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

        var member = await dbContext.PartyMembers
            .FirstOrDefaultAsync(m => m.RealmId == realm.Id && m.ClientInstanceId == clientId, cancellationToken);

        if (member is null)
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            var isHost = request.Role?.Equals("GM", StringComparison.OrdinalIgnoreCase) ?? false;
            var isObserver = request.Role?.Equals("Observer", StringComparison.OrdinalIgnoreCase) ?? false;

            member = PartyMember.Create(realm.Id, clientId, request.DisplayName, isHost, userId, isObserver);
            if (!string.IsNullOrWhiteSpace(userId))
            {
                var identityUser = await userManager.FindByIdAsync(userId);
                if (identityUser is not null)
                {
                    member.UpdateProfileAvatar(identityUser.ProfileImageUrl, identityUser.ProfileEmoji);
                }
            }
            dbContext.PartyMembers.Add(member);

            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("UNIQUE") == true)
            {
                member = await dbContext.PartyMembers
                    .FirstAsync(m => m.RealmId == realm.Id && m.ClientInstanceId == clientId, cancellationToken);
            }
        }

        var role = member.IsHost ? "GM" : (member.IsObserver ? "Observer" : (request.Role ?? "Participant"));
        var token = tokenService.GenerateToken(member.Id, realm.Id, role);

        return new OkObjectResult(new JoinRealmResponse
        {
            MemberToken = token,
            MemberId = member.Id.ToString(),
            RealmCode = realm.Code,
            RealmName = realm.Name,
            ThemeKey = realm.Theme,
            Role = role
        });
    }
}
