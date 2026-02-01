using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Application.Commands.Handlers;
using PointRealm.Server.Application.Commands.Quest;
using PointRealm.Server.Application.Services;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Services;

public interface IQuestCsvApiService
{
    Task<IActionResult> ImportQuestsCsvAsync(string code, IFormFile file, ClaimsPrincipal user, CancellationToken cancellationToken = default);
    Task<IActionResult> ExportQuestsCsvAsync(string code, CancellationToken cancellationToken = default);
}

public class QuestCsvApiService(
    PointRealmDbContext dbContext,
    IQuestCsvService csvService,
    ImportQuestsCommandHandler importQuestsHandler) : IQuestCsvApiService
{
    public async Task<IActionResult> ImportQuestsCsvAsync(string code, IFormFile file, ClaimsPrincipal user, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return ApiProblemDetailsFactory.CreateProblem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid Realm Code",
                detail: "Realm code cannot be empty.",
                type: "Realm.InvalidCode");
        }

        if (file == null || file.Length == 0)
        {
            return ApiProblemDetailsFactory.CreateProblem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid File",
                detail: "CSV file is required.",
                type: "Quest.InvalidCsv");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".csv")
        {
            return ApiProblemDetailsFactory.CreateProblem(
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
            return ApiProblemDetailsFactory.CreateProblem(
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
                return ApiProblemDetailsFactory.CreateProblem(StatusCodes.Status403Forbidden, "Unauthorized", error.Description, error.Code);
            }
            if (error.Code == "Realm.NotFound")
            {
                return ApiProblemDetailsFactory.CreateProblem(StatusCodes.Status404NotFound, "NotFound", error.Description, error.Code);
            }

            return ApiProblemDetailsFactory.CreateProblem(StatusCodes.Status400BadRequest, "Import Failed", error.Description, error.Code);
        }

        return new OkObjectResult(result.Value);
    }

    public async Task<IActionResult> ExportQuestsCsvAsync(string code, CancellationToken cancellationToken = default)
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
            .FirstOrDefaultAsync(r => r.Code == code, cancellationToken);

        if (realm is null)
        {
            return ApiProblemDetailsFactory.CreateProblem(
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
}
