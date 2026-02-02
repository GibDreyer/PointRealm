namespace PointRealm.Server.Application.Commands.Quest;

/// <summary>
/// Command to add a new quest to the realm.
/// </summary>
public record AddQuestCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId,
    string Title,
    string? Description,
    string? ExternalId,
    string? ExternalUrl,
    int QuestLogVersion,
    Guid? CommandId = null);

/// <summary>
/// Command to update an existing quest.
/// </summary>
public record UpdateQuestCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId,
    Guid QuestId,
    string Title,
    string? Description,
    string? ExternalId,
    string? ExternalUrl,
    int QuestVersion,
    Guid? CommandId = null);

/// <summary>
/// Command to delete a quest from the realm.
/// </summary>
public record DeleteQuestCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId,
    Guid QuestId,
    int QuestLogVersion,
    Guid? CommandId = null);

/// <summary>
/// Command to reorder quests in the realm.
/// </summary>
public record ReorderQuestsCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId,
    List<Guid> QuestIds,
    int QuestLogVersion,
    Guid? CommandId = null);

/// <summary>
/// Command to set the active quest.
/// </summary>
public record SetActiveQuestCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId,
    Guid QuestId,
    int QuestLogVersion,
    Guid? CommandId = null);

/// <summary>
/// Command to progress to the next quest (or generate one).
/// </summary>
public record StartNextQuestCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId,
    int RealmVersion,
    Guid? CommandId = null);
