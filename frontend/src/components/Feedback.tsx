interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="feedback feedback--error" role="alert">
      <div>
        <strong>Something went wrong</strong>
        <p>{message}</p>
      </div>
      {onRetry === undefined ? null : (
        <button className="button button--quiet" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function LoadingMessage({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <span className="loading__dot" aria-hidden="true" />
      {label}
    </div>
  );
}

