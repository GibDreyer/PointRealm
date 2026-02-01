using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Application.Commands.Handlers;
using PointRealm.Server.Application.Commands.Quest;
using PointRealm.Server.Application.Services;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Services;

public interface IRealmApiService
{
    Task<IActionResult> CreateRealmAsync(CreateRealmRequest request, ClaimsPrincipal user, CancellationToken cancellationToken = default);
    Task<IActionResult> GetRealmSummaryAsync(string code, CancellationToken cancellationToken = default);
    Task<IActionResult> JoinRealmAsync(string code, JoinRealmRequest request, string clientId, ClaimsPrincipal user, CancellationToken cancellationToken = default);
    Task<IActionResult> UpdateRealmSettingsAsync(string code, UpdateRealmSettingsRequest request, ClaimsPrincipal user, CancellationToken cancellationToken = default);
    Task<IActionResult> GetMyRealmsAsync(ClaimsPrincipal user, string clientId, CancellationToken cancellationToken = default);
    Task<IActionResult> GetRealmHistoryAsync(string code, CancellationToken cancellationToken = default);
    Task<IActionResult> ImportQuestsCsvAsync(string code, IFormFile file, ClaimsPrincipal user, CancellationToken cancellationToken = default);
    Task<IActionResult> ExportQuestsCsvAsync(string code, CancellationToken cancellationToken = default);
}

public class RealmApiService(
    PointRealmDbContext dbContext,
    IRealmCodeGenerator codeGenerator,
    IRealmSettingsService settingsService,
    IRealmHistoryService historyService,
    IRealmAuthorizationService authService,
    IQuestCsvService csvService,
    IMemberTokenService tokenService,
    UserManager<ApplicationUser> userManager,
    ImportQuestsCommandHandler importQuestsHandler) : IRealmApiService
{
    private const string DefaultTheme = "dark-fantasy-arcane";

    public async Task<IActionResult> CreateRealmAsync(CreateRealmRequest request, ClaimsPrincipal user, CancellationToken cancellationToken = default)
    {
        var code = await codeGenerator.GenerateUniqueCodeAsync(cancellationToken);

        var theme = string.IsNullOrWhiteSpace(request.ThemeKey)
            ? DefaultTheme
            : request.ThemeKey;

        var settings = settingsService.BuildRealmSettings(request.Settings);

        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

        var result = Realm.Create(code, request.RealmName, theme, settings, userId);

        if (result.IsFailure)
        {
            return CreateProblem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Realm Creation Failed",
                detail: result.Error.Description,
                type: result.Error.Code);
        }

        var realm = result.Value;
        dbContext.Realms.Add(realm);

        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new CreateRealmResponse
        {
            Code = realm.Code,
            Name = realm.Name,
            JoinUrl = $"/realm/{realm.Code}",
            ThemeKey = realm.Theme,
            Settings = settingsService.MapToSettingsDto(realm.Settings)
        };

        return new OkObjectResult(response);
    }

    public async Task<IActionResult> GetRealmSummaryAsync(string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return CreateProblem(
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
            return CreateProblem(
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

    public async Task<IActionResult> JoinRealmAsync(string code, JoinRealmRequest request, string clientId, ClaimsPrincipal user, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return CreateProblem(
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
            return CreateProblem(
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

    public async Task<IActionResult> UpdateRealmSettingsAsync(string code, UpdateRealmSettingsRequest request, ClaimsPrincipal user, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return CreateProblem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid Realm Code",
                detail: "Realm code cannot be empty.",
                type: "Realm.InvalidCode");
        }

        var realm = await dbContext.Realms
            .FirstOrDefaultAsync(r => r.Code == code, cancellationToken);

        if (realm is null)
        {
            return CreateProblem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Realm Not Found",
                detail: $"No realm found with code '{code}'.",
                type: "Realm.NotFound");
        }

        if (!await CheckIsGmAsync(realm.Id, user))
        {
            return CreateProblem(
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

    public async Task<IActionResult> GetMyRealmsAsync(ClaimsPrincipal user, string clientId, CancellationToken cancellationToken = default)
    {
        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId) && string.IsNullOrWhiteSpace(clientId))
        {
            return CreateProblem(
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

    public async Task<IActionResult> GetRealmHistoryAsync(string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return CreateProblem(
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
            return CreateProblem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Realm Not Found",
                detail: $"No realm found with code '{code}'.",
                type: "Realm.NotFound");
        }

        var response = historyService.BuildRealmHistory(realm);

        return new OkObjectResult(response);
    }

    public async Task<IActionResult> ImportQuestsCsvAsync(string code, IFormFile file, ClaimsPrincipal user, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return CreateProblem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid Realm Code",
                detail: "Realm code cannot be empty.",
                type: "Realm.InvalidCode");
        }

        if (file == null || file.Length == 0)
        {
            return CreateProblem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid File",
                detail: "CSV file is required.",
                type: "Quest.InvalidCsv");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".csv")
        {
            return CreateProblem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid File Type",
                detail: "Only CSV files are accepted.",
                type: "Quest.InvalidFileType");
        }

        var realm = await dbContext.Realms
            .Select(r => new { r.Id, r.Code })
            .FirstOrDefaultAsync(r => r.Code == code, cancellationToken);

        if (realm is null)
        {
            return CreateProblem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Realm Not Found",
                detail: $"No realm found with code '{code}'.",
                type: "Realm.NotFound");
        }

        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        using var stream = file.OpenReadStream();
        var command = new ImportQuestsCommand(realm.Id, stream, userId);

        var result = await importQuestsHandler.HandleAsync(command, cancellationToken);

        if (result.IsFailure)
        {
            var error = result.Error;
            if (error.Code == "Realm.Unauthorized")
            {
                return CreateProblem(StatusCodes.Status403Forbidden, "Unauthorized", error.Description, error.Code);
            }
            if (error.Code == "Realm.NotFound")
            {
                return CreateProblem(StatusCodes.Status404NotFound, "NotFound", error.Description, error.Code);
            }

            return CreateProblem(StatusCodes.Status400BadRequest, "Import Failed", error.Description, error.Code);
        }

        return new OkObjectResult(result.Value);
    }

    public async Task<IActionResult> ExportQuestsCsvAsync(string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return CreateProblem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid Realm Code",
                detail: "Realm code cannot be empty.",
                type: "Realm.InvalidCode");
        }

        var realm = await dbContext.Realms
            .AsNoTracking()
            .Include(r => r.Quests)
            .Include(r => r.Encounters)
            .FirstOrDefaultAsync(r => r.Code == code, cancellationToken);

        if (realm is null)
        {
            return CreateProblem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Realm Not Found",
                detail: $"No realm found with code '{code}'.",
                type: "Realm.NotFound");
        }

        var csvRows = realm.Quests.OrderBy(q => q.Order).Select(quest =>
        {
            var sealedEncounter = realm.Encounters
                .Where(e => e.QuestId == quest.Id && e.Outcome.HasValue)
                .OrderByDescending(e => e.Id)
                .FirstOrDefault();

            return new QuestCsvRow
            {
                Title = quest.Title,
                Description = quest.Description,
                ExternalId = quest.ExternalId,
                ExternalUrl = quest.ExternalUrl,
                Order = quest.Order,
                SealedOutcome = sealedEncounter?.Outcome
            };
        }).ToList();

        var csvBytes = csvService.GenerateCsv(csvRows);
        var fileName = $"quests-{code}-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv";

        return new FileContentResult(csvBytes, "text/csv")
        {
            FileDownloadName = fileName
        };
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

    private static ObjectResult CreateProblem(int statusCode, string title, string detail, string type)
    {
        return new ObjectResult(new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Type = type
        })
        {
            StatusCode = statusCode
        };
    }
}
