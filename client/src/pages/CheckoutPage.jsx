import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCart, usePlaceOrder } from '../api/hooks.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { AlertIcon } from '../components/Icons.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { ErrorState, Spinner } from '../components/StateViews.jsx';
import { formatPrice, variantLabel } from '../lib/format.js';
import { OrderTotals } from './CartPage.jsx';

const FIELDS = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name' },
  { name: 'phone', label: 'Mobile number', autoComplete: 'tel-national', inputMode: 'numeric', maxLength: 10 },
  { name: 'line1', label: 'Address (house no, street, area)', autoComplete: 'street-address', wide: true },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'pincode', label: 'Pincode', autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 6 },
];

// Quick client-side checks for instant feedback. The server validates the
// same rules again and is the one that counts.
function validate(v) {
  const e = {};
  if (v.fullName.trim().length < 2) e.fullName = 'Enter your full name';
  if (!/^[6-9]\d{9}$/.test(v.phone.trim())) e.phone = 'Enter a 10-digit mobile number';
  if (v.line1.trim().length < 5) e.line1 = 'Enter your address';
  if (v.city.trim().length < 2) e.city = 'Enter your city';
  if (!/^\d{6}$/.test(v.pincode.trim())) e.pincode = 'Enter a 6-digit pincode';
  return e;
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { data: cart, isPending, isError, error, refetch } = useCart();
  const placeOrder = usePlaceOrder();
  const navigate = useNavigate();
  const [values, setValues] = useState({ fullName: user?.name ?? '', phone: '', line1: '', city: '', pincode: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = 'Checkout | MegaMart';
  }, []);

  if (isPending) {
    return (
      <div className="page-loading">
        <Spinner label="Loading" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="container">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }
  if (cart.items.length === 0 && !placeOrder.isSuccess) return <Navigate to="/cart" replace />;

  const { summary } = cart;
  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((x) => ({ ...x, [name]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    placeOrder.mutate(
      { shippingAddress: values, expectedTotal: summary.total },
      {
        onSuccess: (order) => navigate(`/orders/${order.id}`, { replace: true }),
        onError: (err) => {
          if (err.code === 'VALIDATION_ERROR') {
            const fieldErrors = {};
            for (const d of err.details ?? []) fieldErrors[d.path.split('.').pop()] = d.message;
            setErrors(fieldErrors);
          }
        },
      },
    );
  };

  const stockProblem = placeOrder.error && placeOrder.error.status === 409;

  return (
    <div className="container checkout">
      <SectionHeading as="h1" lead="Secure" highlight="Checkout" />

      {(stockProblem || !summary.canCheckout) && (
        <div className="notice notice--warn" role="alert">
          <AlertIcon />
          <span>
            {placeOrder.error?.message ?? 'Some items in your cart are no longer available.'} Nothing has been charged.{' '}
            <Link to="/cart">Review your cart</Link>
          </span>
        </div>
      )}
      {placeOrder.isError && !stockProblem && placeOrder.error.code !== 'VALIDATION_ERROR' && (
        <div className="notice notice--error" role="alert">
          <AlertIcon /> <span>{placeOrder.error.message}</span>
        </div>
      )}

      <div className="checkout__layout">
        <form className="card checkout__form" onSubmit={submit} noValidate>
          <h2>Delivery address</h2>
          <div className="form-grid">
            {FIELDS.map((f) => (
              <label key={f.name} className={`field${f.wide ? ' field--wide' : ''}`}>
                <span>{f.label}</span>
                <input
                  name={f.name}
                  value={values[f.name]}
                  onChange={set(f.name)}
                  autoComplete={f.autoComplete}
                  inputMode={f.inputMode}
                  maxLength={f.maxLength}
                  aria-invalid={Boolean(errors[f.name])}
                  aria-describedby={errors[f.name] ? `${f.name}-err` : undefined}
                />
                {errors[f.name] && <em id={`${f.name}-err`} className="field-error">{errors[f.name]}</em>}
              </label>
            ))}
          </div>
          <p className="checkout__payment">Payment: <strong>Cash on delivery</strong> (online payment is out of scope for this demo)</p>
          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={placeOrder.isPending || !summary.canCheckout}>
            {placeOrder.isPending ? <><Spinner label="Placing order" /> Placing order…</> : `Place order · ${formatPrice(summary.total)}`}
          </button>
        </form>

        <aside className="summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <ul className="mini-lines">
            {cart.items.map((l) => (
              <li key={l.id} className={l.status !== 'ok' ? 'is-issue' : ''}>
                {l.image && <img src={l.image} alt="" />}
                <div>
                  <p>{l.name}</p>
                  <small>
                    {[variantLabel(l), `Qty ${l.quantity}`].filter(Boolean).join(' · ')}
                    {l.message && <em> — {l.message}</em>}
                  </small>
                </div>
                <strong>{formatPrice(l.lineTotal)}</strong>
              </li>
            ))}
          </ul>
          <OrderTotals summary={summary} />
        </aside>
      </div>
    </div>
  );
}
