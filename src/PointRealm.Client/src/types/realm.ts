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
    status: "Open" | "Sealed";
    order: number;
    externalUrl?: string; // Optional, might be added later
    externalId?: string;
    sealedEstimate?: string; // For sealed quests
}

export interface PartyMember {
    id: string;
    name: string;
    role: "GM" | "Member";
    status: "ready" | "choosing" | "disconnected";
    isOnline: boolean;
    hasVoted?: boolean; // Derived or explicit
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
}

export interface RealmStateDto {
    realmCode: string;
    themeKey: string;
    settings: RealmSettings;
    partyRoster: {
        members: PartyMember[];
    };
    questLog: {
        quests: Quest[];
    };
    encounter: Encounter | null;
}
