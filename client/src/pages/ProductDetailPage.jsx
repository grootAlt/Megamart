import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAddToCart, useCart, useProduct } from '../api/hooks.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { CartIcon, CheckIcon, ChevronRight } from '../components/Icons.jsx';
import { QuantityStepper } from '../components/QuantityStepper.jsx';
import { ErrorState, Spinner } from '../components/StateViews.jsx';
import { formatPrice } from '../lib/format.js';

const MAX_PER_LINE = 10;
const LOW_STOCK = 5;

const unique = (xs) => [...new Set(xs.filter(Boolean))];

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { data: product, isPending, isError, error, refetch } = useProduct(slug);

  useEffect(() => {
    if (product) document.title = `${product.name} | MegaMart`;
  }, [product]);

  if (isPending) {
    return (
      <div className="page-loading">
        <Spinner label="Loading product" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="container">
        {error.status === 404 ? (
          <ErrorState title="Product not found" error={{ message: 'It may have been removed. Have a look at the rest of the shop.' }} />
        ) : (
          <ErrorState title="Couldn’t load this product" error={error} onRetry={refetch} />
        )}
        <p className="center"><Link to="/products" className="btn btn--primary">Browse products</Link></p>
      </div>
    );
  }
  return <ProductDetail product={product} />;
}

function ProductDetail({ product }) {
  const { variants } = product;
  const [params, setParams] = useSearchParams();
  const sizes = unique(variants.map((v) => v.size));
  const colors = unique(variants.map((v) => v.color));

  // The chosen variant lives in the URL (?sku=), so a refresh or shared link
  // keeps the selection. Default: first variant with stock.
  const fallback = variants.find((v) => v.stock > 0) ?? variants[0];
  const selected = variants.find((v) => v.sku === params.get('sku')) ?? fallback;

  const choose = (changes) => {
    const want = { size: selected.size, color: selected.color, ...changes };
    // Exact match first; otherwise keep the attribute just clicked and pick
    // the best available partner for it (in stock first).
    const key = Object.keys(changes)[0];
    const candidates = variants.filter((v) => v[key] === changes[key]);
    const next =
      candidates.find((v) => v.size === want.size && v.color === want.color) ??
      candidates.find((v) => v.stock > 0) ??
      candidates[0];
    const p = new URLSearchParams(params);
    p.set('sku', next.sku);
    setParams(p, { replace: true });
  };

  const [image, setImage] = useState(0);
  const images = product.images.length ? product.images : [null];

  return (
    <div className="container pdp">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link> <ChevronRight />
        <Link to={`/products?category=${product.category}`} className="capitalize">{product.category}</Link> <ChevronRight />
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp__layout">
        <div className="gallery">
          <div className="gallery__main">
            {images[image] ? <img src={images[image]} alt={product.name} /> : <div className="product-card__noimg">No image</div>}
            {selected.discountPct > 0 && (
              <span className="product-card__badge">{selected.discountPct}%<br />OFF</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="gallery__thumbs">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={i === image ? 'is-active' : ''}
                  onClick={() => setImage(i)}
                  aria-label={`Show image ${i + 1}`}
                >
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp__info">
          {product.brand && <p className="pdp__brand">{product.brand}</p>}
          <h1 className="pdp__name">{product.name}</h1>

          <p className="price-row price-row--lg">
            <strong>{formatPrice(selected.price)}</strong>
            {selected.mrp > selected.price && (
              <>
                <s>{formatPrice(selected.mrp)}</s>
                <span className="price-row__off">{selected.discountPct}% off</span>
              </>
            )}
          </p>
          {selected.mrp > selected.price && (
            <p className="product-card__save">You save {formatPrice(selected.mrp - selected.price)}</p>
          )}

          {sizes.length > 0 && (
            <OptionGroup
              label="Size"
              value={selected.size}
              options={sizes.map((s) => {
                const match = variants.find((v) => v.size === s && v.color === selected.color);
                const anyStock = variants.some((v) => v.size === s && v.stock > 0);
                return { value: s, label: s, soldOut: match ? match.stock === 0 : !anyStock };
              })}
              onChange={(size) => choose({ size })}
            />
          )}

          {colors.length > 0 && (
            <OptionGroup
              label="Colour"
              value={selected.color}
              swatch
              options={colors.map((c) => {
                const match = variants.find((v) => v.color === c && v.size === selected.size);
                const anyStock = variants.some((v) => v.color === c && v.stock > 0);
                const hex = variants.find((v) => v.color === c)?.colorHex;
                return { value: c, label: c, hex, soldOut: match ? match.stock === 0 : !anyStock };
              })}
              onChange={(color) => choose({ color })}
            />
          )}

          <BuyBox key={selected.id} product={product} variant={selected} />

          <div className="pdp__desc">
            <h2>About this item</h2>
            <p>{product.description}</p>
            <p className="pdp__sku">SKU: {selected.sku}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionGroup({ label, value, options, onChange, swatch }) {
  return (
    <fieldset className="options">
      <legend>
        {label}: <strong>{value}</strong>
      </legend>
      <div className="options__list">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`option${o.value === value ? ' is-selected' : ''}${o.soldOut ? ' is-soldout' : ''}`}
            aria-pressed={o.value === value}
            title={o.soldOut ? `${o.label} – out of stock` : o.label}
            onClick={() => onChange(o.value)}
          >
            {swatch && o.hex && <span className="option__swatch" style={{ background: o.hex }} />}
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function BuyBox({ product, variant }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: cart } = useCart();
  const add = useAddToCart();
  const [qty, setQty] = useState(1);

  const inCart = cart?.items.find((l) => l.variantId === variant.id)?.quantity ?? 0;
  const canAdd = Math.max(0, Math.min(variant.stock, MAX_PER_LINE) - inCart);
  const outOfStock = variant.stock === 0;
  const quantity = Math.min(qty, Math.max(canAdd, 1));

  const onAdd = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location, reason: 'Sign in to add items to your cart' } });
      return;
    }
    add.mutate({ productId: product.id, variantId: variant.id, quantity }, { onSuccess: () => setQty(1) });
  };

  return (
    <div className="buybox">
      <p className={`stock${outOfStock ? ' stock--out' : variant.stock <= LOW_STOCK ? ' stock--low' : ''}`}>
        {outOfStock ? 'Out of stock' : variant.stock <= LOW_STOCK ? `Hurry, only ${variant.stock} left` : 'In stock'}
      </p>

      {!outOfStock && (
        <div className="buybox__row">
          <QuantityStepper value={quantity} max={Math.max(canAdd, 1)} onChange={setQty} disabled={canAdd === 0 || add.isPending} />
          <button type="button" className="btn btn--primary btn--lg" onClick={onAdd} disabled={canAdd === 0 || add.isPending}>
            {add.isPending ? <Spinner label="Adding" /> : <CartIcon />}
            {canAdd === 0 && inCart > 0 ? 'Max quantity in cart' : 'Add to cart'}
          </button>
        </div>
      )}

      {inCart > 0 && !add.isSuccess && (
        <p className="buybox__note">
          {inCart} already in your <Link to="/cart">cart</Link>
          {canAdd === 0 && !outOfStock && ' — that’s all we can sell you of this one.'}
        </p>
      )}
      {add.isSuccess && (
        <p className="notice notice--success" role="status">
          <CheckIcon /> Added to cart. <Link to="/cart">View cart</Link>
        </p>
      )}
      {add.isError && (
        <p className="notice notice--error" role="alert">
          {add.error.message}
        </p>
      )}
    </div>
  );
}
