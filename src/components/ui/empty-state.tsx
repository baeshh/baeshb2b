export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <p className="text-sm font-medium text-slate-800">{title}</p>
      {description ? (
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}
