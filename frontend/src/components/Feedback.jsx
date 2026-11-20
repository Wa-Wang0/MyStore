/** Small shared UI for loading, error and empty states. */
export function Loading({ label = "Loading..." }) {
  return (
    <p className="state" role="status">
      {label}
    </p>
  );
}

export function ErrorBox({ error, onRetry, children }) {
  return (
    <div className="state state-error" role="alert">
      <p>{error?.message || "Something went wrong."}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
      {children}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="state">
      <h2 className="state-title">{title}</h2>
      {children}
    </div>
  );
}
