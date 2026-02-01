export interface RealmSettings {
    deckType: string;
    customDeckValues?: string[];
    autoReveal: boolean;
    allowAbstain: boolean;
    hideVoteCounts: boolean;
}

export interface RealmInfo {
    code: string;
    name?: string;
    themeKey: string;
    settings: RealmSettings;
}

export interface PartyMember {
    memberId: string;
    displayName: string;
    avatarEmoji?: string | null;
    classBadgeKey?: string;
    presence: "Online" | "Offline";
    voteState: "NotVoting" | "Choosing" | "LockedIn";
    isGM: boolean;
}

export interface MyInfo {
    memberId: string;
    displayName: string;
    role: "GM" | "Participant" | "Observer";
}

export interface PortalInfo {
    joinUrl: string;
}

export interface QuestLogSummary {
    totalQuests: number;
    activeQuestId?: string;
    activeQuestTitle?: string;
    quests: { id: string; title: string; }[];
}

export interface LobbySnapshot {
    realm: RealmInfo;
    me: MyInfo;
    party: PartyMember[];
    portal: PortalInfo;
    questLogSummary: QuestLogSummary;
    activeEncounterId?: string;
}
