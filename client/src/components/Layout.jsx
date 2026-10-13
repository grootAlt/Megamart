import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { Footer } from './Footer.jsx';
import { Header } from './Header.jsx';
import { Spinner } from './StateViews.jsx';

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <main id="main" className="site-main">
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
}

export function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'checking') {
    return (
      <div className="page-loading">
        <Spinner />
      </div>
    );
  }
  if (status !== 'authenticated') return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
