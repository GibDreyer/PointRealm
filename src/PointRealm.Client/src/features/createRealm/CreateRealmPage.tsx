import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Loader2, UserX, Sparkles, Edit2, Check, UserPlus } from "lucide-react";
import { generateRandomDisplayName, generateRandomRealmName, generateRandomQuestName } from "@/lib/realmNames";
import { SummoningCircle } from "@/components/ui/SummoningCircle";

import { useTheme } from "@/theme/ThemeProvider";
import { ThemePicker } from "./components/ThemePicker";
import { api } from "@/api/client";
import { useRealmClient } from "@/app/providers/RealtimeProvider";
import { getClientId } from "@/lib/storage";
import { updateProfile, getProfile, STORAGE_KEYS } from "@/lib/storage";
import { useRealmStore } from "@/state/realmStore";
import { useAuth } from "@/features/auth/AuthContext";
import { authApi } from "@/api/auth";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { PageShell } from "@/components/shell/PageShell";
import { PageFooter } from "@/components/ui/PageFooter";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { ToggleSettingRow } from "@/components/ui/ToggleSettingRow";
import { Tooltip } from "@/components/ui/Tooltip";
import { DECKS } from "./constants";
import { BackButton } from "@/components/ui/BackButton";
import { formatThemeCopy, useThemeMode } from "@/theme/ThemeModeProvider";
import styles from "./createRealm.module.css";

// --- Schema ---

const DeckTypeEnum = z.enum(["FIBONACCI", "SHORT_FIBONACCI", "TSHIRT", "CUSTOM"]);

const formSchema = z.object({
  realmName: z.string().max(60).optional(),
  displayName: z.string().min(1, "Display name is required").max(32).trim(),
  themeKey: z.string(),
  deckType: DeckTypeEnum,
  customDeckValuesInput: z.string().optional(),
  autoReveal: z.boolean(),
  allowAbstain: z.boolean(),
  hideVoteCounts: z.boolean(),
  allowEmojiReactions: z.boolean(),
  participateInVoting: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.deckType === "CUSTOM") {
    if (!data.customDeckValuesInput || data.customDeckValuesInput.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customDeckValuesInput"],
        message: "Custom values are required",
      });
      return;
    }

    const values = data.customDeckValuesInput.split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Unique
    const uniqueValues = Array.from(new Set(values));

    if (uniqueValues.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customDeckValuesInput"],
        message: "Must provide at least 3 unique values",
      });
    }

    if (uniqueValues.length > 24) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customDeckValuesInput"],
        message: "Max 24 values allowed",
      });
    }
  }
});

type FormData = z.infer<typeof formSchema>;

// --- Helper Functions ---

const parseCustomDeck = (input: string): string[] => {
  return Array.from(new Set(
    input.split(",").map(s => s.trim()).filter(s => s.length > 0)
  ));
};

const getErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") return "The spell fizzled. An unknown error occurred.";
  const maybeError = error as { message?: string };
  return maybeError.message || "The spell fizzled. An unknown error occurred.";
};

// --- Component ---

export function CreateRealmPage() {
  const navigate = useNavigate();
  const { setThemeKey } = useTheme();
  const { mode } = useThemeMode();
  const client = useRealmClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const tipUrl = import.meta.env.VITE_TIP_JAR_URL || "/tip";
  const tipIsExternal = /^https?:\/\//i.test(tipUrl);

  const { user, isAuthenticated, refreshUser } = useAuth();
  const initialDisplayName = (isAuthenticated && user?.displayName)
    ? user.displayName
    : (localStorage.getItem(STORAGE_KEYS.DISPLAY_NAME) || getProfile().lastDisplayName || "");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      realmName: generateRandomRealmName(),
      displayName: initialDisplayName,
      themeKey: "dark-fantasy-arcane",
      deckType: "FIBONACCI",
      customDeckValuesInput: "",
      autoReveal: true,
      allowAbstain: true,
      hideVoteCounts: false,
      allowEmojiReactions: true,
      participateInVoting: false,
    },
  });

  const { watch, handleSubmit, control, setValue, formState: { errors } } = form;
  const realmNamePlaceholder = mode.key === 'fantasy'
    ? "e.g. The Emerald Sanctum..."
    : mode.key === 'sci-fi'
      ? "e.g. Sigma Outpost..."
      : "e.g. Sprint Alpha...";

  const selectedDeckType = watch("deckType");
  const deckTooltips: Record<"FIBONACCI" | "SHORT_FIBONACCI" | "TSHIRT" | "CUSTOM", string> = {
    FIBONACCI: "Classic Fibonacci deck for balanced estimation.",
    SHORT_FIBONACCI: "Shorter Fibonacci deck for faster voting.",
    TSHIRT: "XS-XL sizing for relative estimates.",
    CUSTOM: "Provide your own comma-separated rune values.",
  };

  const handleSaveProfileName = async () => {
    const newName = watch("displayName");
    if (!newName || newName === user?.displayName) {
      setIsEditingName(false);
      return;
    }

    setIsUpdatingName(true);
    try {
      await authApi.updateProfile({ displayName: newName });
      await refreshUser();
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to update profile name:", err);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      localStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, data.displayName);
      updateProfile({ lastDisplayName: data.displayName });

      if (isAuthenticated && data.displayName !== user?.displayName) {
        try {
          await authApi.updateProfile({ displayName: data.displayName });
          await refreshUser();
        } catch (err) {
          console.error("Failed to update account profile:", err);
          // Non-blocking error, we still proceed with realm creation
        }
      }

      let customDeckValues: string[] | undefined;

      if (data.deckType === "CUSTOM") {
        customDeckValues = parseCustomDeck(data.customDeckValuesInput!);
        if (data.allowAbstain && !customDeckValues.includes("?")) {
          customDeckValues.push("?");
        }
      }

      const createPayload = {
        realmName: data.realmName || undefined,
        themeKey: data.themeKey,
        settings: {
          deckType: data.deckType,
          customDeckValues: customDeckValues,
          autoReveal: data.autoReveal,
          allowAbstain: data.allowAbstain,
          hideVoteCounts: data.hideVoteCounts,
          allowEmojiReactions: data.allowEmojiReactions
        }
      };

      const realmResponse = await api.post<{ code: string }>("realms", createPayload);
      const realmCode = realmResponse.code;

      const joinPayload = {
        displayName: data.displayName,
        role: "GM",
        isObserver: !data.participateInVoting
      };

      const joinResponse = await api.post<{ memberToken: string, memberId: string }>(`realms/${realmCode}/join`, joinPayload);

      sessionStorage.setItem(`pointrealm:v1:realm:${realmCode}:token`, joinResponse.memberToken);
      sessionStorage.setItem(`pointrealm:v1:realm:${realmCode}:memberId`, joinResponse.memberId);

      const clientId = getClientId();
      await client.connect({ realmCode, memberToken: joinResponse.memberToken, clientId });
      
      // Add a default fun quest
      const questName = generateRandomQuestName();
      try {
        await client.requestFullSnapshot();
        const snapshot = useRealmStore.getState().realmSnapshot;
        const questLogVersion = snapshot?.questLogVersion;

        if (!questLogVersion) {
          console.warn("Quest log version not available yet; skipping default quest.");
        } else {
          const addQuestResult = await client.addQuest({
            title: questName,
            description: formatThemeCopy("Your work starts here. Share your {rune} to estimate complexity.", mode.labels),
            questLogVersion,
          });
          const questId = addQuestResult.success ? addQuestResult.payload : undefined;

          if (questId) {
            const latestSnapshot = useRealmStore.getState().realmSnapshot;
            const questVersion = latestSnapshot?.questLog?.quests.find((q) => q.id === questId)?.version;
            const realmVersion = latestSnapshot?.realmVersion;

            if (questVersion && realmVersion) {
              // Immediately start the encounter so the creator lands in a voting state
              await client.startEncounter({ questId, realmVersion, questVersion });
            } else {
              console.warn("Missing quest or realm version; skipping auto-start.");
            }
          }
        }
      } catch (err) {
        console.error("Failed to add default quest:", err);
      }

      setThemeKey(data.themeKey);
      navigate(`/realm/${realmCode}`);

    } catch (err) {
      console.error(err);
      setServerError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      backgroundDensity="medium"
      backgroundVariant="realm"
      reducedMotion={prefersReducedMotion}
      contentClassName={styles.page}
    >
      {mode.showBackdrop && <SummoningCircle />}
      
      <BackButton to="/" label={`Back to ${mode.phrases.lobbyTitle}`} position="absolute" />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex justify-center z-10"
      >
        <Panel variant="realm" className="w-[100%] max-w-[900px]">
          <PageHeader
            title={mode.phrases.createRealm}
            subtitle={formatThemeCopy("Define your {realm} and estimation flow.", mode.labels)}
            size="panel"
            className={styles.header}
          />

          {serverError && (
            <div className="mx-8 mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-center">
              <span className="text-red-400 font-medium block text-sm">The spell fizzled</span>
              <span className="text-red-300/80 text-xs">{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.formGrid}>
              
              {/* Left Column: Core Identity */}
              <div className={styles.formColumn}>
                
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                     <h2 className={styles.sectionTitle}>Identity</h2>
                  </div>
                  <div className={styles.field}>
                    <Input
                      label={formatThemeCopy("{realm} Name", mode.labels)}
                      tooltip={formatThemeCopy("Optional. Leave blank to keep the generated {realm} name.", mode.labels)}
                      {...form.register("realmName")}
                      placeholder={realmNamePlaceholder}
                      disabled={isSubmitting}
                      error={errors.realmName?.message}
                      className="bg-black/20"
                      rightElement={
                        <Tooltip content={formatThemeCopy("Generate a fresh {realm} name.", mode.labels)}>
                          <button
                            type="button"
                            className={styles.randomizeBtn}
                            onClick={() => setValue("realmName", generateRandomRealmName())}
                            aria-label={formatThemeCopy("Generate random {realm} name", mode.labels)}
                          >
                            <Sparkles size={16} />
                          </button>
                        </Tooltip>
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <Input
                      label="Your Name"
                      tooltip={isAuthenticated ? "This is your permanent account identity." : formatThemeCopy("This name is shown to everyone in the {realm}.", mode.labels)}
                      {...form.register("displayName")}
                      placeholder={isAuthenticated ? user?.displayName || "Your Name" : mode.key === 'fantasy' ? "e.g. Archmage Aethelgard" : "e.g. Morgan"}
                      disabled={isSubmitting || isUpdatingName}
                      readOnly={isAuthenticated && !isEditingName}
                      error={errors.displayName?.message}
                      className="bg-black/20"
                      rightElement={isAuthenticated ? (
                        isEditingName ? (
                          <Tooltip content="Confirm and save name to your profile">
                            <button
                              type="button"
                              className={styles.randomizeBtn}
                              onClick={handleSaveProfileName}
                              disabled={isUpdatingName}
                              aria-label="Save name"
                            >
                              {isUpdatingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                          </Tooltip>
                        ) : (
                          <Tooltip content="Linked to account. Click to change your profile name.">
                            <button
                              type="button"
                              className={styles.randomizeBtn}
                              onClick={() => setIsEditingName(true)}
                              aria-label="Edit name"
                            >
                              <Edit2 size={16} />
                            </button>
                          </Tooltip>
                        )
                      ) : (
                        <Tooltip content="Generate a fantasy adventurer name.">
                          <button
                            type="button"
                            className={styles.randomizeBtn}
                            onClick={() => form.setValue("displayName", generateRandomDisplayName(), { shouldValidate: true })}
                            aria-label="Generate random display name"
                          >
                            <Sparkles size={16} />
                          </button>
                        </Tooltip>
                      )}
                    />
                  </div>
                </section>

                 <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Rune Set</h2>
                  </div>
                  <div className={styles.optionRow}>
                    {(["FIBONACCI", "SHORT_FIBONACCI", "TSHIRT", "CUSTOM"] as const).map(type => (
                      <Tooltip key={type} content={deckTooltips[type]}>
                        <Button
                          type="button"
                          variant={selectedDeckType === type ? "secondary" : "primary"}
                          onClick={() => setValue("deckType", type)}
                          className={`w-full min-h-[44px] h-[48px] px-2 py-0 !text-[0.6rem] sm:!text-[0.7rem] leading-none tracking-widest ${selectedDeckType !== type ? 'opacity-70 hover:opacity-100 grayscale-[0.6] hover:grayscale-0' : ''}`}
                        >
                          {type === "SHORT_FIBONACCI" ? "Short Fib." : type === "TSHIRT" ? "T-Shirt" : type.replace("_", " ")}
                        </Button>
                      </Tooltip>
                    ))}
                  </div>

                  {selectedDeckType === "CUSTOM" && (
                    <motion.div
                      className={styles.field}
                      initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        label="Custom Values"
                        tooltip="Comma-separated rune values. Use ? to allow abstain."
                        helper="Comma separated runes. Max 24."
                        {...form.register("customDeckValuesInput")}
                        placeholder="0, 1, 2, 3, 5, 8, ?"
                        disabled={isSubmitting}
                        error={errors.customDeckValuesInput?.message}
                        className="bg-black/20 font-heading"
                      />
                    </motion.div>
                  )}

                  {/* Rune Deck Preview */}
                  <div className={styles.deckPreview}>
                     <div className={styles.deckGrid}>
                        {(selectedDeckType === "CUSTOM" 
                            ? (watch("customDeckValuesInput") ? parseCustomDeck(watch("customDeckValuesInput")!) : [])
                            : DECKS[selectedDeckType as keyof typeof DECKS] || []
                        ).slice(0, 8).map((val, i) => (
                           <div key={i} className={styles.previewCard}>
                              <span className={styles.previewCardValue}>{val}</span>
                           </div>
                        ))}
                        {(selectedDeckType === "CUSTOM" || DECKS[selectedDeckType as keyof typeof DECKS]?.length > 8) && (
                           <div className={styles.previewCardMore}>...</div>
                        )}
                     </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Settings & Rituals */}
              <div className={styles.formColumn}>
                
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Rituals</h2>
                  </div>
                  <div className={styles.toggleList}>
                    <ToggleSettingRow
                      icon={Eye}
                      label="Auto Reveal"
                      description="When all voted"
                      tooltip="Automatically reveal results once all players vote."
                      {...form.register("autoReveal")}
                      disabled={isSubmitting}
                      rowClassName={styles.toggleItem}
                    />

                    <ToggleSettingRow
                      icon={UserX}
                      label="Allow Abstain"
                      description="Permit uncertainty"
                      tooltip="Adds a '?' rune so players can abstain."
                      {...form.register("allowAbstain")}
                      disabled={isSubmitting}
                      rowClassName={styles.toggleItem}
                    />

                    <ToggleSettingRow
                      icon={EyeOff}
                      label="Hide Counts"
                      description="Until reveal"
                      tooltip="Hide how many votes are in until the reveal."
                      {...form.register("hideVoteCounts")}
                      disabled={isSubmitting}
                      rowClassName={styles.toggleItem}
                    />
                    
                    <div className="mt-4 pt-4 border-t border-pr-border/30">
                      <ToggleSettingRow
                        icon={UserPlus}
                        label="Join as Voter"
                        description="Participate in voting"
                        tooltip="By default GMs are spectators. Check this to cast your own votes."
                        {...form.register("participateInVoting")}
                        disabled={isSubmitting}
                        rowClassName={styles.toggleItem}
                      />
                    </div>
                  </div>
                </section>

                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Atmosphere</h2>
                  </div>
                  <Controller
                    control={control}
                    name="themeKey"
                    render={({ field }) => (
                      <ThemePicker 
                        selectedThemeKey={field.value || "dark-fantasy-arcane"} 
                        onThemeSelect={(key) => {
                          field.onChange(key);
                          setThemeKey(key);
                        }} 
                      />
                    )}
                  />
                </section>

              </div>
            </div>

            <div className={styles.actions}>
              <Tooltip content="Create the realm and enter as the facilitator.">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="primary"
                  className="w-full md:w-auto min-w-[300px] h-14 text-lg tracking-[0.2em] uppercase"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2" />
                      Summoning...
                    </>
                  ) : (
                    "Create Realm"
                  )}
                </Button>
              </Tooltip>
              <p className={styles.disclaimer}>
                By entering the realm, you agree to the{" "}
                <a className={styles.inlineLink} href="/code-of-conduct">Code of Conduct</a>.
              </p>
            </div>
          </form>
        </Panel>
      </motion.div>

      <footer className={styles.footer}>
        <PageFooter tipUrl={tipUrl} tipIsExternal={tipIsExternal} />
      </footer>
    </PageShell>
  );
}
