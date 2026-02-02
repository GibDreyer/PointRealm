using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Api.Services;
using PointRealm.Server.Application.Commands.Handlers;
using PointRealm.Server.Infrastructure.Services;
using Xunit;

namespace PointRealm.Tests.Api;

public class QuestCsvApiServiceTests
{
    [Fact]
    public async Task ImportQuestsCsv_WithNonCsvFile_ReturnsProblem()
    {
        using var connection = ApiServiceTestHelpers.CreateInMemoryConnection();
        var options = ApiServiceTestHelpers.CreateOptions(connection);

        await using var dbContext = new PointRealm.Server.Infrastructure.Persistence.PointRealmDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var service = new QuestCsvApiService(
            dbContext,
            new QuestCsvService(),
            new ImportQuestsCommandHandler(
                new ApiServiceTestHelpers.StubRealmRepository(),
                new QuestCsvService(),
                new ApiServiceTestHelpers.StubRealmAuthorizationService(),
                new ApiServiceTestHelpers.StubRealmBroadcaster()));

        var file = new FormFile(new MemoryStream(new byte[] { 0x1 }), 0, 1, "file", "quests.txt");
        var result = await service.ImportQuestsCsvAsync("CODE", file, new System.Security.Claims.ClaimsPrincipal());

        var problem = Assert.IsType<ObjectResult>(result);
        var details = Assert.IsType<ProblemDetails>(problem.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, details.Status);
        Assert.Equal("Quest.InvalidFileType", details.Type);
    }
}
