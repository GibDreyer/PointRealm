using System;

namespace PointRealm.Shared.V1.Realtime;

public sealed record SystemNotification(Guid Id, string Message, DateTimeOffset Timestamp);
