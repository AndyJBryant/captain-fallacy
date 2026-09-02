// src/components/Spinner.tsx
export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8" aria-label={label} role="status">
      <div className="w-10 h-10 border-4 border-brand-accent border-t-brand-primary rounded-full animate-spin" />
      <p className="text-brand-muted text-sm font-body">{label}</p>
    </div>
  )
}
