export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <div className="spinner__circle" />
      <p>{label ?? "Generating your shootout story…"}</p>
    </div>
  );
}
