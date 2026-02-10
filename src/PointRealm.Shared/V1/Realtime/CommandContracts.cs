namespace PointRealm.Shared.V1.Realtime;

public record CommandErrorDto
{
    public required string ErrorCode { get; init; }
    public required string Message { get; init; }
    public string? Details { get; init; }
    public string? RealmCode { get; init; }
    public DateTime? ServerNow { get; init; }
}

public record CommandResultDto
{
    public bool Success { get; init; }
    public CommandErrorDto? Error { get; init; }

    public static CommandResultDto Ok() => new() { Success = true };
    public static CommandResultDto Fail(CommandErrorDto error) => new() { Success = false, Error = error };
}

public record CommandResultWithPayloadDto<T>
{
    public bool Success { get; init; }
    public T? Payload { get; init; }
    public CommandErrorDto? Error { get; init; }

    public static CommandResultWithPayloadDto<T> Ok(T payload) => new() { Success = true, Payload = payload };
    public static CommandResultWithPayloadDto<T> Fail(CommandErrorDto error) => new() { Success = false, Error = error };
}

public record SetDisplayNameRequest
{
    public required string Name { get; init; }
    public Guid? CommandId { get; init; }
}

public record SetAvatarEmojiRequest
{
    public required string Emoji { get; init; }
    public Guid? CommandId { get; init; }
}

public record SelectRuneRequest
{
    public required string Value { get; init; }
    public required int EncounterVersion { get; init; }
    public Guid? CommandId { get; init; }
}

public record StartEncounterRequest
{
    public required Guid QuestId { get; init; }
    public required int RealmVersion { get; init; }
    public required int QuestVersion { get; init; }
    public Guid? CommandId { get; init; }
}

public record StartNextQuestRequest
{
    public required int RealmVersion { get; init; }
    public Guid? CommandId { get; init; }
}

public record RevealProphecyRequest
{
    public required int EncounterVersion { get; init; }
    public Guid? CommandId { get; init; }
}

public record ReRollFatesRequest
{
    public required int EncounterVersion { get; init; }
    public Guid? CommandId { get; init; }
}

public record SealOutcomeRequest
{
    public required int FinalValue { get; init; }
    public required int EncounterVersion { get; init; }
    public Guid? CommandId { get; init; }
}

public record AddQuestRequest
{
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required int QuestLogVersion { get; init; }
    public Guid? CommandId { get; init; }
}

public record UpdateQuestRequest
{
    public required Guid QuestId { get; init; }
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required int QuestVersion { get; init; }
    public Guid? CommandId { get; init; }
}

public record DeleteQuestRequest
{
    public required Guid QuestId { get; init; }
    public required int QuestVersion { get; init; }
    public required int QuestLogVersion { get; init; }
    public Guid? CommandId { get; init; }
}

public record ReorderQuestsRequest
{
    public required List<Guid> NewOrder { get; init; }
    public required int QuestLogVersion { get; init; }
    public Guid? CommandId { get; init; }
}

public record SetActiveQuestRequest
{
    public required Guid QuestId { get; init; }
    public required int QuestLogVersion { get; init; }
    public Guid? CommandId { get; init; }
}

public record JoinPresenceRequest
{
    public Guid? CommandId { get; init; }
}

public record LeavePresenceRequest
{
    public Guid? CommandId { get; init; }
}


public record ThrowEmojiReactionRequest
{
    public required string Emoji { get; init; }
}
