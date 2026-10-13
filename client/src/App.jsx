import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Layout, RequireAuth } from './components/Layout.jsx';
import { EmptyState, Spinner } from './components/StateViews.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductListPage from './pages/ProductListPage.jsx';

const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage.jsx'));
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));

const fallback = (
  <div className="page-loading">
    <Spinner />
  </div>
);

export default function App() {
  return (
    <Suspense fallback={fallback}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="cart" element={<RequireAuth><CartPage /></RequireAuth>} />
          <Route path="checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="orders/:id" element={<RequireAuth><OrderConfirmationPage /></RequireAuth>} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="register" element={<AuthPage mode="register" />} />
          <Route
            path="*"
            element={
              <div className="container">
                <EmptyState title="Page not found" action={<Link to="/" className="btn btn--primary">Go home</Link>}>
                  The page you’re looking for doesn’t exist.
                </EmptyState>
              </div>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
