export interface RealmSettings {
    deckType: string;
    customDeckValues?: string[];
    autoReveal: boolean;
    allowAbstain: boolean;
    hideVoteCounts: boolean;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    status: "Pending" | "Active" | "Completed" | "Open" | "Sealed";
    order: number;
    externalUrl?: string; // Optional, might be added later
    externalId?: string;
    sealedEstimate?: string; // For sealed quests
    version?: number;
    sealedOutcome?: number | null;
}

export interface PartyMember {
    id: string;
    name: string;
    avatarEmoji?: string | null;
    profileImageUrl?: string | null;
    profileEmoji?: string | null;
    role: "GM" | "Member" | "Observer";
    status: "ready" | "choosing" | "disconnected";
    isOnline: boolean;
    hasVoted?: boolean; // Derived or explicit
    isObserver?: boolean;
    isBanned?: boolean;
}

export interface Vote {
    partyMemberId: string;
    value?: string | null; // Null if masked/hidden
}

export interface Encounter {
    questId: string;
    isRevealed: boolean;
    votes: Record<string, string | null>; // memberId -> value (or null if masked)
    distribution: Record<string, number>;
    outcome?: number; // For sealed encounters
    version?: number;
    hasVoted?: Record<string, boolean>;
    shouldHideVoteCounts?: boolean;
}

export interface RealmStateDto {
    realmCode: string;
    themeKey: string;
    realmVersion?: number;
    questLogVersion?: number;
    encounterVersion?: number | null;
    settings: RealmSettings;
    partyRoster: {
        members: PartyMember[];
    };
    questLog: {
        quests: Quest[];
    };
    encounter: Encounter | null;
}
