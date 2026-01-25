import { Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecentRealmItem } from '../../../lib/storage';
import styles from './RecentRealmsList.module.css';

interface RecentRealmsListProps {
  realms: RecentRealmItem[];
  onSelect: (realm: RecentRealmItem) => void;
  onForget: (realmCode: string) => void;
  onClearAll: () => void;
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  return 'just now';
}

export function RecentRealmsList({ realms, onSelect, onForget, onClearAll }: RecentRealmsListProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={styles.wrapper}
    >
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Recent Realms</h2>
          <p className={styles.subtitle}>Previously visited</p>
        </div>
        {realms.length > 0 && (
          <button onClick={onClearAll} className={styles.clear}>
            <Trash2 size={12} />
            Clear all
          </button>
        )}
      </div>

      {realms.length === 0 ? (
        <div className={styles.empty}>No recent realms yet</div>
      ) : (
        <div className={styles.list}>
          <AnimatePresence mode="popLayout">
            {realms.map((realm) => (
              <motion.div
                key={realm.realmCode}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className={styles.card}
                onClick={() => onSelect(realm)}
              >
                <div className={styles.cardBody}>
                  <div className={styles.cardInfo}>
                    <div className={styles.cardTitleRow}>
                      <span className={styles.realmName}>{realm.realmName || realm.realmCode}</span>
                      <span className={styles.realmCode}>{realm.realmCode}</span>
                    </div>
                    <span className={styles.meta}>Last visited {timeAgo(realm.lastVisitedAt)}</span>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onForget(realm.realmCode);
                      }}
                      className={styles.forget}
                      aria-label={`Forget ${realm.realmCode}`}
                    >
                      <X size={14} />
                    </button>
                    <button
                      type="button"
                      className={styles.rejoin}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(realm);
                      }}
                    >
                      Rejoin
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.section>
  );
}
