using PointRealm.Server.Common;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Infrastructure.Services;

public interface IQuestCsvService
{
    Result<List<QuestCsvRow>> ParseCsv(Stream csvStream);
    byte[] GenerateCsv(IEnumerable<QuestCsvRow> rows);
}
