import React from "react";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  size?: "hero" | "panel";
  showOrnaments?: boolean;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  align = "center",
  size = "hero",
  showOrnaments = false,
  className,
}) => {
  return (
    <header className={[styles.header, styles[align], styles[size], className].filter(Boolean).join(" ")}>
      <h1 className={styles.title}>
        {showOrnaments && <span className={styles.ornament} aria-hidden="true" />}
        <span className={styles.titleText}>{title}</span>
        {showOrnaments && <span className={styles.ornament} aria-hidden="true" />}
      </h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      <div className={styles.runeDivider} aria-hidden="true">
        <span className={styles.runeGem} />
      </div>
    </header>
  );
};
