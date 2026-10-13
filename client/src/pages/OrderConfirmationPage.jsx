import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrder } from '../api/hooks.js';
import { CheckIcon } from '../components/Icons.jsx';
import { ErrorState, Spinner } from '../components/StateViews.jsx';
import { formatPrice, variantLabel } from '../lib/format.js';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const { data: order, isPending, isError, error, refetch } = useOrder(id);

  useEffect(() => {
    document.title = 'Order placed | MegaMart';
  }, []);

  if (isPending) {
    return (
      <div className="page-loading">
        <Spinner label="Loading order" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="container">
        <ErrorState title={error.status === 404 ? 'Order not found' : 'Couldn’t load your order'} error={error} onRetry={error.status === 404 ? undefined : refetch} />
      </div>
    );
  }

  const a = order.shippingAddress;
  return (
    <div className="container confirmation">
      <div className="confirmation__hero">
        <span className="confirmation__check"><CheckIcon /></span>
        <h1>Thank you, your order is placed!</h1>
        <p>
          Order <strong>#{order.id.slice(-8).toUpperCase()}</strong> ·{' '}
          {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </div>

      <div className="confirmation__grid">
        <section className="card">
          <h2>Items</h2>
          <ul className="mini-lines">
            {order.items.map((i) => (
              <li key={i.sku}>
                {i.image && <img src={i.image} alt="" />}
                <div>
                  <p>{i.name}</p>
                  <small>{[variantLabel(i), `Qty ${i.quantity}`, `${formatPrice(i.price)} each`].filter(Boolean).join(' · ')}</small>
                </div>
                <strong>{formatPrice(i.lineTotal)}</strong>
              </li>
            ))}
          </ul>
          <dl className="totals">
            <div><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
            {order.savings > 0 && <div className="totals__save"><dt>You saved</dt><dd>{formatPrice(order.savings)}</dd></div>}
            <div><dt>Delivery</dt><dd>{order.shippingFee ? formatPrice(order.shippingFee) : <span className="totals__free">Free</span>}</dd></div>
            <div className="totals__grand"><dt>Total paid on delivery</dt><dd>{formatPrice(order.total)}</dd></div>
          </dl>
        </section>
        <section className="card">
          <h2>Delivering to</h2>
          <address>
            <strong>{a.fullName}</strong><br />
            {a.line1}<br />
            {a.city} – {a.pincode}<br />
            {a.phone}
          </address>
          <Link to="/products" className="btn btn--primary btn--block">Continue shopping</Link>
        </section>
      </div>
    </div>
  );
}
