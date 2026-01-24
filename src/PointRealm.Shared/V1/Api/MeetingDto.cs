using System;

namespace PointRealm.Shared.V1.Api;

public sealed record MeetingDto(Guid Id, string Title, DateTimeOffset ScheduledAt, string Status);
