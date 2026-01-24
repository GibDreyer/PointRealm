using System;

namespace PointRealm.Shared.V1.Realtime;

public sealed record ChatMessage(Guid Id, Guid MeetingId, string Content, string SenderId, DateTimeOffset Timestamp);
