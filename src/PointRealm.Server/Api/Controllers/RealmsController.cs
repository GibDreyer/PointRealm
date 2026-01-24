using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Domain.ValueObjects;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Server.Infrastructure.Services;

namespace PointRealm.Server.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RealmsController(PointRealmDbContext dbContext, RealmAuthorizationService authService, MemberTokenService tokenService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRealmRequest request)
    {
        var settings = RealmSettings.Default(); // Or from request
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        var result = Realm.Create(request.Code, request.Theme, settings, userId);
        
        if (result.IsFailure)
        {
            return BadRequest(result.Error);
        }

        dbContext.Realms.Add(result.Value);
        
        // If user is logged in, add them as host/member automatically? 
        // Or "GM" is determined by CreatedByUserId.
        // PartyMember concept is separate. Usually creator joins as host.
        if (userId is not null)
        {
             // Add creator as party member (Host)
             var member = PartyMember.Create(result.Value.Id, request.ClientInstanceId ?? "web", "GM", true, userId);
             result.Value.AddMember(member);
        }

        await dbContext.SaveChangesAsync();

        return Ok(result.Value.Id);
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> List()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        // Find realms where user is owner OR a member
        var realms = await dbContext.Realms
            .AsNoTracking()
            .Where(r => r.CreatedByUserId == userId || r.Members.Any(m => m.UserId == userId))
            .ToListAsync();
            
        return Ok(realms);
    }

    [HttpPost("{code}/join")]
    public async Task<IActionResult> Join(string code, [FromBody] JoinRealmRequest request)
    {
        if (string.IsNullOrWhiteSpace(code)) return BadRequest("Realm code is required.");
        
        var clientId = Request.Headers["X-PointRealm-ClientId"].ToString();
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return BadRequest("X-PointRealm-ClientId header is required.");
        }

        var realm = await dbContext.Realms
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r => r.Code == code);

        if (realm is null)
        {
            return NotFound("Realm not found.");
        }

        PartyMember? member;
        var existingMember = realm.Members.FirstOrDefault(m => m.ClientInstanceId == clientId);

        if (existingMember is not null)
        {
            member = existingMember;
        }
        else
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            // Default role logic: if first member (?) or just Participant. 
            // Usually creator is Host. Joiners are Participants.
            // Request can ask for Observer.
            
            member = PartyMember.Create(realm.Id, clientId, request.DisplayName ?? "Anonymous", false, userId);
            realm.AddMember(member);
            await dbContext.SaveChangesAsync();
        }

        var role = member.IsHost ? "Host" : "Participant"; // Simple role mapping for now
        var token = tokenService.GenerateToken(member.Id, realm.Id, role);

        return Ok(new JoinRealmResponse(token, member.Id, realm.Id, role));
    }

    [HttpPost("{id}/gm-action")]
    public async Task<IActionResult> GmAction(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        // Use RealmAuthorizationService
        // Allow if user is GM (Owner or Host Member)
        
        // Note: For anonymous GM (e.g. joined as Host with ClientInstanceId but no Auth), handling is trickier.
        // But requirement says: "GM actions require GM role within realm ... GM is determined per realm membership"
        // And "Logged in users can list..."
        // If anonymous, they leverage ClientInstanceId/ConnectionId usually? 
        // But Identity provides ClaimsPrincipal.
        // If Anonymous, User.Identity.IsAuthenticated is false.
        
        // We will assume this endpoint requires Auth OR some other mechanism. 
        // For now, let's implement the check for Logged In user.
        
        if (userId == null) return Unauthorized();

        var isGm = await authService.IsGm(id, userId);
        if (!isGm)
        {
            return Forbid();
        }

        return Ok("GM Action Executed");
    }
}

public record CreateRealmRequest(string Code, string Theme, string? ClientInstanceId);
public record JoinRealmRequest(string? DisplayName);
public record JoinRealmResponse(string MemberToken, Guid MemberId, Guid RealmId, string Role);
