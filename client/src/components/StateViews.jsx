import { AlertIcon } from './Icons.jsx';

export function Spinner({ label = 'Loading' }) {
  return <span className="spinner" role="status" aria-label={label} />;
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="state-view" role="alert">
      <AlertIcon className="state-view__icon state-view__icon--error" />
      <h2>{title}</h2>
      <p>{error?.message ?? 'Please try again.'}</p>
      {onRetry && (
        <button type="button" className="btn btn--outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, children, action }) {
  return (
    <div className="state-view">
      {icon}
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="product-card product-card--skeleton">
          <div className="product-card__media skeleton" />
          <div className="product-card__body">
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--short" />
          </div>
        </div>
      ))}
    </div>
  );
}
