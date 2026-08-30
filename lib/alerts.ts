import type { Pilot } from './db';

export type UrgencyLevel = 'expired' | 'urgent' | 'warning' | 'notice' | 'ok' | 'unknown';

export interface CheckStatus {
  key: 'license' | 'simulator' | 'lineCheck' | 'english';
  label: string;
  date: string | null;
  daysRemaining: number | null;
  urgency: UrgencyLevel;
}

export interface PilotWithStatus extends Pilot {
  checks: CheckStatus[];
  worstUrgency: UrgencyLevel;
}

const URGENCY_ORDER: UrgencyLevel[] = ['expired', 'urgent', 'warning', 'notice', 'ok', 'unknown'];

// Durées de validité réglementaires : simulateur (OPC) 6 mois, contrôle en
// ligne 1 an, à partir de la date du dernier contrôle effectué.
export const SIMULATOR_VALIDITY_MONTHS = 6;
export const LINE_CHECK_VALIDITY_MONTHS = 12;

export function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / msPerDay);
}

export function urgencyFor(daysRemaining: number | null): UrgencyLevel {
  if (daysRemaining === null) return 'unknown';
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 30) return 'urgent'; // 1 mois
  if (daysRemaining <= 60) return 'warning'; // 2 mois
  if (daysRemaining <= 90) return 'notice'; // 3 mois
  return 'ok';
}

export const URGENCY_META: Record<UrgencyLevel, { label: string; color: string; bg: string; border: string }> = {
  expired: { label: 'Expiré', color: 'text-red-800', bg: 'bg-red-100', border: 'border-red-300' },
  urgent: { label: '≤ 1 mois', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  warning: { label: '≤ 2 mois', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  notice: { label: '≤ 3 mois', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  ok: { label: 'OK', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  unknown: { label: 'Non renseigné', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' }
};

export function computeChecks(pilot: Pilot, today: Date = new Date()): CheckStatus[] {
  const defs: { key: CheckStatus['key']; label: string; date: string | null }[] = [
    { key: 'license', label: 'Licence', date: pilot.licenseExpiry },
    { key: 'simulator', label: 'Contrôle simulateur (OPC)', date: pilot.simulatorExpiry },
    { key: 'lineCheck', label: 'Contrôle en ligne', date: pilot.lineCheckExpiry },
    { key: 'english', label: 'Niveau anglais (OACI)', date: pilot.englishExpiry }
  ];

  return defs.map((d) => {
    const daysRemaining = d.date ? daysBetween(today, new Date(d.date)) : null;
    return {
      key: d.key,
      label: d.label,
      date: d.date,
      daysRemaining,
      urgency: urgencyFor(daysRemaining)
    };
  });
}

export function withStatus(pilots: Pilot[], today: Date = new Date()): PilotWithStatus[] {
  return pilots.map((pilot) => {
    const checks = computeChecks(pilot, today);
    const worstUrgency = checks.reduce<UrgencyLevel>((worst, c) => {
      if (c.urgency === 'unknown') return worst;
      return URGENCY_ORDER.indexOf(c.urgency) < URGENCY_ORDER.indexOf(worst) ? c.urgency : worst;
    }, 'ok');
    return { ...pilot, checks, worstUrgency };
  });
}

export function rankLabel(rank: string): string {
  return rank === 'CDB' ? 'Commandant de bord (CDB)' : 'Officier Pilote de Ligne (OPL)';
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
