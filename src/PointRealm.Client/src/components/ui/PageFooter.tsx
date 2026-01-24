import React from "react";
import { Beer } from "lucide-react";
import styles from "./PageFooter.module.css";

interface PageFooterProps {
  tipUrl: string;
  tipIsExternal?: boolean;
  microcopy?: string;
  className?: string;
}

export const PageFooter: React.FC<PageFooterProps> = ({
  tipUrl,
  tipIsExternal,
  microcopy = "Free, open source, self-host friendly.",
  className,
}) => {
  return (
    <footer className={[styles.footer, className].filter(Boolean).join(" ")}>
      <p className={styles.microcopy}>{microcopy}</p>
      <a
        className={styles.tip}
        href={tipUrl}
        target={tipIsExternal ? "_blank" : undefined}
        rel={tipIsExternal ? "noopener noreferrer" : undefined}
      >
        <Beer className={styles.tipIcon} aria-hidden="true" />
        Toss a coin to your dev
      </a>
    </footer>
  );
};
