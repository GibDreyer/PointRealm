namespace PointRealm.Server.Application.Services;

public class QuestNameGenerator : IQuestNameGenerator
{
    private static readonly List<(string Title, string Description)> CratedQuests = new()
    {
        ("The Spaghetti Monster of Legacy Code", "It lurks in the deep folders of the monolith. Beware its tight coupling and side effects."),
        ("The Infinite Loop of Doom", "Round and round we go. Will we ever ship? The stack is overflowing."),
        ("Deployment on Friday", "A high-stakes mission for only the bravest souls. Keep the rollback scroll handy."),
        ("The Phantom Bug", "It only manifests during the demo to the stakeholders. Catch it if you can."),
        ("Quest for the Golden Pixel", "Design says 1px to the left. Engineering says it's impossible. Who will prevail?"),
        ("The Prophecy of Agile", "Legend speaks of a sprint that actually ends on time. Is it a myth?"),
        ("Attack of the Scope Creep", "It started as a simple button. Now it's a full CRM. Defend the backlog!"),
        ("The Merge Conflict from Hell", "Three hundred files changed. Two developers. One survivor."),
        ("The Cursed Cache", "It returns data from 2018. Clearing it does nothing. Abandon all hope."),
        ("Refactoring the Untestable", "Here be dragons. And singletons. And global state."),
        ("The API of Silence", "It returns 200 OK but the body is empty. What is it hiding?"),
        ("The One Ticket to Rule Them All", "A user story so large it spans three epics. Break it down before it destroys us."),
        ("Hunt for the Missing Semicolon", "The compiler screams in agony, but the line number is a lie."),
        ("The CSS z-index War", "To bring this modal to the front, you must assign it a value of 999999."),
        ("The Dark Mode Dilemma", "Every color is hardcoded. Shadows are everywhere. The light burns."),
        ("The Load Balancer's Gamble", "Will it route to the healthy instance? Roll the dice."),
        ("Race Condition Rumble", "Who will win? The database update or the cache invalidation? Place your bets."),
        ("The undefined is not a function", "A classic tragedy, appearing in a console near you."),
        ("Escape from Tutorial Island", "You've read the docs. You've done the hello world. Now, build the real thing."),
        ("The MVP that never P'd", "It's Minimum, but is it Viable? Let's ship it and find out.")
    };
    
    // Fallback components for generative titles
    private static readonly List<string> Adjectives = new() { "Ancient", "Broken", "Cursed", "Infinite", "Forbidden", "Agile", "Legacy", "Quantum", "Hallowed", "Forgotten", "Radioactive", "Unstable" };
    private static readonly List<string> Nouns = new() { "Monolith", "Microservice", "Database", "API", "Artifact", "Algorithm", "Stack", "Loop", "Bug", "Feature", "Pipeline", "Cluster" };
    private static readonly List<string> Verbs = new() { "Refactor", "Deploy", "Fix", "Hunt", "Banish", "Optimize", "Debug", "Hack", "Summon", "Reboot" };

    public (string Title, string Description) GenerateRandomQuest()
    {
        // 70% chance to pick a curated quest
        if (Random.Shared.NextDouble() < 0.70)
        {
            var index = Random.Shared.Next(CratedQuests.Count);
            return CratedQuests[index];
        }

        // 30% chance to generate one
        var template = Random.Shared.Next(3);
        var title = "";
        var desc = "A procedurally generated challenge for the team.";

        var adj = Adjectives[Random.Shared.Next(Adjectives.Count)];
        var noun = Nouns[Random.Shared.Next(Nouns.Count)];
        var verb = Verbs[Random.Shared.Next(Verbs.Count)];

        switch (template)
        {
            case 0:
                title = $"The {adj} {noun}";
                desc = $"Legends say this {noun.ToLower()} has been {adj.ToLower()} since the first commit.";
                break;
            case 1:
                title = $"Operation: {verb} {noun}";
                desc = $"We must {verb.ToLower()} the {noun.ToLower()} before the sprint ends. Good luck.";
                break;
            case 2:
                title = $"{verb} the {adj} {noun}";
                desc = $"No one else dares to touch the {adj.ToLower()} {noun.ToLower()}. It's up to you.";
                break;
        }

        return (title, desc);
    }
}
