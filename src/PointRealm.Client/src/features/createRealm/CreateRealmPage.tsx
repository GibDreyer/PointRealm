import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, Dice5, Eye, EyeOff, UserX } from "lucide-react";

import { useTheme } from "@/theme/ThemeProvider";
import { RealmShell } from "@/app/layouts/RealmShell";
import { ThemePreview } from "./components/ThemePreview";
import { ThemePicker } from "./components/ThemePicker";
import { api } from "@/api/client";
import { hub } from "@/realtime/hub";
import { updateProfile, getProfile, STORAGE_KEYS } from "@/lib/storage";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/Button";
import { RuneChip } from "@/components/ui/RuneChip";

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
}

// --- Component ---

export function CreateRealmPage() {
  const navigate = useNavigate();
  const { availableThemes, setThemeKey } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Initial display name from storage
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
  
  const selectedThemeKey = watch("themeKey");
  const selectedDeckType = watch("deckType");
  const selectedTheme = availableThemes.find(t => t.key === selectedThemeKey) || availableThemes[0]!;

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
      navigate(`/realm/${realmCode}/tavern`);

    } catch (err: any) {
      console.error(err);
      setServerError(err.message || "The spell fizzled. An unknown error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full p-4 rounded-lg bg-pr-bg border border-pr-border/60 focus:border-pr-primary/50 focus:ring-1 focus:ring-pr-primary/30 outline-none transition-all duration-300 text-pr-text placeholder:text-pr-text-muted/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]";
  const labelClasses = "text-[10px] font-black text-pr-primary/70 mb-1.5 block uppercase tracking-[0.2em]";

  return (
    <RealmShell className="justify-center">
       <motion.div 
         initial={{ opacity: 0, scale: 0.98 }}
         animate={{ opacity: 1, scale: 1 }}
         className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start py-8"
       >
          {/* Main Form Panel */}
          <div className="lg:col-span-7">
              <Panel className="relative">
                  {/* Local Focal Glow (Summoning Circle effect) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-pr-primary/[0.03] rounded-full blur-[100px] pointer-events-none" />

                  <header className="mb-10 relative z-10">
                      <SectionHeader 
                        title="Draft Realm" 
                        subtitle="Identity & Mechanics"
                      />
                  </header>

                  {serverError && (
                      <div className="mb-10 p-5 rounded-lg bg-pr-danger/10 border border-pr-danger/30 text-pr-danger flex items-start gap-4 relative z-10 shadow-lg">
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 opacity-80" />
                          <div>
                              <strong className="block text-xs uppercase tracking-[0.2em] font-black pb-1">The spell fizzled</strong>
                              <span className="text-[11px] font-bold italic opacity-70 leading-relaxed">{serverError}</span>
                          </div>
                      </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 relative z-10">
                      
                      {/* Identity */}
                      <div className="space-y-6">
                          <div className="flex items-center gap-4 mb-2">
                             <div className="h-px flex-1 bg-gradient-to-r from-transparent to-pr-border/40" />
                             <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-pr-text-muted/60 italic">Sacred Identity</h3>
                             <div className="h-px flex-1 bg-gradient-to-l from-transparent to-pr-border/40" />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClasses}>Realm Label</label>
                                <input
                                    {...form.register("realmName")}
                                    className={inputClasses}
                                    placeholder="e.g. Core System Forge"
                                    disabled={isSubmitting}
                                />
                                {errors.realmName && <p className="text-[10px] font-bold uppercase tracking-widest text-pr-danger mt-1.5">{errors.realmName.message}</p>}
                            </div>

                            <div>
                                <label className={labelClasses}>Your Inscription</label>
                                <input
                                    {...form.register("displayName")}
                                    className={inputClasses}
                                    placeholder="e.g. Archmage"
                                    disabled={isSubmitting}
                                />
                                {errors.displayName && <p className="text-[10px] font-bold uppercase tracking-widest text-pr-danger mt-1.5">{errors.displayName.message}</p>}
                            </div>
                          </div>
                      </div>

                      {/* Theme */}
                      <div>
                           <div className="flex items-center gap-4 mb-6">
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-pr-border/40" />
                              <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-pr-text-muted/60 italic">Aesthetic Veil</h3>
                              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-pr-border/40" />
                           </div>
                           <Controller
                               control={control}
                               name="themeKey"
                               render={({ field }) => (
                                   <ThemePicker 
                                     selectedThemeKey={field.value} 
                                     onThemeSelect={field.onChange} 
                                   />
                               )}
                           />
                      </div>

                      {/* Mechanics */}
                      <div className="space-y-6">
                          <div className="flex items-center gap-4 mb-2">
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-pr-border/40" />
                              <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-pr-text-muted/60 italic">Rite of Numbers</h3>
                              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-pr-border/40" />
                          </div>
                          
                          <div className="space-y-6">
                              <div>
                                  <label className={labelClasses}>Rune Manifestation (Deck)</label>
                                  <div className="flex flex-wrap gap-3">
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
                              </div>

                              {selectedDeckType === "CUSTOM" && (
                                  <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="overflow-hidden"
                                  >
                                      <label className={labelClasses}>Custom Lexicon</label>
                                      <input
                                          {...form.register("customDeckValuesInput")}
                                          className={`${inputClasses} font-mono text-xs`}
                                          placeholder="0, 1, 2, 3, 5, 8, ?, ☕"
                                          disabled={isSubmitting}
                                      />
                                      <p className="text-[10px] text-pr-text-muted mt-2 font-bold italic opacity-60">Comma separated runes. Max 24.</p>
                                      {errors.customDeckValuesInput && <p className="text-[10px] font-bold uppercase tracking-widest text-pr-danger mt-1.5">{errors.customDeckValuesInput.message}</p>}
                                  </motion.div>
                              )}
                          </div>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-3 p-4 bg-pr-surface/50 rounded-[var(--pr-radius-lg)] border border-pr-border/50">
                           <ToggleField 
                              id="autoReveal" 
                              label="Prophecy reveals when all have voted" 
                              description="Auto Reveal"
                              icon={<Eye className="w-4 h-4 text-pr-primary" />}
                              register={form.register("autoReveal")} 
                           />
                           <ToggleField 
                              id="allowAbstain" 
                              label="Permit uncertainty (?)" 
                              description="Allow Abstain"
                              icon={<UserX className="w-4 h-4 text-pr-primary" />}
                              register={form.register("allowAbstain")} 
                           />
                           <ToggleField 
                              id="hideVoteCounts" 
                              label="Hide vote counts" 
                              description="Visibility"
                              icon={<EyeOff className="w-4 h-4 text-pr-primary" />}
                              register={form.register("hideVoteCounts")} 
                           />
                      </div>

                      {/* Toggles */}
                      <div className="space-y-4 p-6 bg-pr-surface/40 rounded-xl border border-pr-border/30 shadow-inner">
                           <ToggleField 
                               id="autoReveal" 
                               description="Instant Revelation"
                               label="Prophecy reveals when all have inscribed their vote" 
                               icon={<Eye className="w-4 h-4 text-pr-primary" />}
                               register={form.register("autoReveal")} 
                            />
                           <ToggleField 
                               id="allowAbstain" 
                               description="Permit Uncertainty"
                               label="Allow members to cast the '?' rune" 
                               icon={<UserX className="w-4 h-4 text-pr-primary" />}
                               register={form.register("allowAbstain")} 
                            />
                           <ToggleField 
                               id="hideVoteCounts" 
                               description="Veiled Tally"
                               label="Hide vote counts during estimation" 
                               icon={<EyeOff className="w-4 h-4 text-pr-primary" />}
                               register={form.register("hideVoteCounts")} 
                            />
                      </div>

                      <div className="pt-6">
                           <Button
                                type="submit"
                                fullWidth
                                disabled={isSubmitting}
                                variant="primary"
                                className="py-8 shadow-glow-primary group relative overflow-hidden"
                           >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-3 opacity-80" />
                                        <span className="tracking-[0.2em] font-black uppercase">Casting Spell...</span>
                                    </>
                                ) : (
                                    <>
                                        <Dice5 className="w-5 h-5 mr-3 transition-transform group-hover:rotate-180 duration-700 opacity-80" />
                                        <span className="tracking-[0.2em] font-black uppercase">Summon Realm</span>
                                    </>
                                )}
                           </Button>
                      </div>
                  </form>
              </Panel>
          </div>

          {/* Preview Panel (Desktop) */}
          <div className="hidden lg:block lg:col-span-5 sticky top-8 space-y-6">
              <Panel variant="subtle" className="mx-4 lg:mx-0">
                  <SectionHeader title="Visual Preview" className="mb-4" />
                  <ThemePreview theme={selectedTheme} />
              </Panel>
              
              <Panel variant="outline" noPadding className="p-4 mx-4 lg:mx-0 text-center">
                  <h3 className="text-sm font-bold text-pr-text mb-1">Theme: {selectedTheme.name}</h3>
                  <p className="text-xs text-pr-text-muted">
                      {selectedTheme.description}
                  </p>
              </Panel>
          </div>

       </motion.div>
    </RealmShell>
  );
}

// Helper for toggles
const ToggleField = ({ id, label, description, icon, register }: any) => (
  <div className="flex items-start gap-4 group cursor-pointer">
        <div className="flex items-center h-6">
            <input
                id={id}
                type="checkbox"
                {...register}
                className="w-4 h-4 rounded border-pr-border/60 bg-pr-bg text-pr-primary focus:ring-pr-primary/50 transition-colors shadow-inner"
            />
        </div>
        <div className="flex-1">
            <label htmlFor={id} className="text-[10px] font-black tracking-[0.2em] text-pr-text/90 flex items-center gap-2 uppercase group-hover:text-pr-primary transition-colors">
                {icon} {description}
            </label>
            <p className="text-[10px] text-pr-text-muted mt-1 font-bold italic opacity-60 leading-relaxed">{label}</p>
        </div>
   </div>
);
