using System.Globalization;
using System.Text;
using CsvHelper;
using CsvHelper.Configuration;
using PointRealm.Server.Common;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Infrastructure.Services;

/// <summary>
/// Service for parsing and generating CSV files for quest import/export.
/// </summary>
public class QuestCsvService
{
    private readonly CsvConfiguration _csvConfig;

    public QuestCsvService()
    {
        _csvConfig = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            TrimOptions = TrimOptions.Trim,
            MissingFieldFound = null, // Don't throw on missing optional fields
            HeaderValidated = null, // Don't throw on missing headers
            BadDataFound = null // Handle bad data gracefully
        };
    }

    /// <summary>
    /// Parses CSV content and validates each row.
    /// </summary>
    public Result<List<QuestCsvRow>> ParseCsv(Stream csvStream)
    {
        var rows = new List<QuestCsvRow>();
        var errors = new List<CsvValidationError>();

        try
        {
            using var reader = new StreamReader(csvStream);
            using var csv = new CsvReader(reader, _csvConfig);

            // Read header
            csv.Read();
            csv.ReadHeader();

            var rowNumber = 1; // Header is row 0
            
            while (csv.Read())
            {
                rowNumber++;
                
                try
                {
                    var title = csv.GetField<string>("title")?.Trim();
                    var description = csv.GetField<string>("description")?.Trim();
                    var externalId = csv.GetField<string>("externalId")?.Trim();
                    var externalUrl = csv.GetField<string>("externalUrl")?.Trim();
                    
                    // Parse optional order field
                    int? order = null;
                    var orderStr = csv.GetField<string>("order")?.Trim();
                    if (!string.IsNullOrWhiteSpace(orderStr))
                    {
                        if (int.TryParse(orderStr, out var orderValue))
                        {
                            order = orderValue;
                        }
                        else
                        {
                            errors.Add(new CsvValidationError
                            {
                                RowNumber = rowNumber,
                                Field = "order",
                                Error = $"Invalid number format: '{orderStr}'"
                            });
                            continue;
                        }
                    }

                    // Validate required field
                    if (string.IsNullOrWhiteSpace(title))
                    {
                        errors.Add(new CsvValidationError
                        {
                            RowNumber = rowNumber,
                            Field = "title",
                            Error = "Title is required"
                        });
                        continue;
                    }

                    // Validate title length
                    if (title.Length > 200)
                    {
                        errors.Add(new CsvValidationError
                        {
                            RowNumber = rowNumber,
                            Field = "title",
                            Error = $"Title exceeds maximum length of 200 characters (current: {title.Length})"
                        });
                        continue;
                    }

                    // Validate description length
                    if (description?.Length > 2000)
                    {
                        errors.Add(new CsvValidationError
                        {
                            RowNumber = rowNumber,
                            Field = "description",
                            Error = $"Description exceeds maximum length of 2000 characters (current: {description.Length})"
                        });
                        continue;
                    }

                    // Validate externalId length
                    if (externalId?.Length > 100)
                    {
                        errors.Add(new CsvValidationError
                        {
                            RowNumber = rowNumber,
                            Field = "externalId",
                            Error = $"ExternalId exceeds maximum length of 100 characters (current: {externalId.Length})"
                        });
                        continue;
                    }

                    // Validate externalUrl length and format
                    if (!string.IsNullOrWhiteSpace(externalUrl))
                    {
                        if (externalUrl.Length > 500)
                        {
                            errors.Add(new CsvValidationError
                            {
                                RowNumber = rowNumber,
                                Field = "externalUrl",
                                Error = $"ExternalUrl exceeds maximum length of 500 characters (current: {externalUrl.Length})"
                            });
                            continue;
                        }

                        // Basic URL validation
                        if (!Uri.TryCreate(externalUrl, UriKind.Absolute, out _))
                        {
                            errors.Add(new CsvValidationError
                            {
                                RowNumber = rowNumber,
                                Field = "externalUrl",
                                Error = $"Invalid URL format: '{externalUrl}'"
                            });
                            continue;
                        }
                    }

                    rows.Add(new QuestCsvRow
                    {
                        Title = title,
                        Description = string.IsNullOrWhiteSpace(description) ? null : description,
                        ExternalId = string.IsNullOrWhiteSpace(externalId) ? null : externalId,
                        ExternalUrl = string.IsNullOrWhiteSpace(externalUrl) ? null : externalUrl,
                        Order = order
                    });
                }
                catch (Exception ex)
                {
                    errors.Add(new CsvValidationError
                    {
                        RowNumber = rowNumber,
                        Field = "row",
                        Error = $"Error parsing row: {ex.Message}"
                    });
                }
            }

            if (errors.Any())
            {
                return Result.Failure<List<QuestCsvRow>>(new Error(
                    "QuestCsv.ValidationErrors",
                    $"CSV validation failed with {errors.Count} error(s)"));
            }

            return Result.Success(rows);
        }
        catch (Exception ex)
        {
            return Result.Failure<List<QuestCsvRow>>(new Error(
                "QuestCsv.ParseError",
                $"Failed to parse CSV file: {ex.Message}"));
        }
    }

    /// <summary>
    /// Generates CSV content from quest data.
    /// </summary>
    public byte[] GenerateCsv(IEnumerable<QuestCsvRow> rows)
    {
        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
        using var csv = new CsvWriter(writer, _csvConfig);

        // Write header
        csv.WriteField("title");
        csv.WriteField("description");
        csv.WriteField("externalId");
        csv.WriteField("externalUrl");
        csv.WriteField("order");
        csv.WriteField("sealedOutcome");
        csv.NextRecord();

        // Write rows
        foreach (var row in rows)
        {
            csv.WriteField(row.Title);
            csv.WriteField(row.Description ?? string.Empty);
            csv.WriteField(row.ExternalId ?? string.Empty);
            csv.WriteField(row.ExternalUrl ?? string.Empty);
            csv.WriteField(row.Order?.ToString() ?? string.Empty);
            csv.WriteField(row.SealedOutcome?.ToString() ?? string.Empty);
            csv.NextRecord();
        }

        writer.Flush();
        return memoryStream.ToArray();
    }
}
