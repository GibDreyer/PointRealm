namespace PointRealm.Server.Application.Commands.Encounter;

/// <summary>
/// Command to select a rune (cast a vote) for the current encounter.
/// </summary>
public record SelectRuneCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId,
    string Value,
    int EncounterVersion,
    Guid? CommandId = null);

/// <summary>
/// Command to start a new encounter on a quest.
/// </summary>
public record StartEncounterCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId,
    Guid QuestId,
    int RealmVersion,
    int QuestVersion,
    Guid? CommandId = null);

/// <summary>
/// Command to reveal the votes for the current encounter.
/// </summary>
public record RevealProphecyCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId,
    int EncounterVersion,
    Guid? CommandId = null);

/// <summary>
/// Command to reset votes and allow re-voting.
/// </summary>
public record ReRollFatesCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId,
    int EncounterVersion,
    Guid? CommandId = null);

/// <summary>
/// Command to seal the final outcome of an encounter.
/// </summary>
public record SealOutcomeCommand(
    Guid MemberId,
    Guid RealmId,
    string ClientId,
    int Outcome,
    int EncounterVersion,
    Guid? CommandId = null);
