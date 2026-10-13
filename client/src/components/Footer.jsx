import { Link } from 'react-router-dom';
import { useCategories } from '../api/hooks.js';
import { PhoneIcon } from './Icons.jsx';

export function Footer() {
  const { data: categories } = useCategories();
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <p className="site-footer__logo">MegaMart</p>
          <h3>Contact Us</h3>
          <p className="site-footer__contact"><PhoneIcon /> <span>Whats App<br />+1 202-918-2132</span></p>
          <p className="site-footer__contact"><PhoneIcon /> <span>Call Us<br />+1 202-918-2132</span></p>
        </div>
        <div>
          <h3>Most Popular Categories</h3>
          <ul>
            {categories?.map((c) => (
              <li key={c.slug}><Link to={`/products?category=${c.slug}`}>{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Customer Services</h3>
          <ul>
            <li>About Us</li>
            <li>Terms &amp; Conditions</li>
            <li>FAQ</li>
            <li>Privacy Policy</li>
            <li>Cancellation &amp; Return Policy</li>
          </ul>
        </div>
      </div>
      <p className="site-footer__copy">© 2026 All rights reserved. MegaMart demo storefront.</p>
    </footer>
  );
}
