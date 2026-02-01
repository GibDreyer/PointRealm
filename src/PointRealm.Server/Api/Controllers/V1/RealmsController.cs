using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Api.Services;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Controllers.V1;

/// <summary>
/// V1 API controller for realm management operations.
/// </summary>
[ApiController]
[Route("api/v1/realms")]
public class RealmsController(
    IRealmCreationService creationService,
    IRealmSummaryService summaryService,
    IRealmMembershipService membershipService,
    IRealmSettingsApiService settingsService,
    IUserRealmsService userRealmsService,
    IRealmHistoryApiService historyService,
    IQuestCsvApiService questCsvService) : ControllerBase
{
    /// <summary>
    /// Creates a new realm (anonymous or authenticated).
    /// </summary>
    /// <param name="request">Realm creation parameters</param>
    /// <response code="200">Returns realm creation details including join code and URL</response>
    /// <response code="400">If the request is invalid</response>
    [HttpPost]
    [ProducesResponseType(typeof(CreateRealmResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public Task<IActionResult> CreateRealm(
        [FromBody] CreateRealmRequest request,
        CancellationToken cancellationToken = default)
    {
        return creationService.CreateRealmAsync(request, User, cancellationToken);
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
    public Task<IActionResult> GetRealmSummary(
        string code,
        CancellationToken cancellationToken = default)
    {
        return summaryService.GetRealmSummaryAsync(code, cancellationToken);
    }

    /// <summary>
    /// Joins a realm and returns a member token.
    /// </summary>
    [HttpPost("{code}/join")]
    [ProducesResponseType(typeof(JoinRealmResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public Task<IActionResult> JoinRealm(
        string code,
        [FromBody] JoinRealmRequest request,
        CancellationToken cancellationToken = default)
    {
        var clientId = Request.Headers["X-PointRealm-ClientId"].ToString();
        return membershipService.JoinRealmAsync(code, request, clientId, User, cancellationToken);
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
    public Task<IActionResult> UpdateRealmSettings(
        string code,
        [FromBody] UpdateRealmSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        return settingsService.UpdateRealmSettingsAsync(code, request, User, cancellationToken);
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
    public Task<IActionResult> GetMyRealms(CancellationToken cancellationToken = default)
    {
        var clientId = Request.Headers["X-PointRealm-ClientId"].ToString();
        return userRealmsService.GetMyRealmsAsync(User, clientId, cancellationToken);
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
    public Task<IActionResult> GetRealmHistory(
        string code,
        CancellationToken cancellationToken = default)
    {
        return historyService.GetRealmHistoryAsync(code, cancellationToken);
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
    public Task<IActionResult> ImportQuestsCsv(
        string code,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        return questCsvService.ImportQuestsCsvAsync(code, file, User, cancellationToken);
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
    public Task<IActionResult> ExportQuestsCsv(
        string code,
        CancellationToken cancellationToken = default)
    {
        return questCsvService.ExportQuestsCsvAsync(code, cancellationToken);
    }

    #endregion
}
