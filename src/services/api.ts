import { ParentVariantGroup, Product, Store } from '../types';

const MAX_PRODUCTS_LIMIT = 1000;

/** Parse a fetch Response as JSON safely; logs status + raw body on failure. */
async function safeJson(res: Response): Promise<any> {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        console.error(
            `[api] Non-JSON response — status: ${res.status} ${res.statusText}`,
            `url: ${res.url}`,
            `body: ${text.slice(0, 300)}`
        );
        return {};
    }
}

/** Convert HTTP errors to user-friendly messages */
function getFriendlyErrorMessage(status: number, defaultMessage: string): string {
    if (status === 503 || status === 502 || status === 504) {
        return "We're having trouble connecting to the store. Please check your internet connection and try again in a moment.";
    }
    if (status === 500) {
        return 'There was a server error. Please try again shortly.';
    }
    if (status === 401) {
        return 'Your session has expired. Please log in again.';
    }
    if (status === 403) {
        return 'You do not have permission to perform this action.';
    }
    if (status === 404) {
        return 'The requested item was not found.';
    }
    return defaultMessage;
}

export async function fetchProducts(params?: {
    search?: string;
    filter?: 'all' | 'bestsellers' | 'newarrivals' | 'express';
    category?: string;
    limit?: number;
}): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.filter && params.filter !== 'all') query.set('filter', params.filter);
    if (params?.category) query.set('category', params.category);
    if (
        typeof params?.limit === 'number'
        && Number.isInteger(params.limit)
        && params.limit > 0
        && params.limit <= MAX_PRODUCTS_LIMIT
    ) {
        query.set('limit', String(params.limit));
    }

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

export async function fetchHomepageMasterListings(limit: number = 8): Promise<ParentVariantGroup[]> {
    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 24) : 8;

    try {
        const res = await fetch(`/api/products/master-listings?limit=${safeLimit}`);
        if (!res.ok) throw new Error(`Master listings API error: ${res.status}`);
        return await res.json() as ParentVariantGroup[];
    } catch (err) {
        console.error('[api] fetchHomepageMasterListings failed:', err);
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
        storeId?: number | null;
    };
}

export async function registerUser(
    email: string,
    password: string,
    name: string,
    isVendor: boolean = false,
    storeName?: string,
    storeAddress?: string,
    dob?: string,
    ageVerified?: boolean
): Promise<AuthResponse> {
    const role = isVendor ? 'store_manager' : 'customer';
    const payload: Record<string, unknown> = { email, password, name, role, dob, ageVerified };
    if (isVendor) {
        payload.storeName = storeName || `${name}'s Franchise`;
        payload.storeAddress = storeAddress || '';
    }
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data as AuthResponse;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await safeJson(res);
    if (!res.ok) {
        const friendlyError = getFriendlyErrorMessage(res.status, data.error || 'Login failed');
        throw new Error(friendlyError);
    }
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

export async function createOrder(token: string | null | undefined, items: { productId: number; quantity: number }[], shippingAddress: string) {
    if (!token) {
        throw new Error('Missing auth token for authenticated checkout');
    }

    const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items, shippingAddress }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Checkout failed');
    return data;
}

export async function createPaymentIntent(items: { productId: number; quantity: number }[], deliveryMethod: string) {
    const res = await fetch('/api/orders/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, deliveryMethod }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');
    return data as { clientSecret: string };
}

export async function createGuestOrder(
    items: { productId: number; quantity: number }[],
    shippingAddress: string,
    customerEmail: string,
    customerName: string,
    saveDetails: boolean,
) {
    const res = await fetch('/api/orders/guest-checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items, shippingAddress, customerEmail, customerName, saveDetails }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Guest checkout failed');
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
    const data = await safeJson(res);
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

export async function fetchAdminProducts(token: string, storeId?: number | 'all') {
    const query = storeId && storeId !== 'all' ? `?storeId=${storeId}` : '';
    const res = await fetch(`/api/admin/products${query}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch platform products');
    return res.json();
}

export async function fetchAdminOrders(token: string, storeId?: number | 'all') {
    const query = storeId && storeId !== 'all' ? `?storeId=${storeId}` : '';
    const res = await fetch(`/api/admin/orders${query}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch platform orders');
    return res.json();
}

export async function fetchAdminStores(token: string): Promise<Store[]> {
    const res = await fetch('/api/admin/stores', {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch franchise stores');
    return res.json();
}

export interface ChatLead {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    flavorQuery: string | null;
    aiResponse: string | null;
    source: string;
    createdAt: string;
}

export async function fetchAdminLeads(token: string, limit: number = 100): Promise<ChatLead[]> {
    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 500) : 100;
    const res = await fetch(`/api/admin/leads?limit=${safeLimit}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch chat leads');
    return res.json();
}

// ─── CART API ────────────────────────────────────────────────────────────────

export interface CartApiItem {
    cartItemId: number;
    quantity: number;
    product: Product;
}

export async function fetchCart(token: string): Promise<CartApiItem[]> {
    const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
}

export async function addCartItemApi(token: string, productId: number, quantity: number = 1): Promise<void> {
    await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity }),
    });
}

export async function updateCartItemApi(token: string, productId: number, quantity: number): Promise<void> {
    await fetch(`/api/cart/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity }),
    });
}

export async function removeCartItemApi(token: string, productId: number): Promise<void> {
    await fetch(`/api/cart/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function clearCartApi(token: string): Promise<void> {
    await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}

// ─── OTP AUTH ─────────────────────────────────────────────────────────────────

export async function requestOtp(email: string, name?: string): Promise<void> {
    const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
    });
    const data = await res.json();
    if (!res.ok) {
        const friendlyError = getFriendlyErrorMessage(res.status, data.error || 'Failed to send verification code');
        throw new Error(friendlyError);
    }
}

export async function requestLoginOtp(email: string): Promise<void> {
    const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
        const friendlyError = getFriendlyErrorMessage(res.status, data.error || 'Failed to send login code');
        throw new Error(friendlyError);
    }
}

export async function verifyLoginOtp(email: string, code: string): Promise<AuthResponse> {
    const res = await fetch('/api/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (!res.ok) {
        const friendlyError = getFriendlyErrorMessage(res.status, data.error || 'Code verification failed');
        throw new Error(friendlyError);
    }
    return data as AuthResponse;
}

export async function registerWithOtp(
    email: string,
    code: string,
    name: string,
    password: string,
    isVendor: boolean = false,
    storeName?: string,
    storeAddress?: string,
    dob?: string,
    ageVerified?: boolean
): Promise<AuthResponse> {
    const res = await fetch('/api/auth/register-with-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, name, password, isVendor, storeName, storeAddress, dob, ageVerified }),
    });
    const data = await res.json();
    if (!res.ok) {
        const friendlyError = getFriendlyErrorMessage(res.status, data.error || 'Registration failed');
        throw new Error(friendlyError);
    }
    return data as AuthResponse;
}
