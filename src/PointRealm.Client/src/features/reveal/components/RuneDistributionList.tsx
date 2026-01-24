import React from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Panel } from '@/components/ui/Panel';
import { RuneChip } from '@/components/ui/RuneChip';
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
  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <div className={styles.section}>
      <SectionHeader title="Rune Distribution" subtitle="Summary" className="mb-0" />
      <Panel variant="subtle" className="p-4">
        {!revealed || distribution.length === 0 ? (
          <div className={styles.empty}>No distribution available</div>
        ) : (
          <div className="space-y-3">
            {distribution.map((item) => (
              <div key={item.value} className={styles.row}>
                <RuneChip type="button" active={false} disabled>
                  {item.value}
                </RuneChip>
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
      </Panel>
    </div>
  );
};
