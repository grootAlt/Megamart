import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart, useCategories } from '../api/hooks.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { CartIcon, ListIcon, MenuIcon, OfferIcon, PinIcon, SearchIcon, TruckIcon, UserIcon } from './Icons.jsx';

export function Header() {
  return (
    <header className="site-header">
      <div className="topbar">
        <div className="container topbar__inner">
          <span>Welcome to worldwide Megamart!</span>
          <ul>
            <li><PinIcon /> Deliver to <strong>560038</strong></li>
            <li><TruckIcon /> Track your order</li>
            <li><OfferIcon /> All Offers</li>
          </ul>
        </div>
      </div>
      <div className="container masthead">
        <Link to="/products" className="masthead__menu" aria-label="All products">
          <MenuIcon />
        </Link>
        <Link to="/" className="logo">MegaMart</Link>
        <SearchBox />
        <Account />
        <CartLink />
      </div>
      <CategoryNav />
    </header>
  );
}

function SearchBox() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const urlQ = params.get('q') ?? '';
  const [q, setQ] = useState(urlQ);
  useEffect(() => {
    setQ(urlQ);
  }, [urlQ]);

  const submit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (q.trim()) next.set('q', q.trim());
    navigate(`/products?${next}`);
  };

  return (
    <form className="search" role="search" onSubmit={submit}>
      <SearchIcon className="search__icon" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search essentials, groceries and more..."
        aria-label="Search products"
        maxLength={100}
      />
      <button type="submit" className="search__submit" aria-label="Search">
        <ListIcon />
      </button>
    </form>
  );
}

function Account() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  if (isAuthenticated) {
    return (
      <div className="masthead__action">
        <UserIcon />
        <span className="masthead__label">Hi, {user.name.split(' ')[0]}</span>
        <button type="button" className="link-btn" onClick={logout}>Sign out</button>
      </div>
    );
  }
  return (
    <Link to="/login" state={{ from: location }} className="masthead__action">
      <UserIcon />
      <span className="masthead__label">Sign Up/Sign In</span>
    </Link>
  );
}

function CartLink() {
  const { data: cart } = useCart();
  const count = cart?.summary.itemCount ?? 0;
  const hasIssues = (cart?.summary.issues ?? 0) > 0;
  return (
    <Link to="/cart" className="masthead__action masthead__cart" aria-label={`Cart, ${count} items`}>
      <span className="cart-icon">
        <CartIcon />
        {count > 0 && <span className={`cart-icon__badge${hasIssues ? ' cart-icon__badge--warn' : ''}`}>{count}</span>}
      </span>
      <span className="masthead__label">Cart</span>
    </Link>
  );
}

function CategoryNav() {
  const { data: categories } = useCategories();
  const [params] = useSearchParams();
  const location = useLocation();
  const onListing = location.pathname === '/products';
  const active = onListing ? params.get('category') ?? '' : null;

  return (
    <nav className="category-nav" aria-label="Categories">
      <div className="container">
        <ul className="category-nav__list">
          <li>
            <NavLink to="/products" className={`pill${active === '' ? ' pill--active' : ''}`} end>
              All products
            </NavLink>
          </li>
          {categories?.map((c) => (
            <li key={c.slug}>
              <Link to={`/products?category=${c.slug}`} className={`pill${active === c.slug ? ' pill--active' : ''}`}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
