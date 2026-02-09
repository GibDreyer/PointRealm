import React from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useThemeMode } from '@/theme/ThemeModeProvider';
import styles from './RuneDistributionList.module.css';

export interface DistributionItem {
  value: string;
  count: number;
}

interface RuneDistributionListProps {
  distribution: DistributionItem[];
  revealed: boolean;
}

export const RuneDistributionList: React.FC<RuneDistributionListProps> = ({
  distribution,
  revealed,
}) => {
  const { mode } = useThemeMode();
  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <div className={styles.section}>
      <SectionHeader title={`${mode.labels.rune} Distribution`} subtitle="Summary" className="mb-0" />
      <div className={styles.wrapper}>
        {!revealed || distribution.length === 0 ? (
          <div className={styles.empty}>No distribution available</div>
        ) : (
          <div className={styles.list}>
            {distribution.map((item) => (
              <div key={item.value} className={styles.row}>
                <div className={styles.runeLabel}>
                  {item.value}
                </div>
                <div className={styles.bar}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
                <div className={styles.count}>{item.count}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
