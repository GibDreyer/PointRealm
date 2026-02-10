export interface RealmSettings {
    deckType: string;
    customDeckValues?: string[];
    autoReveal: boolean;
    allowAbstain: boolean;
    hideVoteCounts: boolean;
    allowEmojiReactions: boolean;
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
    profileImageUrl?: string | null;
    profileEmoji?: string | null;
    classBadgeKey?: string;
    presence: "Online" | "Offline";
    voteState: "NotVoting" | "Choosing" | "LockedIn";
    role: "GM" | "Participant" | "Observer";
}

export interface MyInfo {
    memberId: string;
    displayName: string;
    role: "GM" | "Participant" | "Observer";
}

export interface PortalInfo {
    joinUrl: string;
}

export type LobbyQuestStatus = "Ready" | "Estimating" | "Estimated";

export interface LobbyQuest {
    id: string;
    title: string;
    status: LobbyQuestStatus;
    orderIndex: number;
}

export interface QuestLogSummary {
    totalQuests: number;
    questLogVersion: number;
    activeQuestId?: string;
    activeQuestTitle?: string;
    quests: LobbyQuest[];
}

export interface LobbySnapshot {
    realm: RealmInfo;
    me: MyInfo;
    party: PartyMember[];
    portal: PortalInfo;
    questLogSummary: QuestLogSummary;
    activeEncounterId?: string;
}
