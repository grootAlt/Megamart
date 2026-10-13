import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { request, setUnauthorizedHandler, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  // "checking" while we validate a stored token, so protected pages don't
  // flash a login redirect on refresh.
  const [status, setStatus] = useState(() => (tokenStore.get() ? 'checking' : 'anonymous'));

  const logout = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
    setStatus('anonymous');
    queryClient.removeQueries({ queryKey: ['cart'] });
    queryClient.removeQueries({ queryKey: ['orders'] });
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return;
    request('/auth/me')
      .then(({ data }) => {
        setUser(data);
        setStatus('authenticated');
      })
      .catch(logout);
  }, [logout]);

  const authenticate = useCallback(
    async (path, body) => {
      const { data } = await request(path, { method: 'POST', body });
      tokenStore.set(data.token);
      setUser(data.user);
      setStatus('authenticated');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      return data.user;
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      login: (body) => authenticate('/auth/login', body),
      register: (body) => authenticate('/auth/register', body),
      logout,
    }),
    [user, status, authenticate, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
