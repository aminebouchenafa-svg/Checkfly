import Link from 'next/link';
import { getAllPilots } from '@/lib/db';
import { withStatus, formatDate, URGENCY_META } from '@/lib/alerts';
import { RankBadge, UrgencyBadge } from '@/components/Badge';
import { StatCard } from '@/components/StatCard';

export default async function PilotsPage({
  searchParams
}: {
  searchParams: Promise<{ rank?: string; q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const rankFilter = resolvedSearchParams.rank;
  const query = (resolvedSearchParams.q ?? '').trim().toLowerCase();

  const allPilots = withStatus(getAllPilots());
  const totalCount = allPilots.length;
  const cdbCount = allPilots.filter((p) => p.rank === 'CDB').length;
  const oplCount = allPilots.filter((p) => p.rank === 'OPL').length;

  let pilots = allPilots;
  if (rankFilter === 'CDB' || rankFilter === 'OPL') {
    pilots = pilots.filter((p) => p.rank === rankFilter);
  }
  if (query) {
    pilots = pilots.filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(query));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Pilotes 737NG</h1>
        <Link href="/pilots/new" className="rounded-md bg-brand-600 px-4 py-2 text-white text-sm font-medium hover:bg-brand-700">
          + Ajouter un pilote
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Effectif total" value={totalCount} />
        <StatCard label="Commandants de bord (CDB)" value={cdbCount} />
        <StatCard label="Officiers pilotes de ligne (OPL)" value={oplCount} />
      </div>

      <form className="flex flex-wrap gap-3 bg-white border border-gray-200 rounded-xl p-4" method="get">
        <input
          type="text"
          name="q"
          defaultValue={resolvedSearchParams.q}
          placeholder="Rechercher un pilote..."
          className="input sm:max-w-xs"
        />
        <select name="rank" defaultValue={rankFilter ?? ''} className="input sm:max-w-[220px]">
          <option value="">Tous les grades</option>
          <option value="CDB">Commandant de bord (CDB)</option>
          <option value="OPL">Officier Pilote de Ligne (OPL)</option>
        </select>
        <button type="submit" className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
          Filtrer
        </button>
      </form>

      {pilots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          Aucun pilote ne correspond à cette recherche.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-gray-400 text-xs uppercase tracking-wide bg-gray-50">
                <th className="px-4 py-3 font-medium">Pilote</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Licence</th>
                <th className="px-4 py-3 font-medium">Simulateur</th>
                <th className="px-4 py-3 font-medium">Contrôle en ligne</th>
                <th className="px-4 py-3 font-medium">Anglais</th>
              </tr>
            </thead>
            <tbody>
              {pilots.map((pilot) => (
                <tr key={pilot.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/pilots/${pilot.id}`} className="font-medium text-brand-700 hover:underline">
                      {pilot.firstName} {pilot.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <RankBadge rank={pilot.rank} />
                  </td>
                  {(['license', 'simulator', 'lineCheck', 'english'] as const).map((key) => {
                    const check = pilot.checks.find((c) => c.key === key)!;
                    return (
                      <td key={key} className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-600 text-xs">{formatDate(check.date)}</span>
                          <UrgencyBadge urgency={check.urgency} daysRemaining={check.daysRemaining} />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        {Object.entries(URGENCY_META)
          .filter(([key]) => key !== 'unknown')
          .map(([key, meta]) => (
            <span key={key} className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 ${meta.bg} ${meta.color} ${meta.border}`}>
              {meta.label}
            </span>
          ))}
      </div>
    </div>
  );
}
