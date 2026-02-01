using PointRealm.Server.Application.Abstractions;
using PointRealm.Server.Application.Commands.Member;
using PointRealm.Server.Domain.Entities;
using PointRealm.Shared.V1.Realtime;

namespace PointRealm.Server.Application.Commands.Handlers;

public class MemberCommandHandler(
    IRealmRepository realmRepository,
    IRealmBroadcaster broadcaster,
    ICommandDeduplicator deduplicator)
    : ICommandHandler<SetDisplayNameCommand>,
      ICommandHandler<SetAvatarEmojiCommand>,
      ICommandHandler<JoinPresenceCommand>,
      ICommandHandler<LeavePresenceCommand>
{
    public async Task<CommandResultDto> HandleAsync(SetDisplayNameCommand request, CancellationToken cancellationToken = default)
    {
        return await ExecuteAsync(request.MemberId, request.RealmId, request.CommandId, request.ClientId, async (realm, member) =>
        {
            member.UpdateName(request.Name);
            return CommandResultDto.Ok();
        }, cancellationToken);
    }

    public async Task<CommandResultDto> HandleAsync(SetAvatarEmojiCommand request, CancellationToken cancellationToken = default)
    {
        return await ExecuteAsync(request.MemberId, request.RealmId, request.CommandId, request.ClientId, async (realm, member) =>
        {
            member.UpdateAvatarEmoji(request.Emoji);
            return CommandResultDto.Ok();
        }, cancellationToken);
    }

    public async Task<CommandResultDto> HandleAsync(JoinPresenceCommand request, CancellationToken cancellationToken = default)
    {
         return await ExecuteAsync(request.MemberId, request.RealmId, null, request.ClientId, async (realm, member) =>
        {
            member.SetOnline(true);
            return CommandResultDto.Ok();
        }, cancellationToken);
    }

    public async Task<CommandResultDto> HandleAsync(LeavePresenceCommand request, CancellationToken cancellationToken = default)
    {
         return await ExecuteAsync(request.MemberId, request.RealmId, null, request.ClientId, async (realm, member) =>
        {
            member.SetOnline(false);
            return CommandResultDto.Ok();
        }, cancellationToken);
    }

    private async Task<CommandResultDto> ExecuteAsync(
        Guid memberId,
        Guid realmId,
        Guid? commandId,
        string clientId,
        Func<Realm, PartyMember, Task<CommandResultDto>> action,
        CancellationToken cancellationToken)
    {
        if (commandId.HasValue && deduplicator.TryGetResult(memberId, commandId.Value, out var cached))
        {
            return (CommandResultDto)cached!;
        }

        var realm = await realmRepository.GetByIdWithRelationsAsync(realmId, cancellationToken);
        if (realm is null) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "NOT_FOUND", Message = "Realm not found." });

        var member = realm.Members.FirstOrDefault(m => m.Id == memberId);
        if (member is null) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "NOT_FOUND", Message = "Member not found." });

        if (member.IsBanned) return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "FORBIDDEN", Message = "You are banned." });

        try
        {
            var result = await action(realm, member);
            
            if (result.Success)
            {
                await realmRepository.SaveChangesAsync(cancellationToken);
                if (commandId.HasValue) deduplicator.StoreResult(memberId, commandId.Value, result);
                await broadcaster.BroadcastRealmStateAsync(realmId);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            return CommandResultDto.Fail(new CommandErrorDto { ErrorCode = "Server.Error", Message = ex.Message });
        }
    }
}
