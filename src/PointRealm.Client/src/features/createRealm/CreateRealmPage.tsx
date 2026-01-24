import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Loader2, UserX } from "lucide-react";

import { useTheme } from "@/theme/ThemeProvider";
import { ThemePicker } from "./components/ThemePicker";
import { api } from "@/api/client";
import { hub } from "@/realtime/hub";
import { updateProfile, getProfile, STORAGE_KEYS } from "@/lib/storage";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { RuneChip } from "@/components/ui/RuneChip";
import { PageShell } from "@/components/shell/PageShell";
import { PageFooter } from "@/components/ui/PageFooter";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel"; // Use new Panel
import { Toggle } from "@/components/ui/Toggle"; // Use new Toggle
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

// --- Component ---

export function CreateRealmPage() {
  const navigate = useNavigate();
  const { setThemeKey } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const tipUrl = import.meta.env.VITE_TIP_JAR_URL || "/tip";
  const tipIsExternal = /^https?:\/\//i.test(tipUrl);

  const initialDisplayName = localStorage.getItem(STORAGE_KEYS.DISPLAY_NAME) || getProfile().lastDisplayName || "";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      realmName: "",
      displayName: initialDisplayName,
      themeKey: "dark-fantasy-arcane",
      deckType: "FIBONACCI",
      customDeckValuesInput: "",
      autoReveal: true,
      allowAbstain: true,
      hideVoteCounts: false,
    },
  });

  const { watch, handleSubmit, control, setValue, formState: { errors } } = form;

  const selectedDeckType = watch("deckType");

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      localStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, data.displayName);
      updateProfile({ lastDisplayName: data.displayName });

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
          hideVoteCounts: data.hideVoteCounts
        }
      };

      const realmResponse = await api.post<{ code: string }>("realms", createPayload);
      const realmCode = realmResponse.code;

      const joinPayload = {
        displayName: data.displayName,
        role: "GM"
      };

      const joinResponse = await api.post<{ memberToken: string, memberId: string }>(`realms/${realmCode}/join`, joinPayload);

      sessionStorage.setItem(`pointrealm:v1:realm:${realmCode}:token`, joinResponse.memberToken);
      sessionStorage.setItem(`pointrealm:v1:realm:${realmCode}:memberId`, joinResponse.memberId);

      await hub.connect(joinResponse.memberToken);
      setThemeKey(data.themeKey);
      navigate(`/realm/${realmCode}/lobby`);

    } catch (err: any) {
      console.error(err);
      setServerError(err.message || "The spell fizzled. An unknown error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      backgroundDensity="medium"
      backgroundVariant="realm" // Use realm variant to possibly show runes or different bg
      reducedMotion={prefersReducedMotion}
      contentClassName={styles.page}
    >
      <div className={styles.summoningCircle} aria-hidden="true" />
      
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: "easeOut" }}
        className="w-full flex justify-center z-10"
      >
        <Panel className={styles.panel}>
          <PageHeader
            title="Create Realm"
            subtitle="Summon a new session."
            size="panel"
            className={styles.header}
          />

          {serverError && (
            <div className={styles.error}>
              <span className={styles.errorTitle}>The spell fizzled</span>
              <span className={styles.errorMessage}>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.formGrid}>
              
              {/* Left Column */}
              <div className={styles.formColumn}>
                
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                     <h2 className={styles.sectionTitle}>Realm Name</h2>
                  </div>
                  <div className={styles.field}>
                    <Input
                      {...form.register("realmName")}
                      placeholder="Optional name for your realm"
                      disabled={isSubmitting}
                      error={errors.realmName?.message}
                      className="bg-black/30 border-white/10" // Overlay specific style if needed or rely on default
                    />
                  </div>
                </section>

                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                     <h2 className={styles.sectionTitle}>Display Name</h2>
                  </div>
                  <div className={styles.field}>
                    <Input
                      {...form.register("displayName")}
                      placeholder="e.g. Archmage"
                      disabled={isSubmitting}
                      error={errors.displayName?.message}
                      helper="Name shown to other players"
                    />
                  </div>
                </section>

                 <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Rune Set</h2>
                  </div>
                  <div className={styles.optionRow}>
                    {(["FIBONACCI", "SHORT_FIBONACCI", "TSHIRT", "CUSTOM"] as const).map(type => (
                      <RuneChip
                        key={type}
                        type="button"
                        active={selectedDeckType === type}
                        onClick={() => setValue("deckType", type)}
                      >
                        {type === "SHORT_FIBONACCI" ? "Short Fib." : type === "TSHIRT" ? "T-Shirt" : type.charAt(0) + type.slice(1).toLowerCase()}
                      </RuneChip>
                    ))}
                  </div>

                  {selectedDeckType === "CUSTOM" && (
                    <motion.div
                      className={styles.field}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeOut" }}
                    >
                      <Input
                        label="Custom Values"
                        helper="Comma separated runes. Max 24."
                        {...form.register("customDeckValuesInput")}
                        placeholder="0, 1, 2, 3, 5, 8, ?"
                        disabled={isSubmitting}
                        error={errors.customDeckValuesInput?.message}
                      />
                    </motion.div>
                  )}
                </section>
              </div>

              {/* Right Column */}
              <div className={styles.formColumn}>
                
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Realm Rituals</h2>
                  </div>
                  <div className={styles.toggleList}>
                    {/* Manual Layout for Toggle Row to match mock */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                           <Eye className="w-4 h-4 text-[var(--pr-primary-cyan)]" />
                           <div className="flex flex-col text-left">
                               <span className="text-sm font-medium text-[var(--pr-text-primary)]">Prophecy reveals when all have voted</span>
                               <span className="text-xs text-[var(--pr-text-muted)]">Auto reveal</span>
                           </div>
                        </div>
                        <Toggle {...form.register("autoReveal")} disabled={isSubmitting} />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                           <UserX className="w-4 h-4 text-[var(--pr-primary-cyan)]" />
                           <div className="flex flex-col text-left">
                               <span className="text-sm font-medium text-[var(--pr-text-primary)]">Permit uncertainty (?)</span>
                               <span className="text-xs text-[var(--pr-text-muted)]">Allow abstain</span>
                           </div>
                        </div>
                        <Toggle {...form.register("allowAbstain")} disabled={isSubmitting} />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                           <EyeOff className="w-4 h-4 text-[var(--pr-primary-cyan)]" />
                           <div className="flex flex-col text-left">
                               <span className="text-sm font-medium text-[var(--pr-text-primary)]">Hide vote counts</span>
                               <span className="text-xs text-[var(--pr-text-muted)]">Visibility</span>
                           </div>
                        </div>
                        <Toggle {...form.register("hideVoteCounts")} disabled={isSubmitting} />
                    </div>
                  </div>
                </section>

                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Theme</h2>
                  </div>
                  <Controller
                    control={control}
                    name="themeKey"
                    render={({ field }) => (
                      <ThemePicker selectedThemeKey={field.value} onThemeSelect={field.onChange} />
                    )}
                  />
                </section>

              </div>
            </div>

            <div className={styles.actions}>
              <Button
                type="submit"
                fullWidth
                disabled={isSubmitting}
                variant="primary"
                className="h-14 text-base tracking-[0.2em]"
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
              <p className={styles.disclaimer}>
                By creating a realm, you agree to the{" "}
                <a className={styles.inlineLink} href="/code-of-conduct">Code of Conduct</a>.
              </p>
            </div>
          </form>
        </Panel>
      </motion.div>

      <div className={styles.backRow}>
        <button type="button" className={styles.backLink} onClick={() => navigate("/")}> 
          <ArrowLeft className={styles.backIcon} />
          Back to Tavern
        </button>
      </div>

      <footer className={styles.footer}>
        <PageFooter tipUrl={tipUrl} tipIsExternal={tipIsExternal} />
      </footer>
    </PageShell>
  );
}
