using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Server.Infrastructure.Services;
using PointRealm.Server.Application.Services;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Controllers.V1;

/// <summary>
/// V1 API controller for realm management operations.
/// </summary>
[ApiController]
[Route("api/v1/realms")]
public class RealmsController(
    PointRealmDbContext dbContext,
    IRealmCodeGenerator codeGenerator,
    IRealmSettingsService settingsService,
    IRealmHistoryService historyService,
    IRealmAuthorizationService authService,
    IQuestCsvService csvService,
    MemberTokenService tokenService) : ControllerBase
{
    private const string DefaultTheme = "dark-fantasy-arcane";

    /// <summary>
    /// Creates a new realm (anonymous or authenticated).
    /// </summary>
    /// <param name="request">Realm creation parameters</param>
    /// <response code="200">Returns realm creation details including join code and URL</response>
    /// <response code="400">If the request is invalid</response>
    [HttpPost]
    [ProducesResponseType(typeof(CreateRealmResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CreateRealmResponse>> CreateRealm(
        [FromBody] CreateRealmRequest request,
        CancellationToken cancellationToken = default)
    {
        // Generate unique realm code
        var code = await codeGenerator.GenerateUniqueCodeAsync(cancellationToken);
        
        // Determine theme
        var theme = string.IsNullOrWhiteSpace(request.ThemeKey) 
            ? DefaultTheme 
            : request.ThemeKey;

        // Build settings from request or use defaults
        var settings = settingsService.BuildRealmSettings(request.Settings);

        // Get authenticated user ID if available
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // Create realm
        var result = Realm.Create(code, request.RealmName, theme, settings, userId);
        
        if (result.IsFailure)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Realm Creation Failed",
                detail: result.Error.Description,
                type: result.Error.Code);
        }

        var realm = result.Value;
        dbContext.Realms.Add(realm);

        await dbContext.SaveChangesAsync(cancellationToken);

        // Build response
        var response = new CreateRealmResponse
        {
            Code = realm.Code,
            Name = realm.Name,
            JoinUrl = $"/realm/{realm.Code}",
            ThemeKey = realm.Theme,
            Settings = settingsService.MapToSettingsDto(realm.Settings)
        };

        return Ok(response);
    }

    /// <summary>
    /// Gets a realm summary by its join code.
    /// </summary>
    /// <param name="code">Realm join code</param>
    /// <response code="200">Returns realm summary information</response>
    /// <response code="404">If the realm is not found</response>
    [HttpGet("{code}")]
    [ProducesResponseType(typeof(RealmSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RealmSummaryResponse>> GetRealmSummary(
        string code,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return Problem(
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
            return Problem(
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

        return Ok(response);
    }

    /// <summary>
    /// Joins a realm and returns a member token.
    /// </summary>
    [HttpPost("{code}/join")]
    [ProducesResponseType(typeof(JoinRealmResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<JoinRealmResponse>> JoinRealm(
        string code,
        [FromBody] JoinRealmRequest request,
        CancellationToken cancellationToken = default)
    {
        var clientId = Request.Headers["X-PointRealm-ClientId"].ToString();
        if (string.IsNullOrWhiteSpace(clientId))
        {
            return Problem(
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
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Realm Not Found",
                detail: $"No realm found with code '{code}'.",
                type: "Realm.NotFound");
        }

        // Check the database directly for the member to be safe
        var member = await dbContext.PartyMembers
            .FirstOrDefaultAsync(m => m.RealmId == realm.Id && m.ClientInstanceId == clientId, cancellationToken);

        if (member is null)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isHost = request.Role?.Equals("GM", StringComparison.OrdinalIgnoreCase) ?? false;
            var isObserver = request.Role?.Equals("Observer", StringComparison.OrdinalIgnoreCase) ?? false;

            member = PartyMember.Create(realm.Id, clientId, request.DisplayName, isHost, userId, isObserver);
            dbContext.PartyMembers.Add(member);
            
            try 
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("UNIQUE") == true)
            {
                // Concurrency fallback - if they joined at the same time
                member = await dbContext.PartyMembers
                    .FirstAsync(m => m.RealmId == realm.Id && m.ClientInstanceId == clientId, cancellationToken);
            }
        }

        var role = member.IsHost ? "GM" : (member.IsObserver ? "Observer" : (request.Role ?? "Participant"));
        var token = tokenService.GenerateToken(member.Id, realm.Id, role);

        return Ok(new JoinRealmResponse
        {
            MemberToken = token,
            MemberId = member.Id.ToString(),
            RealmCode = realm.Code,
            RealmName = realm.Name,
            ThemeKey = realm.Theme,
            Role = role
        });
    }

    /// <summary>
    /// Updates realm settings (GM only).
    /// </summary>
    /// <param name="code">Realm join code</param>
    /// <param name="request">Updated settings</param>
    /// <response code="200">Returns updated settings</response>
    /// <response code="400">If the request is invalid</response>
    /// <response code="403">If user is not authorized as GM</response>
    /// <response code="404">If the realm is not found</response>
    [HttpPatch("{code}/settings")]
    [Authorize(AuthenticationSchemes = "Identity.Application,Bearer")]
    [ProducesResponseType(typeof(RealmSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RealmSettingsDto>> UpdateRealmSettings(
        string code,
        [FromBody] UpdateRealmSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid Realm Code",
                detail: "Realm code cannot be empty.",
                type: "Realm.InvalidCode");
        }

        var realm = await dbContext.Realms
            .FirstOrDefaultAsync(r => r.Code == code, cancellationToken);

        if (realm is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Realm Not Found",
                detail: $"No realm found with code '{code}'.",
                type: "Realm.NotFound");
        }

        // Check GM authorization
        if (!await CheckIsGmAsync(realm.Id))
        {
            return Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Unauthorized",
                detail: "Only the GM can update realm settings.",
                type: "Realm.Unauthorized");
        }

        // Update settings using the UpdateSettings method
        var newSettings = settingsService.BuildRealmSettings(request, realm.Settings);
        realm.UpdateSettings(newSettings);

        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(settingsService.MapToSettingsDto(newSettings));
    }

    #region User Realms & History

    /// <summary>
    /// Gets list of realms for the current user (authenticated or anonymous via ClientId).
    /// </summary>
    /// <response code="200">Returns list of realms</response>
    /// <response code="400">If neither user authentication nor ClientId header is provided</response>
    [HttpGet("~/api/v1/me/realms")]
    [ProducesResponseType(typeof(UserRealmsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AnonymousRealmsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetMyRealms(CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var clientId = Request.Headers["X-PointRealm-ClientId"].ToString();

        // Must have either userId or clientId
        if (string.IsNullOrWhiteSpace(userId) && string.IsNullOrWhiteSpace(clientId))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Authentication Required",
                detail: "Either user authentication or X-PointRealm-ClientId header is required.",
                type: "Auth.Required");
        }

        // Authenticated user - return full details
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
                    LastAccessedAt = null // Could be enhanced with tracking
                }).ToList()
            };

            return Ok(response);
        }

        // Anonymous user by ClientId - return minimal info
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

        return Ok(anonymousResponse);
    }

    /// <summary>
    /// Gets realm history with completed encounters and sealed outcomes per quest.
    /// </summary>
    /// <param name="code">Realm join code</param>
    /// <response code="200">Returns realm history</response>
    /// <response code="404">If the realm is not found</response>
    [HttpGet("{code}/history")]
    [ProducesResponseType(typeof(RealmHistoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RealmHistoryResponse>> GetRealmHistory(
        string code,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return Problem(
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
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Realm Not Found",
                detail: $"No realm found with code '{code}'.",
                type: "Realm.NotFound");
        }

        var response = historyService.BuildRealmHistory(realm);

        return Ok(response);
    }

    #endregion

    #region CSV Import/Export

    /// <summary>
    /// Imports quests from CSV file (GM only).
    /// </summary>
    /// <param name="code">Realm join code</param>
    /// <param name="file">CSV file to import</param>
    /// <response code="200">Returns import results with success/error counts</response>
    /// <response code="400">If the CSV is invalid or has validation errors</response>
    /// <response code="403">If user is not authorized as GM</response>
    /// <response code="404">If the realm is not found</response>
    [HttpPost("{code}/quests/import/csv")]
    [Authorize(AuthenticationSchemes = "Identity.Application,Bearer")]
    [ProducesResponseType(typeof(CsvImportResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CsvImportResult>> ImportQuestsCsv(
        string code,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid Realm Code",
                detail: "Realm code cannot be empty.",
                type: "Realm.InvalidCode");
        }

        if (file == null || file.Length == 0)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid File",
                detail: "CSV file is required.",
                type: "Quest.InvalidCsv");
        }

        // Validate file type
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".csv")
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid File Type",
                detail: "Only CSV files are accepted.",
                type: "Quest.InvalidFileType");
        }

        var realm = await dbContext.Realms
            .Include(r => r.Quests)
            .FirstOrDefaultAsync(r => r.Code == code, cancellationToken);

        if (realm is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Realm Not Found",
                detail: $"No realm found with code '{code}'.",
                type: "Realm.NotFound");
        }

        // Check GM authorization
        if (!await CheckIsGmAsync(realm.Id))
        {
            return Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Unauthorized",
                detail: "Only the GM can import quests.",
                type: "Realm.Unauthorized");
        }

        // Parse CSV
        List<QuestCsvRow> rows;
        using (var stream = file.OpenReadStream())
        {
            var parseResult = csvService.ParseCsv(stream);
            if (parseResult.IsFailure)
            {
                return Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "CSV Parse Error",
                    detail: parseResult.Error.Description,
                    type: parseResult.Error.Code);
            }
            rows = parseResult.Value;
        }

        if (!rows.Any())
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Empty CSV",
                detail: "CSV file contains no valid quest rows.",
                type: "Quest.EmptyCsv");
        }

        // Import quests
        var successCount = 0;
        var errors = new List<CsvValidationError>();
        var currentMaxOrder = realm.Quests.Any() ? realm.Quests.Max(q => q.Order) : 0;

        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var rowNumber = i + 2; // +2 because header is row 1, data starts at row 2

            try
            {
                // Determine order: use provided order or auto-increment
                var order = row.Order ?? (currentMaxOrder + successCount + 1);

                // Check for duplicate external IDs within the realm
                if (!string.IsNullOrWhiteSpace(row.ExternalId))
                {
                    var existingQuest = realm.Quests.FirstOrDefault(q => q.ExternalId == row.ExternalId);
                    if (existingQuest != null)
                    {
                        errors.Add(new CsvValidationError
                        {
                            RowNumber = rowNumber,
                            Field = "externalId",
                            Error = $"Quest with externalId '{row.ExternalId}' already exists in this realm"
                        });
                        continue;
                    }
                }

                var addResult = realm.AddQuest(row.Title, row.Description ?? string.Empty);
                if (addResult.IsFailure)
                {
                    errors.Add(new CsvValidationError
                    {
                        RowNumber = rowNumber,
                        Field = "quest",
                        Error = addResult.Error.Description
                    });
                    continue;
                }

                // Get the newly added quest and set external fields
                var newQuest = realm.Quests.OrderByDescending(q => q.Id).First();
                if (!string.IsNullOrWhiteSpace(row.ExternalId) || !string.IsNullOrWhiteSpace(row.ExternalUrl))
                {
                    newQuest.SetExternalFields(row.ExternalId, row.ExternalUrl);
                }

                // Set custom order if provided
                if (row.Order.HasValue)
                {
                    newQuest.SetOrder(row.Order.Value);
                }

                successCount++;
            }
            catch (Exception ex)
            {
                errors.Add(new CsvValidationError
                {
                    RowNumber = rowNumber,
                    Field = "quest",
                    Error = $"Failed to import quest: {ex.Message}"
                });
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var result = new CsvImportResult
        {
            SuccessCount = successCount,
            ErrorCount = errors.Count,
            Errors = errors
        };

        return Ok(result);
    }

    /// <summary>
    /// Exports quests to CSV file including sealed outcomes.
    /// </summary>
    /// <param name="code">Realm join code</param>
    /// <response code="200">Returns CSV file with quest data</response>
    /// <response code="404">If the realm is not found</response>
    [HttpGet("{code}/export/csv")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportQuestsCsv(
        string code,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return Problem(
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
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Realm Not Found",
                detail: $"No realm found with code '{code}'.",
                type: "Realm.NotFound");
        }

        // Build CSV rows with sealed outcomes
        var csvRows = realm.Quests.OrderBy(q => q.Order).Select(quest =>
        {
            // Find the most recent sealed encounter for this quest
            var sealedEncounter = realm.Encounters
                .Where(e => e.QuestId == quest.Id && e.Outcome.HasValue)
                .OrderByDescending(e => e.Id) // Get most recent
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

        return File(csvBytes, "text/csv", fileName);
    }

    private async Task<bool> CheckIsGmAsync(Guid realmId)
    {
        // 1. Check IdentityUser (authenticated via Cookies or default Bearer)
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null && await authService.IsGm(realmId, userId))
        {
            return true;
        }

        // 2. Check MemberToken (authenticated via custom Bearer)
        var memberIdValue = User.FindFirstValue("memberId");
        if (memberIdValue != null && Guid.TryParse(memberIdValue, out var memberId))
        {
            if (await authService.IsMemberGm(realmId, memberId))
            {
                return true;
            }
        }

        return false;
    }

    #endregion
}
