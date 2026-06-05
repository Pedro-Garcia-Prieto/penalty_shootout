interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="error-banner" role="alert">
      <p>⚠️ {message}</p>
      {onRetry && <button onClick={onRetry}>Try again</button>}
    </div>
  );
}
