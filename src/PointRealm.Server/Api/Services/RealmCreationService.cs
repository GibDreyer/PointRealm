using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Domain.Entities;
using PointRealm.Server.Infrastructure.Persistence;
using PointRealm.Shared.V1.Api;

namespace PointRealm.Server.Api.Services;

public interface IRealmCreationService
{
    Task<IActionResult> CreateRealmAsync(CreateRealmRequest request, ClaimsPrincipal user, CancellationToken cancellationToken = default);
}

public class RealmCreationService(
    PointRealmDbContext dbContext,
    IRealmCodeGenerator codeGenerator,
    IRealmSettingsService settingsService) : IRealmCreationService
{
    private const string DefaultTheme = "dark-fantasy-arcane";

    public async Task<IActionResult> CreateRealmAsync(CreateRealmRequest request, ClaimsPrincipal user, CancellationToken cancellationToken = default)
    {
        var code = await codeGenerator.GenerateUniqueCodeAsync(cancellationToken);

        var theme = string.IsNullOrWhiteSpace(request.ThemeKey)
            ? DefaultTheme
            : request.ThemeKey;

        var settings = settingsService.BuildRealmSettings(request.Settings);

        var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);

        var result = Realm.Create(code, request.RealmName, theme, settings, userId);

        if (result.IsFailure)
        {
            return ApiProblemDetailsFactory.CreateProblem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Realm Creation Failed",
                detail: result.Error.Description,
                type: result.Error.Code);
        }

        var realm = result.Value;
        dbContext.Realms.Add(realm);

        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new CreateRealmResponse
        {
            Code = realm.Code,
            Name = realm.Name,
            JoinUrl = $"/realm/{realm.Code}",
            ThemeKey = realm.Theme,
            Settings = settingsService.MapToSettingsDto(realm.Settings)
        };

        return new OkObjectResult(response);
    }
}
