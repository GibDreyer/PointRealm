import styles from './SummoningCircle.module.css';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

export function SummoningCircle({ className }: Props) {
  return <div className={cn(styles.summoningCircle, className)} aria-hidden="true" />;
}
