export function KpiCard({ title, value, color, icon }: { title: string; value: any; color?: string; icon?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 uppercase tracking-wide">{title}</div>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className={`text-3xl font-bold mt-2 ${color || 'text-slate-800'}`}>{value ?? '—'}</div>
    </div>
  );
}
