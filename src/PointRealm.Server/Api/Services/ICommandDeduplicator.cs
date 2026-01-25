namespace PointRealm.Server.Api.Services;

public interface ICommandDeduplicator
{
    bool TryGetResult(Guid memberId, Guid commandId, out object? payload);
    void StoreResult(Guid memberId, Guid commandId, object? payload);
}
