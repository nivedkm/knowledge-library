interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="grid gap-[0.4rem] p-[1.15rem] rounded-2xl border border-feedback-border text-feedback-ink bg-feedback-bg" role="alert">
      <div>
        <strong>Something went wrong</strong>
        <p className="m-0 text-[0.95rem] leading-relaxed">{message}</p>
      </div>
      {onRetry === undefined ? null : (
        <button className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-5 py-2.5 text-[0.82rem] font-extrabold cursor-pointer border border-line text-ink bg-transparent focus-ring disabled:cursor-wait disabled:opacity-60" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function LoadingMessage({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[8rem] items-center justify-center gap-1.5" role="status">
      <span className="w-2 h-2 rounded-full bg-muted animate-pulse" aria-hidden="true" />
      <span className="w-2 h-2 rounded-full bg-muted animate-pulse delay-75" aria-hidden="true" />
      <span className="w-2 h-2 rounded-full bg-muted animate-pulse delay-150" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

