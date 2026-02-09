import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTheme } from './ThemeProvider';

export type ThemeModeKey = 'fantasy' | 'sci-fi' | 'minimal';

type ThemeLabels = {
  realm: string;
  quest: string;
  encounter: string;
  rune: string;
  prophecy: string;
  party: string;
  facilitator: string;
  round: string;
};

type ThemePhrases = {
  tagline: string;
  createRealm: string;
  joinRealm: string;
  enteringRealm: string;
  copyLink: string;
  copied: string;
  lobbyTitle: string;
  lobbySubtitle: string;
  connectionLostTitle: string;
  connectionLostBody: string;
  restoreConnection: string;
  partyTitle: string;
  partySubtitle: string;
  sigilTitle: string;
  sigilSubtitle: string;
  questLogTitle: string;
  questLogSubtitle: string;
  noActiveQuests: string;
  addQuest: string;
  startEncounter: string;
  startEncounterSub: string;
  revealProphecy: string;
  revealProphecySub: string;
  rerollFates: string;
  rerollFatesSub: string;
  sealOutcome: string;
  castYourRune: string;
  castYourRuneSub: string;
  activeQuest: string;
  quietRealmTitle: string;
  quietRealmSubtitleGM: string;
  quietRealmSubtitlePlayer: string;
  beginQuest: string;
  beginQuestSub: string;
  facilitatorTitle: string;
  accountWelcome: string;
};

type ThemeModeStyles = {
  shell: string;
  headerTitle: string;
  headerSubtitle: string;
  headerDivider: string;
  sectionTitle: string;
  sectionDivider: string;
  sectionSubtitle: string;
  toggle: string;
  toggleActive: string;
};

export type ThemeMode = {
  key: ThemeModeKey;
  label: string;
  description: string;
  themeKey: string;
  useRealmTheme: boolean;
  showOrnaments: boolean;
  showBackdrop: boolean;
  labels: ThemeLabels;
  phrases: ThemePhrases;
  styles: ThemeModeStyles;
};

const themeModeStorageKey = 'pointrealm:theme-mode';

const buildPhrases = (labels: ThemeLabels, overrides?: Partial<ThemePhrases>): ThemePhrases => {
  const phrases: ThemePhrases = {
    tagline: 'Co-op estimation',
    createRealm: `Create ${labels.realm}`,
    joinRealm: `Join ${labels.realm}`,
    enteringRealm: `Entering the ${labels.realm}`,
    copyLink: `Copy ${labels.realm} Link`,
    copied: 'Copied!',
    lobbyTitle: `${labels.realm} Lobby`,
    lobbySubtitle: `Await the ${labels.party.toLowerCase()}`,
    connectionLostTitle: 'Connection Lost',
    connectionLostBody: `The signal faded. Your connection to the ${labels.realm.toLowerCase()} has ended.`,
    restoreConnection: 'Restore Connection',
    partyTitle: labels.party,
    partySubtitle: 'Members',
    sigilTitle: 'Your Sigil',
    sigilSubtitle: `Choose an emoji avatar for the ${labels.party.toLowerCase()}.`,
    questLogTitle: `${labels.quest} Log`,
    questLogSubtitle: `Active ${labels.encounter.toLowerCase()}s`,
    noActiveQuests: `No active ${labels.quest.toLowerCase()}s`,
    addQuest: `Add ${labels.quest.toLowerCase()}`,
    startEncounter: `Begin ${labels.encounter}`,
    startEncounterSub: `Start a new ${labels.round.toLowerCase()}`,
    revealProphecy: `Reveal ${labels.prophecy}`,
    revealProphecySub: 'Show all votes',
    rerollFates: `Re-${labels.round.toLowerCase()} the ${labels.round === 'Round' ? 'round' : labels.round.toLowerCase()}`,
    rerollFatesSub: `Clear and restart`,
    sealOutcome: 'Seal Outcome',
    castYourRune: `Cast Your ${labels.rune}`,
    castYourRuneSub: 'Make your estimation',
    activeQuest: `Active ${labels.quest}`,
    quietRealmTitle: `Quiet ${labels.realm}`,
    quietRealmSubtitleGM: `Select a ${labels.quest.toLowerCase()} from the log to begin an ${labels.encounter.toLowerCase()}.`,
    quietRealmSubtitlePlayer: `Wait for the ${labels.facilitator} to initiate the ${labels.encounter.toLowerCase()}.`,
    beginQuest: `Begin ${labels.quest}`,
    beginQuestSub: 'Commence the ritual',
    facilitatorTitle: labels.facilitator,
    accountWelcome: 'Hi',
  };

  return { ...phrases, ...overrides };
};

const themeModes: Record<ThemeModeKey, ThemeMode> = {
  fantasy: {
    key: 'fantasy',
    label: 'Fantasy',
    description: 'Arcane, ornate, and mythic.',
    themeKey: 'dark-fantasy-arcane',
    useRealmTheme: true,
    showOrnaments: true,
    showBackdrop: true,
    labels: {
      realm: 'Realm',
      quest: 'Quest',
      encounter: 'Encounter',
      rune: 'Rune',
      prophecy: 'Prophecy',
      party: 'Party',
      facilitator: 'Facilitator',
      round: 'Round',
    },
    phrases: buildPhrases({
      realm: 'Realm',
      quest: 'Quest',
      encounter: 'Encounter',
      rune: 'Rune',
      prophecy: 'Prophecy',
      party: 'Party',
      facilitator: 'Facilitator',
      round: 'Round',
    }, {
      lobbyTitle: 'Tavern',
      lobbySubtitle: 'Realm Lobby',
      connectionLostBody: 'The magical currents are too turbulent. Your connection to the realm has faded.',
      sigilTitle: 'Your Sigil',
      sigilSubtitle: 'Choose an emoji avatar for the party.',
      rerollFates: 'Re-roll Fates',
      rerollFatesSub: 'Clear and restart',
      sealOutcome: 'Seal Outcome',
      beginQuestSub: 'Commence the ritual',
      revealProphecySub: 'Show all votes',
      castYourRuneSub: 'Make your estimation',
    }),
    styles: {
      shell: 'bg-pr-bg text-pr-text',
      headerTitle: 'text-pr-text',
      headerSubtitle: 'text-pr-text-muted',
      headerDivider: '',
      sectionTitle: 'text-[var(--pr-secondary-gold)] tracking-[0.18em] uppercase font-variant-small-caps',
      sectionDivider: 'from-[color-mix(in_srgb,var(--pr-secondary),transparent_60%)]',
      sectionSubtitle: 'text-pr-text-muted/75',
      toggle: 'bg-black/40 border-white/10 text-pr-text-muted',
      toggleActive: 'border-pr-primary text-pr-text',
    },
  },
  'sci-fi': {
    key: 'sci-fi',
    label: 'Sci-Fi',
    description: 'Neon signal, starbound control.',
    themeKey: 'neon-void',
    useRealmTheme: false,
    showOrnaments: true,
    showBackdrop: true,
    labels: {
      realm: 'Sector',
      quest: 'Mission',
      encounter: 'Simulation',
      rune: 'Signal',
      prophecy: 'Readout',
      party: 'Crew',
      facilitator: 'Commander',
      round: 'Run',
    },
    phrases: buildPhrases({
      realm: 'Sector',
      quest: 'Mission',
      encounter: 'Simulation',
      rune: 'Signal',
      prophecy: 'Readout',
      party: 'Crew',
      facilitator: 'Commander',
      round: 'Run',
    }, {
      tagline: 'Crew estimation',
      lobbyTitle: 'Briefing Bay',
      lobbySubtitle: 'Sector Lobby',
      connectionLostTitle: 'Signal Lost',
      connectionLostBody: 'The uplink dropped. Reconnect to the sector.',
      restoreConnection: 'Reconnect',
      sigilTitle: 'Crew Badge',
      sigilSubtitle: 'Choose an emoji badge for the crew.',
      rerollFates: 'Reboot Run',
      rerollFatesSub: 'Clear signals and reboot',
      sealOutcome: 'Lock Outcome',
      beginQuestSub: 'Initiate the sim',
      revealProphecySub: 'Broadcast all signals',
      castYourRune: 'Transmit Signal',
      castYourRuneSub: 'Send your estimate',
      activeQuest: 'Active Mission',
      quietRealmTitle: 'Idle Sector',
      quietRealmSubtitleGM: 'Select a mission from the log to launch a simulation.',
      quietRealmSubtitlePlayer: 'Await the commander to launch the simulation.',
      facilitatorTitle: 'Command',
    }),
    styles: {
      shell: 'bg-pr-bg text-pr-text',
      headerTitle: 'text-pr-text drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]',
      headerSubtitle: 'text-pr-text-muted',
      headerDivider: 'from-pr-primary/70',
      sectionTitle: 'text-pr-primary tracking-[0.24em] uppercase',
      sectionDivider: 'from-pr-primary/60',
      sectionSubtitle: 'text-pr-text-muted/80',
      toggle: 'bg-pr-surface/70 border-pr-border/60 text-pr-text-muted',
      toggleActive: 'border-pr-primary text-pr-text',
    },
  },
  minimal: {
    key: 'minimal',
    label: 'Minimal',
    description: 'Clean, calm, and professional.',
    themeKey: 'minimal-slate',
    useRealmTheme: false,
    showOrnaments: false,
    showBackdrop: false,
    labels: {
      realm: 'Session',
      quest: 'Work Item',
      encounter: 'Estimate',
      rune: 'Vote',
      prophecy: 'Results',
      party: 'Team',
      facilitator: 'Moderator',
      round: 'Round',
    },
    phrases: buildPhrases({
      realm: 'Session',
      quest: 'Work Item',
      encounter: 'Estimate',
      rune: 'Vote',
      prophecy: 'Results',
      party: 'Team',
      facilitator: 'Moderator',
      round: 'Round',
    }, {
      tagline: 'Team estimation',
      lobbyTitle: 'Lobby',
      lobbySubtitle: 'Team room',
      connectionLostBody: 'The connection dropped. Please reconnect to continue.',
      restoreConnection: 'Reconnect',
      sigilTitle: 'Your Avatar',
      sigilSubtitle: 'Choose an emoji avatar for the team.',
      rerollFates: 'Restart Round',
      rerollFatesSub: 'Clear votes and restart',
      sealOutcome: 'Finalize Outcome',
      beginQuestSub: 'Start the round',
      revealProphecySub: 'Reveal all votes',
      castYourRune: 'Submit Your Vote',
      castYourRuneSub: 'Share your estimate',
      quietRealmTitle: 'Waiting Room',
      quietRealmSubtitleGM: 'Select a work item to start an estimate.',
      quietRealmSubtitlePlayer: 'Waiting for the moderator to start the estimate.',
      facilitatorTitle: 'Moderator',
      accountWelcome: 'Welcome',
    }),
    styles: {
      shell: 'bg-pr-bg text-pr-text font-body',
      headerTitle: 'text-pr-text font-semibold tracking-normal',
      headerSubtitle: 'text-pr-text-muted',
      headerDivider: 'from-pr-border',
      sectionTitle: 'text-pr-text font-semibold tracking-[0.08em] uppercase',
      sectionDivider: 'from-pr-border',
      sectionSubtitle: 'text-pr-text-muted',
      toggle: 'bg-pr-surface border-pr-border text-pr-text-muted',
      toggleActive: 'border-pr-primary text-pr-text',
    },
  },
};

interface ThemeModeContextValue {
  mode: ThemeMode;
  setModeKey: (key: ThemeModeKey) => void;
  availableModes: ThemeMode[];
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
};

export const formatThemeCopy = (text: string, labels: ThemeLabels) => {
  return text.replace(/\{(\w+)\}/g, (_, token) => {
    const key = token as keyof ThemeLabels;
    return labels[key] ?? token;
  });
};

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setThemeKey } = useTheme();
  const [modeKey, setModeKey] = useState<ThemeModeKey>(() => {
    const stored = typeof window === 'undefined' ? null : localStorage.getItem(themeModeStorageKey);
    if (stored && (stored === 'fantasy' || stored === 'sci-fi' || stored === 'minimal')) {
      return stored;
    }
    return 'fantasy';
  });

  const mode = useMemo(() => themeModes[modeKey], [modeKey]);
  const availableModes = useMemo(() => Object.values(themeModes), []);

  useEffect(() => {
    if (!mode.useRealmTheme) {
      setThemeKey(mode.themeKey);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(themeModeStorageKey, mode.key);
      document.documentElement.dataset.themeMode = mode.key;
    }
  }, [mode, setThemeKey]);

  const value = useMemo(() => ({
    mode,
    setModeKey,
    availableModes,
  }), [mode, availableModes]);

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
};
