import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../api/hooks.js';
import { AlertIcon, BagIcon, TrashIcon } from '../components/Icons.jsx';
import { QuantityStepper } from '../components/QuantityStepper.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { EmptyState, ErrorState, Spinner } from '../components/StateViews.jsx';
import { formatPrice, variantLabel } from '../lib/format.js';

export default function CartPage() {
  const { data: cart, isPending, isError, error, refetch, isFetching } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Your cart | MegaMart';
  }, []);

  if (isPending) {
    return (
      <div className="page-loading">
        <Spinner label="Loading cart" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="container">
        <ErrorState title="Couldn’t load your cart" error={error} onRetry={refetch} />
      </div>
    );
  }
  if (cart.items.length === 0) {
    return (
      <div className="container">
        <EmptyState
          icon={<BagIcon className="state-view__icon" />}
          title="Your cart is empty"
          action={<Link to="/products" className="btn btn--primary">Start shopping</Link>}
        >
          Items you add will show up here.
        </EmptyState>
      </div>
    );
  }

  const { summary } = cart;
  return (
    <div className="container cart">
      <SectionHeading as="h1" lead="Your" highlight="Cart" />

      {summary.issues > 0 && (
        <div className="notice notice--warn" role="alert">
          <AlertIcon />
          <span>
            {summary.issues === 1 ? '1 item needs' : `${summary.issues} items need`} your attention before you can check
            out. Stock changed since you added {summary.issues === 1 ? 'it' : 'them'}.
          </span>
        </div>
      )}

      <div className="cart__layout">
        <ul className="cart__lines" aria-busy={isFetching}>
          {cart.items.map((line) => (
            <CartLine key={line.id} line={line} />
          ))}
        </ul>

        <aside className="summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <OrderTotals summary={summary} />
          <button
            type="button"
            className="btn btn--primary btn--lg btn--block"
            disabled={!summary.canCheckout}
            onClick={() => navigate('/checkout')}
          >
            Checkout
          </button>
          {!summary.canCheckout && <p className="summary__hint">Fix the highlighted items to continue.</p>}
          <Link to="/products" className="summary__continue">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}

export function OrderTotals({ summary }) {
  const toFree = (summary.freeShippingThreshold ?? 0) - summary.subtotal;
  return (
    <dl className="totals">
      <div>
        <dt>Price ({summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'})</dt>
        <dd>{formatPrice(summary.mrpTotal)}</dd>
      </div>
      {summary.savings > 0 && (
        <div className="totals__save">
          <dt>Discount</dt>
          <dd>− {formatPrice(summary.savings)}</dd>
        </div>
      )}
      <div>
        <dt>Delivery</dt>
        <dd>{summary.shippingFee === 0 ? <span className="totals__free">Free</span> : formatPrice(summary.shippingFee)}</dd>
      </div>
      {summary.shippingFee > 0 && toFree > 0 && (
        <p className="totals__hint">Add {formatPrice(toFree)} more for free delivery</p>
      )}
      <div className="totals__grand">
        <dt>Total</dt>
        <dd>{formatPrice(summary.total)}</dd>
      </div>
    </dl>
  );
}

function CartLine({ line }) {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const busy = update.isPending || remove.isPending;
  const blocked = line.status === 'out_of_stock' || line.status === 'unavailable';
  const error = update.error ?? remove.error;

  return (
    <li className={`cart-line${line.status !== 'ok' ? ' cart-line--issue' : ''}${busy ? ' is-busy' : ''}`}>
      <Link to={line.slug ? `/products/${line.slug}?sku=${line.sku}` : '#'} className="cart-line__img">
        {line.image ? <img src={line.image} alt="" loading="lazy" /> : null}
      </Link>
      <div className="cart-line__info">
        {line.slug ? (
          <Link to={`/products/${line.slug}?sku=${line.sku}`} className="cart-line__name">{line.name}</Link>
        ) : (
          <span className="cart-line__name">{line.name}</span>
        )}
        {variantLabel(line) && <p className="cart-line__variant">{variantLabel(line)}</p>}
        <p className="price-row">
          <strong>{formatPrice(line.price)}</strong>
          {line.mrp > line.price && <s>{formatPrice(line.mrp)}</s>}
        </p>
        {line.message && (
          <p className="cart-line__status" role="status">
            <AlertIcon /> {line.message}
          </p>
        )}
        {error && <p className="field-error" role="alert">{error.message}</p>}
      </div>
      <div className="cart-line__controls">
        {!blocked && (
          <QuantityStepper
            value={line.quantity}
            max={Math.max(line.maxQuantity, 1)}
            disabled={busy}
            onChange={(quantity) => update.mutate({ id: line.id, quantity })}
            label={`Quantity of ${line.name}`}
          />
        )}
        {line.status === 'insufficient_stock' && (
          <button type="button" className="link-btn" disabled={busy} onClick={() => update.mutate({ id: line.id, quantity: line.available })}>
            Set to {line.available}
          </button>
        )}
        <button
          type="button"
          className={blocked ? 'btn btn--outline btn--sm' : 'icon-btn cart-line__remove'}
          onClick={() => remove.mutate(line.id)}
          disabled={busy}
          aria-label={`Remove ${line.name}`}
        >
          <TrashIcon /> {blocked && 'Remove'}
        </button>
      </div>
      <p className="cart-line__total">{blocked ? '—' : formatPrice(line.lineTotal)}</p>
    </li>
  );
}
