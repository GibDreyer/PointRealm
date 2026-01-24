namespace PointRealm.Shared.V1.Api;

public record QuestCsvRow
{
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? ExternalId { get; init; }
    public string? ExternalUrl { get; init; }
    public int? Order { get; init; }
    public int? SealedOutcome { get; init; }
}

public record CsvImportResult
{
    public int SuccessCount { get; init; }
    public int ErrorCount { get; init; }
    public List<CsvValidationError> Errors { get; init; } = new();
}

public record CsvValidationError
{
    public int RowNumber { get; init; }
    public string Field { get; init; } = string.Empty;
    public string Error { get; init; } = string.Empty;
}
