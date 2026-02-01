namespace PointRealm.Server.Infrastructure.Services;

public interface IRealmCodeGenerator
{
    Task<string> GenerateUniqueCodeAsync(CancellationToken cancellationToken = default);
}
