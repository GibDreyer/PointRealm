using PointRealm.Server.Application.Services;

namespace PointRealm.Tests.TestDoubles;

public sealed class StubQuestNameGenerator : IQuestNameGenerator
{
    public (string Title, string Description) GenerateRandomQuest()
        => ("Generated Quest", "Generated quest description");
}
