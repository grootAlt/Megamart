import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/format.js';

export function ProductCard({ product }) {
  const { slug, name, image, price, mrp, discountPct, hasPriceRange, inStock } = product;
  return (
    <Link to={`/products/${slug}`} className={`product-card${inStock ? '' : ' product-card--oos'}`}>
      <div className="product-card__media">
        {image ? <img src={image} alt="" loading="lazy" /> : <div className="product-card__noimg">No image</div>}
        {discountPct > 0 && (
          <span className="product-card__badge">
            {discountPct}%<br />
            OFF
          </span>
        )}
        {!inStock && <span className="product-card__oos">Out of stock</span>}
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{name}</h3>
        <p className="price-row">
          {hasPriceRange && <span className="price-row__from">From</span>}
          <strong>{formatPrice(price)}</strong>
          {mrp > price && <s>{formatPrice(mrp)}</s>}
        </p>
        <hr />
        <p className="product-card__save">{mrp > price ? `Save - ${formatPrice(mrp - price)}` : 'Best price'}</p>
      </div>
    </Link>
  );
}
