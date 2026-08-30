import Link from 'next/link';
import { getAllPilots } from '@/lib/db';
import { withStatus, formatDate, rankLabel, type CheckStatus, type PilotWithStatus } from '@/lib/alerts';
import { UrgencyBadge, RankBadge } from '@/components/Badge';
import { StatCard } from '@/components/StatCard';

interface AlertRow {
  pilot: PilotWithStatus;
  check: CheckStatus;
}

const SECTIONS: { key: AlertRow['check']['urgency']; title: string; hint: string }[] = [
  { key: 'expired', title: 'Expirés', hint: 'Action immédiate requise' },
  { key: 'urgent', title: "À moins d'1 mois", hint: 'Échéance ≤ 30 jours' },
  { key: 'warning', title: 'À moins de 2 mois', hint: 'Échéance ≤ 60 jours' },
  { key: 'notice', title: 'À moins de 3 mois', hint: 'Échéance ≤ 90 jours' }
];

export default function DashboardPage() {
  const pilots = withStatus(getAllPilots());

  const alertRows: AlertRow[] = [];
  for (const pilot of pilots) {
    for (const check of pilot.checks) {
      if (check.urgency !== 'unknown' && check.urgency !== 'ok') {
        alertRows.push({ pilot, check });
      }
    }
  }
  alertRows.sort((a, b) => (a.check.daysRemaining ?? 0) - (b.check.daysRemaining ?? 0));

  const totalPilots = pilots.length;
  const cdbCount = pilots.filter((p) => p.rank === 'CDB').length;
  const oplCount = pilots.filter((p) => p.rank === 'OPL').length;

  if (totalPilots === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <h1 className="text-xl font-semibold text-gray-800">Bienvenue sur CheckFly</h1>
        <p className="mt-2 text-gray-500">
          Aucun pilote enregistré pour le moment. Ajoutez vos commandants de bord et officiers pilotes de ligne
          737NG pour commencer le suivi des licences, contrôles simulateur, contrôles en ligne et niveau d'anglais.
        </p>
        <Link
          href="/pilots/new"
          className="mt-4 inline-block rounded-md bg-brand-600 px-4 py-2 text-white font-medium hover:bg-brand-700"
        >
          + Ajouter le premier pilote
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">
          Rappels automatiques à 3 mois, 2 mois et 1 mois avant l'expiration du simulateur, du contrôle en ligne, du
          niveau d'anglais et de la licence.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Pilotes suivis" value={totalPilots} />
        <StatCard label="Commandants de bord" value={cdbCount} />
        <StatCard label="Officiers pilotes de ligne" value={oplCount} />
        <StatCard label="Alertes actives" value={alertRows.length} accent={alertRows.length > 0} />
      </div>

      {alertRows.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
          Aucune échéance dans les 3 prochains mois. Tout est à jour ✅
        </div>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map((section) => {
            const rows = alertRows.filter((r) => r.check.urgency === section.key);
            if (rows.length === 0) return null;
            return (
              <div key={section.key} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-baseline justify-between">
                  <h2 className="font-semibold text-gray-800">{section.title}</h2>
                  <span className="text-xs text-gray-400">{section.hint}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase tracking-wide">
                      <th className="px-4 py-2 font-medium">Pilote</th>
                      <th className="px-4 py-2 font-medium">Grade</th>
                      <th className="px-4 py-2 font-medium">Type de contrôle</th>
                      <th className="px-4 py-2 font-medium">Échéance</th>
                      <th className="px-4 py-2 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={`${row.pilot.id}-${row.check.key}`} className="border-t border-gray-100">
                        <td className="px-4 py-2.5">
                          <Link href={`/pilots/${row.pilot.id}`} className="font-medium text-brand-700 hover:underline">
                            {row.pilot.firstName} {row.pilot.lastName}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <RankBadge rank={row.pilot.rank} />
                        </td>
                        <td className="px-4 py-2.5 text-gray-700">{row.check.label}</td>
                        <td className="px-4 py-2.5 text-gray-700">{formatDate(row.check.date)}</td>
                        <td className="px-4 py-2.5">
                          <UrgencyBadge urgency={row.check.urgency} daysRemaining={row.check.daysRemaining} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Grades : {rankLabel('CDB')} · {rankLabel('OPL')}
      </p>
    </div>
  );
}

