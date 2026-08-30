import { URGENCY_META, type UrgencyLevel } from '@/lib/alerts';

export function UrgencyBadge({ urgency, daysRemaining }: { urgency: UrgencyLevel; daysRemaining: number | null }) {
  const meta = URGENCY_META[urgency];
  let text = meta.label;
  if (urgency === 'expired' && daysRemaining !== null) {
    text = `Expiré depuis ${Math.abs(daysRemaining)} j`;
  } else if (daysRemaining !== null && urgency !== 'unknown' && urgency !== 'ok') {
    text = `${daysRemaining} j restants`;
  } else if (urgency === 'ok' && daysRemaining !== null) {
    text = `OK (${daysRemaining} j)`;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${meta.bg} ${meta.color} ${meta.border}`}
    >
      {text}
    </span>
  );
}

export function RankBadge({ rank }: { rank: string }) {
  const isCdb = rank === 'CDB';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isCdb ? 'bg-brand-100 text-brand-700' : 'bg-purple-100 text-purple-700'
      }`}
    >
      {isCdb ? 'CDB' : 'OPL'}
    </span>
  );
}
