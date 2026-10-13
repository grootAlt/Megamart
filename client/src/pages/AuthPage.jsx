import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { AlertIcon } from '../components/Icons.jsx';
import { Spinner } from '../components/StateViews.jsx';

// One component for both forms; `mode` decides which fields show.
export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const backTo = from ? `${from.pathname}${from.search ?? ''}` : '/products';

  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = `${isRegister ? 'Create account' : 'Sign in'} | MegaMart`;
  }, [isRegister]);

  if (isAuthenticated && !submitting) return <Navigate to={backTo} replace />;

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      if (isRegister) await register(values);
      else await login({ email: values.email, password: values.password });
      navigate(backTo, { replace: true });
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') {
        setFieldErrors(Object.fromEntries((err.details ?? []).map((d) => [d.path, d.message])));
      } else {
        setError(err.message);
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="container auth">
      <form className="card auth__card" onSubmit={submit} noValidate>
        <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth__sub">
          {location.state?.reason ?? (isRegister ? 'Sign up to save your cart and check out.' : 'Sign in to see your cart and check out.')}
        </p>

        {error && (
          <p className="notice notice--error" role="alert"><AlertIcon /> {error}</p>
        )}

        {isRegister && (
          <Field label="Name" name="name" value={values.name} onChange={set('name')} error={fieldErrors.name} autoComplete="name" />
        )}
        <Field label="Email" name="email" type="email" value={values.email} onChange={set('email')} error={fieldErrors.email} autoComplete="email" />
        <Field
          label="Password"
          name="password"
          type="password"
          value={values.password}
          onChange={set('password')}
          error={fieldErrors.password}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          hint={isRegister ? 'At least 8 characters' : undefined}
        />

        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting}>
          {submitting && <Spinner />} {isRegister ? 'Create account' : 'Sign in'}
        </button>

        <p className="auth__switch">
          {isRegister ? 'Already have an account?' : 'New to MegaMart?'}{' '}
          <Link to={isRegister ? '/login' : '/register'} state={location.state}>
            {isRegister ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </form>
    </div>
  );
}

function Field({ label, name, error, hint, ...input }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} aria-invalid={Boolean(error)} {...input} />
      {error ? <em className="field-error">{error}</em> : hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}
