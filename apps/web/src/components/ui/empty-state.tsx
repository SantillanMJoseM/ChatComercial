export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
      <div className="text-slate-400 text-4xl mb-2">📭</div>
      <div className="font-semibold text-slate-200">{title}</div>
      {description && <div className="text-sm text-slate-400 mt-1">{description}</div>}
    </div>
  );
}
