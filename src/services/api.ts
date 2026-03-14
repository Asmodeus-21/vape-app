import { Product } from '../types';

export async function fetchProducts(params?: {
  search?: string;
  filter?: 'all' | 'bestsellers' | 'newarrivals' | 'express';
  category?: string;
}): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.filter && params.filter !== 'all') query.set('filter', params.filter);
  if (params?.category) query.set('category', params.category);

  const url = `/api/products${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Products API error: ${res.status}`);
    return await res.json() as Product[];
  } catch (err) {
    console.error('[api] fetchProducts failed:', err);
    return [];
  }
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export async function registerUser(email: string, password: string, name: string, isVendor: boolean = false): Promise<AuthResponse> {
  const role = isVendor ? 'vendor' : 'customer';
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data as AuthResponse;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data as AuthResponse;
}

export async function fetchCurrentUser(token: string) {
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

export async function fetchProductById(id: string | number): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) return null;
    return await res.json() as Product;
  } catch (err) {
    console.error(`[api] fetchProductById failed for id ${id}:`, err);
    return null;
  }
}

export async function createOrder(token: string, items: { productId: number; quantity: number }[], shippingAddress: string) {
  const res = await fetch('/api/orders/checkout', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ items, shippingAddress }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Checkout failed');
  return data;
}

export async function fetchVendorStats(token: string) {
  const res = await fetch('/api/vendor/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch vendor stats');
  return await res.json();
}

export async function fetchVendorOrders(token: string) {
  const res = await fetch('/api/vendor/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return await res.json();
}

export async function updateVendorOrderStatus(token: string, orderId: number, status: string) {
  const res = await fetch(`/api/vendor/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}

export async function fetchVendorProducts(token: string): Promise<Product[]> {
  const res = await fetch('/api/vendor/products', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch vendor products');
  return res.json();
}

export async function createVendorProduct(token: string, productData: any) {
  const res = await fetch('/api/vendor/products', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(productData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create product');
  return data;
}

export async function updateVendorProduct(token: string, productId: number, productData: any) {
  const res = await fetch(`/api/vendor/products/${productId}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function deleteVendorProduct(token: string, productId: number) {
  const res = await fetch(`/api/vendor/products/${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
}
export async function fetchAdminStats(token: string) {
  const res = await fetch('/api/admin/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch admin stats');
  return res.json();
}

export async function fetchAdminUsers(token: string) {
  const res = await fetch('/api/admin/users', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch admin users');
  return res.json();
}

export async function updateAdminUserVerification(token: string, userId: number, status: string) {
  const res = await fetch(`/api/admin/users/${userId}/verify`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update verification status');
  return res.json();
}

export async function updateAdminUserRole(token: string, userId: number, role: string) {
  const res = await fetch(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error('Failed to update user role');
  return res.json();
}

export async function fetchAdminProducts(token: string) {
  const res = await fetch('/api/admin/products', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch platform products');
  return res.json();
}

export async function fetchAdminOrders(token: string) {
  const res = await fetch('/api/admin/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch platform orders');
  return res.json();
}
