import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext.jsx';
import { request } from './client.js';

// ---- Catalogue

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => request('/categories', { signal }).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

export function useBrands(params) {
  return useQuery({
    queryKey: ['brands', params],
    queryFn: ({ signal }) => request('/brands', { query: params, signal }).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

export function useProducts(params) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: ({ signal }) => request('/products', { query: params, signal }),
    // Keep the old grid on screen while the next filter/page loads.
    placeholderData: keepPreviousData,
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: ({ signal }) => request(`/products/${encodeURIComponent(slug)}`, { signal }).then((r) => r.data),
    retry: (count, err) => err.status !== 404 && count < 2,
  });
}

// ---- Cart
//
// The cart lives in exactly one place: the ['cart'] query. The server answers
// every cart mutation with the whole recalculated cart, and we write that
// straight into the cache. No screen keeps its own copy, and totals are never
// computed in the browser, so nothing can drift. It refetches on window focus,
// which is how a line that sold out in another tab shows up.

const CART_KEY = ['cart'];

export function useCart() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: CART_KEY,
    queryFn: ({ signal }) => request('/cart', { signal }).then((r) => r.data),
    enabled: isAuthenticated,
    refetchOnWindowFocus: 'always',
    staleTime: 0,
  });
}

function useCartMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
    onError: (err) => {
      // A stock conflict means what's on screen is out of date: refresh the
      // cart and any product page showing stock.
      queryClient.invalidateQueries({ queryKey: CART_KEY });
      if (err.status === 409) queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

export function useAddToCart() {
  return useCartMutation((body) => request('/cart/items', { method: 'POST', body }).then((r) => r.data));
}

export function useUpdateCartItem() {
  return useCartMutation(({ id, quantity }) =>
    request(`/cart/items/${id}`, { method: 'PATCH', body: { quantity } }).then((r) => r.data),
  );
}

export function useRemoveCartItem() {
  return useCartMutation((id) => request(`/cart/items/${id}`, { method: 'DELETE' }).then((r) => r.data));
}

// ---- Orders

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => request('/orders', { method: 'POST', body }).then((r) => r.data),
    onSuccess: (order) => {
      queryClient.setQueryData(['orders', order.id], order);
      queryClient.invalidateQueries({ queryKey: CART_KEY });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      if (err.details?.cart) queryClient.setQueryData(CART_KEY, err.details.cart);
    },
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: ({ signal }) => request(`/orders/${id}`, { signal }).then((r) => r.data),
  });
}
