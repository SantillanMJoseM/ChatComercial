export function KpiCard({ title, value, color, icon }: { title: string; value: any; color?: string; icon?: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400 uppercase tracking-wide">{title}</div>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className={`text-3xl font-bold mt-2 ${color || 'text-slate-100'}`}>{value ?? '—'}</div>
    </div>
  );
}
