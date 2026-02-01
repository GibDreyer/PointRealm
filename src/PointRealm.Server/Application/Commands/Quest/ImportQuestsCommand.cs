using PointRealm.Server.Common;
using PointRealm.Shared.V1.Api;
using PointRealm.Server.Application.Commands;

namespace PointRealm.Server.Application.Commands.Quest;

public record ImportQuestsCommand(
    Guid RealmId, 
    Stream CsvStream, 
    string InitiatorUserId
);

// Define IRequest marker if not exists, or just use generic class/record if ICommandHandler uses TRequest directly.
// The existing ICommandHandler uses TRequest directly.
// But to make it cleaner, I'll just define the record.
