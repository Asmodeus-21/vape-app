import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchSavedItems, fetchUserOrders, removeSavedItem } from '../services/api';
import { Product, UserOrder } from '../types';

interface DashboardProps {
    userName: string;
    email: string;
    token: string;
    onAddToCart?: (product: Product, quantity: number, options: { flavor: string; nicotine: string }) => void;
}

type DashboardTab = 'profile' | 'orders' | 'saved';

const DASHBOARD_TABS: DashboardTab[] = ['profile', 'orders', 'saved'];
const TAB_LABELS: Record<DashboardTab, string> = {
    profile: 'My Profile',
    orders: 'Order Status',
    saved: 'Saved Items',
};

export default function Dashboard({ userName, email, token, onAddToCart }: DashboardProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<DashboardTab>('profile');
    const [orders, setOrders] = useState<UserOrder[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState<string | null>(null);
    const [savedItems, setSavedItems] = useState<Product[]>([]);
    const [savedLoading, setSavedLoading] = useState(false);
    const [savedError, setSavedError] = useState<string | null>(null);

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'orders' || tabParam === 'saved') {
            setActiveTab(tabParam);
            return;
        }
        setActiveTab('profile');
    }, [searchParams]);

    const updateTab = useCallback((tab: DashboardTab) => {
        setSearchParams(tab === 'profile' ? {} : { tab });
    }, [setSearchParams]);

    const loadOrders = useCallback(async () => {
        if (!token) {
            setOrders([]);
            return;
        }

        setOrdersLoading(true);
        setOrdersError(null);
        try {
            const data = await fetchUserOrders(token);
            setOrders(data);
        } catch (err: any) {
            setOrdersError(err?.message || 'Unable to load orders.');
        } finally {
            setOrdersLoading(false);
        }
    }, [token]);

    const loadSavedItems = useCallback(async () => {
        if (!token) {
            setSavedItems([]);
            return;
        }

        setSavedLoading(true);
        setSavedError(null);
        try {
            const data = await fetchSavedItems(token);
            setSavedItems(data);
        } catch (err: any) {
            setSavedError(err?.message || 'Unable to load saved items.');
        } finally {
            setSavedLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (activeTab === 'orders') {
            loadOrders();
        }
        if (activeTab === 'saved') {
            loadSavedItems();
        }
    }, [activeTab, loadOrders, loadSavedItems]);

    useEffect(() => {
        if (!token) return;
        loadSavedItems();
    }, [loadSavedItems, token]);

    const handleRemoveSavedItem = useCallback(async (productId: number) => {
        if (!token) return;
        setSavedLoading(true);
        setSavedError(null);
        try {
            await removeSavedItem(token, productId);
            await loadSavedItems();
        } catch (err: any) {
            setSavedError(err?.message || 'Unable to remove saved item.');
        } finally {
            setSavedLoading(false);
        }
    }, [loadSavedItems, token]);

    const lastOrder = useMemo(() => orders[0], [orders]);

    return (
        <section className="mx-4 mt-6 rounded-[2rem] border border-slate-800 bg-[#0f172a] px-6 py-12 text-white shadow-[0_28px_70px_rgba(2,6,23,0.55)] md:px-12 md:py-16">
            <div className="mx-auto max-w-4xl space-y-8">
                <header className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#4AB1F4]">Dashboard</p>
                    <h1 className="text-3xl font-black uppercase tracking-tight md:text-4xl">My Account</h1>
                    <p className="text-sm font-semibold text-slate-300">Signed in as {userName} ({email}).</p>
                </header>

                <div className="grid gap-3 sm:grid-cols-3">
                    {DASHBOARD_TABS.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => updateTab(tab)}
                            className={`rounded-3xl border px-5 py-4 text-left text-sm font-black uppercase tracking-[0.16em] transition-all ${
                                activeTab === tab
                                    ? 'border-[#4AB1F4] bg-white text-slate-900 shadow-[0_20px_60px_rgba(74,177,244,0.18)]'
                                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-[#4AB1F4] hover:text-white'
                            }`}
                        >
                            {TAB_LABELS[tab]}
                        </button>
                    ))}
                </div>

                {activeTab === 'profile' && (
                    <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900 p-8 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#4AB1F4]">Account Overview</p>
                                <p className="mt-4 text-sm text-slate-300 leading-relaxed">Manage your profile, view recent activity, and keep your account secure.</p>
                            </div>
                            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#4AB1F4]">Account Details</p>
                                <div className="mt-4 space-y-3 text-sm text-slate-300">
                                    <div><span className="font-semibold text-white">Name:</span> {userName}</div>
                                    <div><span className="font-semibold text-white">Email:</span> {email}</div>
                                    <div><span className="font-semibold text-white">Saved Items:</span> {savedItems.length}</div>
                                    <div><span className="font-semibold text-white">Recent Order:</span> {lastOrder ? `#${lastOrder.id} — ${lastOrder.status}` : 'No orders yet'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Link
                                to="/products"
                                className="inline-flex items-center justify-center rounded-3xl border border-[#4AB1F4] bg-[#4AB1F4] px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-950 transition hover:bg-[#2f9ce5]"
                            >
                                Browse more products
                            </Link>
                            <button
                                type="button"
                                onClick={() => updateTab('orders')}
                                className="inline-flex items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-300 transition hover:border-[#4AB1F4] hover:text-white"
                            >
                                View Order History
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900 p-8 space-y-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#4AB1F4]">Order History</p>
                                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">Recent Orders</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => loadOrders()}
                                className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 transition hover:border-[#4AB1F4] hover:text-white"
                            >
                                Refresh
                            </button>
                        </div>

                        {ordersLoading ? (
                            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center text-sm text-slate-400">Loading orders...</div>
                        ) : ordersError ? (
                            <div className="rounded-3xl border border-rose-500 bg-rose-950/20 p-8 text-sm text-rose-300">{ordersError}</div>
                        ) : orders.length === 0 ? (
                            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-sm text-slate-400">
                                No orders found yet. Place an order and come back to track its status here.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {orders.map((order) => (
                                    <div key={order.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4AB1F4]">Order #{order.id}</p>
                                                <p className="mt-2 text-sm text-slate-300">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`inline-flex rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${order.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-300' : order.status === 'cancelled' ? 'bg-rose-500/15 text-rose-300' : 'bg-[#4AB1F4]/15 text-[#4AB1F4]'}`}>
                                                {order.status}
                                            </span>
                                        </div>

                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Shipping Address</p>
                                                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{order.shippingAddress}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Order Total</p>
                                                <p className="mt-2 text-2xl font-black text-white">${order.totalAmount.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-3">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <img src={item.product.image} alt={item.product.name} className="h-16 w-16 rounded-2xl object-contain bg-white/5 p-2" />
                                                        <div>
                                                            <p className="font-bold text-sm text-white">{item.product.name}</p>
                                                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Qty {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-slate-300">Unit Price ${item.priceAtTime.toFixed(2)}</p>
                                                        <p className="mt-1 text-base font-black text-white">${(item.quantity * item.priceAtTime).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'saved' && (
                    <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900 p-8 space-y-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#4AB1F4]">Saved Items</p>
                                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">Keep items for later</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => loadSavedItems()}
                                className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 transition hover:border-[#4AB1F4] hover:text-white"
                            >
                                Refresh
                            </button>
                        </div>

                        {savedLoading ? (
                            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center text-sm text-slate-400">Loading saved items...</div>
                        ) : savedError ? (
                            <div className="rounded-3xl border border-rose-500 bg-rose-950/20 p-8 text-sm text-rose-300">{savedError}</div>
                        ) : savedItems.length === 0 ? (
                            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-sm text-slate-400">
                                You haven’t saved any items yet. Browse products and save them for later from the product detail page.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {savedItems.map((product) => (
                                    <div key={product.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                                        <div className="flex items-center gap-4">
                                            <img src={product.image} alt={product.name} className="h-20 w-20 rounded-3xl object-contain bg-white/5 p-3" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-white line-clamp-2">{product.name}</p>
                                                <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">{product.brand}</p>
                                                <p className="mt-2 text-sm font-black text-[#4AB1F4]">${product.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                                            <button
                                                type="button"
                                                onClick={() => onAddToCart?.(product, 1, { flavor: product.flavor, nicotine: product.nicotine })}
                                                className="w-full rounded-3xl bg-[#4AB1F4] px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-950 transition hover:bg-[#2f9ce5] sm:w-auto"
                                            >
                                                Add to Cart
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSavedItem(product.id)}
                                                className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-300 transition hover:border-[#4AB1F4] hover:text-white sm:w-auto"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
