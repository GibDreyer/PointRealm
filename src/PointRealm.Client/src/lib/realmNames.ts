const ADJECTIVES = [
  "Emerald", "Frozen", "Abyssal", "Radiant", "Shadowed", "Obsidian", "Arcane",
  "Celestial", "Verdant", "Sanguine", "Crimson", "Ethereal", "Hallowed", "Forgotten",
  "Ancient", "Infinite", "Crystal", "Prism", "Twilight", "Dawn", "Aurelian",
  "Volcanic", "Glacial", "Nebulous", "Whispering", "Hidden", "Mystic", "Sovereign"
];

const NOUNS = [
  "Sanctum", "Dominion", "Vault", "Bastion", "Spire", "Citadel", "Reach",
  "Haven", "Shrine", "Expanse", "Domain", "Realm", "Chamber", "Nexus",
  "Grove", "Keep", "Labyrinth", "Summit", "Void", "Hollow", "Sanctuary",
  "Throne", "Temple", "Abode", "Stronghold", "Peak", "Valley", "Well"
];

const SUFFIXES = [
  "of Dreams", "of the Void", "of Secrets", "of Fire", "of the Moon",
  "of Eternity", "of Lost Spirits", "of the Phoenix", "of Ash", "of Light",
  "of the Ancient", "of the Tide", "of Frost", "of Arcane Might"
];

export function generateRandomRealmName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  
  // 30% chance of adding a suffix
  if (Math.random() > 0.7) {
    const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
    return `${adj} ${noun} ${suffix}`;
  }
  
  return `${adj} ${noun}`;
}

const QUEST_ACTIONS = [
  "Slay", "Retrieve", "Find", "Defeat", "Escort", "Discover", "Explore", "Protect",
  "Assassinate", "Deliver", "Recover", "Cleanse", "Investigate", "Secure"
];

const QUEST_TARGETS = [
  "the Dragon", "the Lost Rune", "the Goblin King", "the Ancient Relic",
  "the Enchanted Forest", "the Merchant", "the Rat King", "the Cursed Sword",
  "the Hidden Path", "the Dark Cave", "the Stolen Gold", "the Mystic Portal",
  "the Shadow Beast", "the Holy Grail"
];

export function generateRandomQuestName(): string {
  const action = QUEST_ACTIONS[Math.floor(Math.random() * QUEST_ACTIONS.length)];
  const target = QUEST_TARGETS[Math.floor(Math.random() * QUEST_TARGETS.length)];
  return `${action} ${target}`;
}
