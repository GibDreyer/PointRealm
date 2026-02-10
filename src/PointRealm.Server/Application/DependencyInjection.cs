using Microsoft.Extensions.DependencyInjection;
using PointRealm.Server.Application.Services;
using PointRealm.Server.Application.Commands.Handlers;
using PointRealm.Server.Application.Abstractions;

namespace PointRealm.Server.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Change to use FluentValidation, MediatR etc as needed.
        services.AddScoped<IRealmHistoryService, RealmHistoryService>();
        services.AddScoped<IRealmSettingsService, RealmSettingsService>();
        
        // Command Handlers
        services.AddScoped<MemberCommandHandler>();
        services.AddScoped<EncounterCommandHandler>();
        services.AddScoped<QuestCommandHandler>();
        services.AddScoped<ImportQuestsCommandHandler>();
        
        services.AddScoped<IQuestNameGenerator, QuestNameGenerator>();
        services.AddScoped<IRealmStateMapper, RealmStateMapper>();

        return services;
    }
}
