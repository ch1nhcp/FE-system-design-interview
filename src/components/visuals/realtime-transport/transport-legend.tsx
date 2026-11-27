import { useTranslations } from 'next-intl';

import { DIAGRAM_STYLES } from './realtime-transport-diagram';
import type { TransportMode } from './realtime-transport-model';

type Item = 'waiting' | 'held' | 'connection';

const ITEMS_BY_MODE: Record<TransportMode, readonly Item[]> = {
  shortPolling: ['waiting'],
  longPolling: ['waiting', 'held'],
  serverSentEvents: ['waiting', 'connection'],
  webSocket: ['waiting', 'connection'],
};

const LABEL_KEYS = {
  waiting: 'legendWaiting',
  held: 'legendHeld',
  connection: 'legendConnection',
} as const;

function Swatch({ item }: { item: Item }) {
  if (item === 'connection') {
    return (
      <svg aria-hidden viewBox="0 0 16 10" className="h-2.5 w-4 shrink-0">
        <rect width={16} height={10} rx={2} className={DIAGRAM_STYLES.connection.className} />
      </svg>
    );
  }
  const style = DIAGRAM_STYLES[item];
  return (
    <svg aria-hidden viewBox="0 0 16 10" className="h-2.5 w-4 shrink-0">
      <line
        x1={1}
        y1={5}
        x2={15}
        y2={5}
        strokeWidth={style.strokeWidth}
        strokeDasharray={'strokeDasharray' in style ? style.strokeDasharray : undefined}
        className={style.className}
      />
    </svg>
  );
}

/** Explains the diagram's bars and bands; only lists what the current mode shows. */
export function TransportLegend({ mode }: { mode: TransportMode }) {
  const t = useTranslations('Visuals.realtimeTransport');

  return (
    <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {ITEMS_BY_MODE[mode].map((item) => (
        <li key={item} className="flex items-center gap-1.5">
          <Swatch item={item} />
          {t(LABEL_KEYS[item])}
        </li>
      ))}
    </ul>
  );
}
