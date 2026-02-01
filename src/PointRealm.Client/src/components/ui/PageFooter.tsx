import React from "react";
import { Beer } from "lucide-react";
import styles from "./PageFooter.module.css";

interface PageFooterProps {
  tipUrl: string;
  tipIsExternal?: boolean;
  microcopy?: string;
  className?: string;
  backLinkLabel?: string;
  backLinkHref?: string;
  onBackClick?: () => void;
}

export const PageFooter: React.FC<PageFooterProps> = ({
  tipUrl,
  tipIsExternal,
  microcopy = "Free, open source, self-host friendly.",
  className,
  backLinkLabel,
  backLinkHref,
  onBackClick,
}) => {
  return (
    <footer className={[styles.footer, className].filter(Boolean).join(" ")}>
      {backLinkLabel && (
        backLinkHref ? (
          <a className={`${styles.backLink} pr-interactive`} href={backLinkHref}>
            {backLinkLabel}
          </a>
        ) : (
          <button type="button" className={`${styles.backLink} pr-interactive`} onClick={onBackClick}>
            {backLinkLabel}
          </button>
        )
      )}
      <p className={styles.microcopy}>{microcopy}</p>
      <a
        className={`${styles.tip} pr-interactive`}
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
