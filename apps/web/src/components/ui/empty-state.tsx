export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
      <div className="text-slate-400 text-4xl mb-2">📭</div>
      <div className="font-semibold text-slate-700">{title}</div>
      {description && <div className="text-sm text-slate-500 mt-1">{description}</div>}
    </div>
  );
}
