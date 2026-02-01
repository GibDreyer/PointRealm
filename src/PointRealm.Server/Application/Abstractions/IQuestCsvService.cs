using PointRealm.Server.Common;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Application.Abstractions;

/// <summary>
/// Abstraction for CSV parsing and generation for quests.
/// </summary>
public interface IQuestCsvService
{
    /// <summary>
    /// Parses CSV content and validates each row.
    /// </summary>
    Result<List<QuestCsvRow>> ParseCsv(Stream csvStream);
    
    /// <summary>
    /// Generates CSV content from quest data.
    /// </summary>
    byte[] GenerateCsv(IEnumerable<QuestCsvRow> rows);
}
