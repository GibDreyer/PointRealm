import React from "react";
import { cn } from "@/lib/utils";
import { useThemeMode } from "@/theme/ThemeModeProvider";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  subtitle?: string | undefined;
  align?: "center" | "left" | undefined;
  size?: "hero" | "panel" | undefined;
  showOrnaments?: boolean | undefined;
  className?: string | undefined;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  align = "center",
  size = "hero",
  showOrnaments = false,
  className,
}) => {
  const { mode } = useThemeMode();
  const ornamentsEnabled = showOrnaments && mode.showOrnaments;

  return (
    <header className={[styles.header, styles[align], styles[size], className].filter(Boolean).join(" ")}>
      <h1 className={styles.title}>
        {ornamentsEnabled && <span className={styles.ornament} aria-hidden="true" />}
        <span className={cn(styles.titleText, mode.styles.headerTitle)}>{title}</span>
        {ornamentsEnabled && <span className={styles.ornament} aria-hidden="true" />}
      </h1>
      {subtitle && <p className={cn(styles.subtitle, mode.styles.headerSubtitle)}>{subtitle}</p>}
      {mode.showOrnaments && (
        <div className={cn(styles.runeDivider, mode.styles.headerDivider)} aria-hidden="true">
          <span className={styles.runeGem} />
        </div>
      )}
    </header>
  );
};
