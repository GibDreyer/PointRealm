using Microsoft.Extensions.DependencyInjection;

namespace PointRealm.Server.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Change to use FluentValidation, MediatR etc as needed.
        
        return services;
    }
}
