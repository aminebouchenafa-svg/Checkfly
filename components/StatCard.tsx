export function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className={`text-2xl font-bold ${accent ? 'text-red-700' : 'text-gray-900'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
