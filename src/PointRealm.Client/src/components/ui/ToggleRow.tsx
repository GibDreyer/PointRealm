import React from "react";
import styles from "./ToggleRow.module.css";

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  icon?: React.ReactNode;
  register: any;
  disabled?: boolean;
}

export const ToggleRow: React.FC<ToggleRowProps> = ({
  id,
  label,
  description,
  icon,
  register,
  disabled,
}) => {
  return (
    <label className={styles.toggleRow}>
      <div className={styles.toggleText}>
        <span className={styles.toggleLabel}>
          {icon}
          {label}
        </span>
        <span className={styles.toggleDescription}>{description}</span>
      </div>
      <div className={styles.toggleControl}>
        <input id={id} type="checkbox" {...register} disabled={disabled} />
        <span className={styles.toggleTrack} aria-hidden="true">
          <span className={styles.toggleThumb} />
        </span>
      </div>
    </label>
  );
};
