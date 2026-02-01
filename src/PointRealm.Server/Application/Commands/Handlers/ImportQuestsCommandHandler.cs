using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Application.Commands.Quest;
using PointRealm.Server.Common;
using PointRealm.Server.Domain.Entities;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Application.Commands.Handlers;

public class ImportQuestsCommandHandler(
    IRealmRepository repository,
    IQuestCsvService csvService,
    IRealmAuthorizationService authService) : ICommandHandler<ImportQuestsCommand, Result<CsvImportResult>>
{
    public async Task<Result<CsvImportResult>> HandleAsync(ImportQuestsCommand command, CancellationToken cancellationToken = default)
    {
        var realm = await repository.GetByIdWithRelationsAsync(command.RealmId, cancellationToken);
        
        if (realm is null)
        {
            return Result.Failure<CsvImportResult>(new Error("Realm.NotFound", $"No realm found with ID '{command.RealmId}'."));
        }

        // Check GM authorization
        if (!await authService.IsGm(realm.Id, command.InitiatorUserId))
        {
             return Result.Failure<CsvImportResult>(new Error("Realm.Unauthorized", "Only the GM can import quests."));
        }

        // Parse CSV
        List<QuestCsvRow> rows;
        try 
        {
            var parseResult = csvService.ParseCsv(command.CsvStream);
            if (parseResult.IsFailure)
            {
                return Result.Failure<CsvImportResult>(parseResult.Error);
            }
            rows = parseResult.Value;
        }
        catch (Exception ex)
        {
             return Result.Failure<CsvImportResult>(new Error("Quest.ParseError", ex.Message));
        }

        if (!rows.Any())
        {
             return Result.Failure<CsvImportResult>(new Error("Quest.EmptyCsv", "CSV file contains no valid quest rows."));
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
                var newQuest = realm.Quests.Last(); 
                
                if (!string.IsNullOrWhiteSpace(row.ExternalId) || !string.IsNullOrWhiteSpace(row.ExternalUrl))
                {
                    newQuest.SetExternalFields(row.ExternalId, row.ExternalUrl);
                }

                // Set custom order if provided
                if (row.Order.HasValue)
                {
                    newQuest.SetOrder(row.Order.Value);
                }
                
                if (!row.Order.HasValue) 
                {
                    newQuest.SetOrder(order);
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

        await repository.SaveChangesAsync(cancellationToken);

        var result = new CsvImportResult
        {
            SuccessCount = successCount,
            ErrorCount = errors.Count,
            Errors = errors
        };

        return Result.Success(result);
    }
}
