/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    ArrowRight,
    Bell,
    ChevronDown,
    ChevronRight,
    Globe,
    Loader2,
    LogOut,
    MapPin,
    Menu,
    MessageSquare,
    Package,
    Search,
    ShieldCheck,
    ShoppingCart,
    Sparkles,
    Star,
    TrendingUp,
    User as UserIcon,
    X,
    Zap
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import CheckoutOverlay from './components/CheckoutOverlay';
import FlavorExplorer from './components/FlavorExplorer';
import ProductDetail from './components/ProductDetail';
import VendorOrders from './components/VendorOrders';
import VendorProductForm from './components/VendorProductForm';
import VendorProductList from './components/VendorProductList';
import { SYSTEM_INSTRUCTIONS, vapeosAI } from './services/aiService';
import { fetchAdminStats, fetchCurrentUser, fetchProducts, fetchVendorStats } from './services/api';
import { Product } from './types';

interface AuthUser {
    id: number;
    email: string;
    name: string;
    role: string;
}

export default function App() {
    const [activeTab, setActiveTab] = useState<'marketplace' | 'vendor' | 'admin'>('marketplace');
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showCheckoutOverlay, setShowCheckoutOverlay] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [aiChatOpen, setAiChatOpen] = useState(false);
    const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'bestsellers' | 'newarrivals' | 'express'>('all');
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [vendorQuery, setVendorQuery] = useState('');
    const [vendorAiLoading, setVendorAiLoading] = useState(false);
    const [vendorAiResponse, setVendorAiResponse] = useState('');
    const [botInsights, setBotInsights] = useState<{ review: string; inventory: string; trends: string }>({ review: '', inventory: '', trends: '' });
    const [botsLoading, setBotsLoading] = useState(false);
    const [showVendorProductForm, setShowVendorProductForm] = useState(false);
    const [vendorStats, setVendorStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [adminStats, setAdminStats] = useState<any>(null);
    const [adminLoading, setAdminLoading] = useState(false);

    // ── Cart: restore from localStorage ──────────────────────────────
    const [cart, setCart] = useState<Product[]>(() => {
        try {
            const saved = localStorage.getItem('vapeshub_cart');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    // ── Cart: persist to localStorage on every change ─────────────────
    useEffect(() => {
        localStorage.setItem('vapeshub_cart', JSON.stringify(cart));
    }, [cart]);

    // ── Auth: restore session on load ─────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem('vapeshub_token');
        if (token) {
            fetchCurrentUser(token).then(user => {
                if (user) setCurrentUser(user);
                else localStorage.removeItem('vapeshub_token');
            });
        }
    }, []);

    // ── Products: fetch from API ───────────────────────────────────────
    const loadProducts = useCallback(async () => {
        setProductsLoading(true);
        const data = await fetchProducts({ filter: activeFilter, search: searchQuery });
        setProducts(data);
        setProductsLoading(false);
    }, [activeFilter, searchQuery]);

    useEffect(() => {
        const debounce = setTimeout(loadProducts, 300);
        return () => clearTimeout(debounce);
    }, [loadProducts]);

    useEffect(() => {
        // AI Pop-up after 5s — delayed so it doesn't conflict with modals opening on load
        const timer = setTimeout(() => {
            setAiChatOpen(true);
            setAiMessages([{ role: 'ai', text: "Hey! I'm VapeOS AI — tell me what you're looking for and I'll find the perfect match! 🌿" }]);
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    // ── PWA: Service Worker Registration ──────────────────────────────
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('SW registered: ', registration);
                }).catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
            });
        }
    }, []);

    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            toast.error('This browser does not support notifications');
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            toast.success('Notifications enabled!');
            // Register for push here if real backend existed
        } else {
            toast.error('Notifications denied');
        }
    };

    const sendTestNotification = () => {
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('VapesHub Live Alert', {
                    body: 'You have a new high-priority order from Ukiah, CA!',
                    icon: '/icon-512.png',
                    vibrate: [200, 100, 200]
                } as any);
            });
        } else {
            toast('Please enable notifications first!', { icon: '🔔' });
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem('vapeshub_token');
        setCurrentUser(null);
        toast.success('Signed out successfully.');
    };

    // ── Live Vendor AI Bots ───────────────────────────────────────────
    const loadVendorBots = async () => {
        if (botsLoading || botInsights.review) return;
        setBotsLoading(true);

        const token = localStorage.getItem('vapeshub_token');
        let context = 'a local vape shop';
        if (vendorStats) {
            context = `a shop with $${vendorStats.todaySales} in today's sales, ${vendorStats.openOrders} open orders, and ${vendorStats.lowStockItems} low stock items. Total earnings are $${vendorStats.totalEarnings}.`;
        }

        const [review, inventory, trends] = await Promise.all([
            vapeosAI.generateResponse(`Based on our current business status (${context}), summarize what our customers are likely saying about our service and disposables.`, SYSTEM_INSTRUCTIONS.REVIEW_SUMMARIZER),
            vapeosAI.generateResponse(`We have ${vendorStats?.lowStockItems || 0} items low on stock. Suggest a restock priority list for high-performance pod systems and disposables based on current volume.`, SYSTEM_INSTRUCTIONS.INVENTORY_ANALYST),
            vapeosAI.generateResponse(`With total volume at $${vendorStats?.totalEarnings || 0}, identify 3 critical market trends we should pivot towards to increase our cycle velocity.`, SYSTEM_INSTRUCTIONS.MARKET_TREND_BOT),
        ]);
        setBotInsights({ review, inventory, trends });
        setBotsLoading(false);
    };

    const loadVendorStats = async () => {
        const token = localStorage.getItem('vapeshub_token');
        if (!token || statsLoading) return;
        try {
            setStatsLoading(true);
            const stats = await fetchVendorStats(token);
            setVendorStats(stats);
        } catch (err) {
            console.error('Failed to load stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const loadAdminStats = async () => {
        const token = localStorage.getItem('vapeshub_token');
        if (!token || adminLoading) return;
        try {
            setAdminLoading(true);
            const stats = await fetchAdminStats(token);
            setAdminStats(stats);
        } catch (err) {
            console.error('Failed to load admin stats:', err);
        } finally {
            setAdminLoading(false);
        }
    };

    const handleVendorAiQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendorQuery.trim() || vendorAiLoading) return;
        setVendorAiLoading(true);
        const response = await vapeosAI.generateResponse(vendorQuery, SYSTEM_INSTRUCTIONS.VENDOR_STRATEGIST);
        setVendorAiResponse(response);
        setVendorAiLoading(false);
    };

    const addToCart = (product: Product, quantity: number = 1, options?: { flavor: string; nicotine: string }) => {
        const itemToAdd = {
            ...product,
            flavor: options?.flavor || product.flavor,
            nicotine: options?.nicotine || product.nicotine
        };
        const newItems = Array(quantity).fill(itemToAdd);
        setCart(prev => [...prev, ...newItems]);
        toast.success(`${product.name.substring(0, 30)}... added to cart!`, { duration: 2000 });
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const updateQty = (index: number, delta: number) => {
        setCart(prev => {
            const updated = [...prev];
            if (delta < 0) { updated.splice(index, 1); return updated; }
            updated.splice(index + 1, 0, updated[index]);
            return updated;
        });
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            toast.error('Your cart is empty');
            return;
        }
        if (!currentUser) {
            toast('Please sign in to checkout', { icon: '🔒' });
            setShowAuthModal(true);
            return;
        }
        setShowCheckoutOverlay(true);
    };

    const handleVendorTabClick = () => {
        if (!currentUser) {
            toast('Please sign in to access Seller Central', { icon: '🔒' });
            setShowAuthModal(true);
            return;
        }
        if (currentUser.role !== 'vendor' && currentUser.role !== 'admin') {
            toast.error('Seller Central is restricted to verified retailers.');
            return;
        }
        setActiveTab('vendor');
        setSelectedProductId(null);
    };

    const handleFeatureNotReady = (featureName: string) => {
        toast.error(`LAYER OFFLINE: ${featureName} scheduled for v2 deployment.`, {
            style: {
                borderRadius: '16px',
                background: '#0f172a',
                color: '#fff',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontSize: '10px',
                fontWeight: '900',
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
            },
        });
    };

    const handleAiChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        const userMsg = chatInput;
        setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setChatInput('');
        setAiMessages(prev => [...prev, { role: 'ai', text: '...' }]);
        const response = await vapeosAI.generateResponse(userMsg, SYSTEM_INSTRUCTIONS.FLAVOR_EXPERT);
        setAiMessages(prev => { const next = [...prev]; next[next.length - 1] = { role: 'ai', text: response || 'Sorry, try again!' }; return next; });
    };

    const scrollToFlavorExplorer = () => {
        setActiveTab('marketplace');
        setTimeout(() => {
            const element = document.getElementById('flavor-explorer-section');
            if (element) {
                const offset = 100; // Account for sticky header
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }, 100);
    };

    // Server-side filtering — products are already filtered, just use them directly
    const filteredProducts = products;

    return (
        <div className="min-h-screen flex flex-col bg-bg-main">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        borderRadius: '16px',
                        background: '#0f172a',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '11px',
                        fontWeight: '900',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        padding: '16px 24px',
                    }
                }}
            />
            {/* Auth Modal */}
            <AnimatePresence>
                {showAuthModal && (
                    <AuthModal
                        onClose={() => setShowAuthModal(false)}
                        onAuthSuccess={(user, token) => {
                            setCurrentUser(user);
                            localStorage.setItem('vapeshub_token', token);
                        }}
                    />
                )}
            </AnimatePresence>
            {/* Checkout Overlay */}
            <AnimatePresence>
                {showCheckoutOverlay && currentUser && (
                    <CheckoutOverlay
                        cart={cart}
                        token={localStorage.getItem('vapeshub_token') || ''}
                        onClose={() => setShowCheckoutOverlay(false)}
                        onSuccess={() => {
                            setCart([]);
                        }}
                    />
                )}
            </AnimatePresence>
            {/* Premium Top Nav */}
            <header className="bg-white border-b border-slate-100 text-slate-900 sticky top-0 z-50">
                <div className="max-w-[1500px] mx-auto px-6 h-20 md:h-24 flex items-center gap-6 md:gap-12">
                    {/* Logo */}
                    <div
                        onClick={() => { setActiveTab('marketplace'); setSelectedProductId(null); setSearchQuery(''); }}
                        className="flex items-center gap-3 cursor-pointer group shrink-0"
                    >
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-primary rounded-2xl flex items-center justify-center shadow-xl rotate-3 group-hover:rotate-12 transition-all">
                            <Zap className="text-white w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl md:text-2xl font-black tracking-tighter uppercase italic leading-none">VapesHub<span className="text-brand-primary">.</span></span>
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Industrial Market</span>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="hidden sm:flex flex-1 h-12 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all">
                        <div className="bg-slate-100 flex items-center px-4 border-r border-slate-100 cursor-pointer hover:bg-slate-200 transition-colors">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Inventory</span>
                        </div>
                        <input
                            type="text"
                            className="flex-1 px-4 bg-transparent text-sm font-bold text-slate-900 focus:outline-none placeholder:text-slate-300"
                            placeholder="Search product identifiers, flavors, or brands..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="bg-brand-primary px-6 hover:bg-brand-primary-hover transition-colors">
                            <Search className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* User & Actions */}
                    <div className="flex items-center gap-6 md:gap-10 shrink-0">
                        {currentUser ? (
                            <div
                                className="hidden md:flex items-center gap-4 cursor-pointer group"
                                onClick={() => handleFeatureNotReady('User Profile')}
                            >
                                <div className="w-10 h-10 bg-brand-secondary rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all border-2 border-brand-primary/20">
                                    <UserIcon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Authenticated</span>
                                    <div className="flex items-center gap-2 group-hover:text-brand-primary transition-colors">
                                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{currentUser.name}</span>
                                        <LogOut className="w-4 h-4 text-slate-300 hover:text-red-500 transition-colors" onClick={(e) => { e.stopPropagation(); handleSignOut(); }} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-4 cursor-pointer group" onClick={() => setShowAuthModal(true)}>
                                <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-brand-primary transition-all group-hover:rotate-6 shadow-sm">
                                    <UserIcon className="text-slate-900 w-5 h-5 group-hover:text-white transition-all" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Credentials</span>
                                    <div className="flex items-center gap-1 group-hover:text-brand-primary transition-colors">
                                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Login Flow</span>
                                        <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-brand-primary" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Cart */}
                        <div className="flex items-center gap-4 cursor-pointer group relative" onClick={() => setIsCartOpen(true)}>
                            <div className="relative bg-brand-secondary p-3 md:p-4 rounded-[1.25rem] shadow-xl shadow-brand-secondary/10 group-hover:bg-brand-primary transition-all duration-300 before:absolute before:inset-0 before:bg-white/10 before:rounded-[1.25rem] before:opacity-0 group-hover:before:opacity-100">
                                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                <span className="absolute -top-1 -right-1 bg-brand-primary text-slate-900 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-white group-hover:scale-110 transition-all">{cart.length}</span>
                            </div>
                            <div className="hidden lg:flex flex-col">
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Ledger Total</span>
                                <span className="text-sm font-black text-slate-900">${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Search - Visible only on mobile */}
                <div className="sm:hidden px-4 pb-3">
                    <div className="flex h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <input
                            type="text"
                            className="flex-1 px-3 text-sm focus:outline-none"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="bg-brand-primary px-4">
                            <Search className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>

                {/* Sub Nav - Mobile Responsive */}
                <div className="bg-brand-secondary text-white px-6 md:px-10 py-5 flex items-center gap-6 md:gap-10 text-[10px] font-black uppercase tracking-[0.2em] overflow-x-auto scrollbar-hide border-t border-white/5 shadow-inner">
                    <div
                        onClick={() => { setActiveTab('marketplace'); setActiveFilter('all'); }}
                        className={`flex items-center gap-3 cursor-pointer hover:text-brand-primary transition-all whitespace-nowrap ${activeFilter === 'all' ? 'text-brand-primary' : 'text-slate-400'}`}
                    >
                        <Menu className="w-4 h-4" />
                        <span className="tracking-[0.3em]">Master Inventory</span>
                    </div>
                    <span
                        onClick={() => { setActiveTab('marketplace'); setActiveFilter('bestsellers'); }}
                        className={`cursor-pointer hover:text-brand-primary transition-all whitespace-nowrap ${activeFilter === 'bestsellers' ? 'text-brand-primary' : 'text-slate-400'}`}
                    >
                        Peak Performance
                    </span>
                    <span
                        onClick={() => { setActiveTab('marketplace'); setActiveFilter('newarrivals'); }}
                        className={`cursor-pointer hover:text-brand-primary transition-all whitespace-nowrap ${activeFilter === 'newarrivals' ? 'text-brand-primary' : 'text-slate-400'}`}
                    >
                        Current Drops
                    </span>
                    <span
                        onClick={scrollToFlavorExplorer}
                        className="cursor-pointer hover:text-brand-primary transition-all whitespace-nowrap text-slate-400"
                    >
                        Flavor DNA Engine
                    </span>
                    <span
                        onClick={() => { setActiveTab('marketplace'); setActiveFilter('express'); }}
                        className={`hidden md:block cursor-pointer hover:text-brand-primary transition-all whitespace-nowrap ${activeFilter === 'express' ? 'text-brand-primary' : 'text-slate-400'}`}
                    >
                        Express Logistics
                    </span>
                    <div className="flex-1" />
                    <div
                        onClick={handleVendorTabClick}
                        className="flex items-center gap-3 text-brand-accent cursor-pointer hover:text-white transition-all whitespace-nowrap bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:bg-brand-accent/20"
                    >
                        <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="tracking-[0.3em]">Retailer OS</span>
                    </div>
                    {currentUser?.role === 'admin' && (
                        <div
                            onClick={() => setActiveTab('admin')}
                            className="flex items-center gap-3 text-rose-400 cursor-pointer hover:text-white transition-all whitespace-nowrap ml-4 pl-6 border-l border-white/10"
                        >
                            <ShieldCheck className="w-4 h-4 shadow-[0_0_8px_rgba(251,113,133,0.3)]" />
                            <span className="tracking-[0.3em]">Admin Layer</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-[1500px] mx-auto w-full pb-12">
                {activeTab === 'marketplace' && !selectedProductId && (
                    <div className="space-y-6">
                        {/* Hero Section */}
                        <section className="relative h-[300px] md:h-[500px] overflow-hidden bg-gradient-to-r from-brand-secondary to-brand-secondary/80 mx-4 rounded-[2.5rem] mt-6 shadow-2xl group">
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-secondary via-brand-secondary/60 to-transparent z-10" />
                            <img src="/images/devices/geekvape-aegis-legend.jpg" alt="Hero" className="absolute right-0 top-0 w-3/4 h-full object-cover grayscale opacity-40 group-hover:scale-105 transition-transform duration-[2s]" />
                            <div className="absolute inset-0 flex flex-col justify-center px-10 md:px-20 z-20">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" />
                                    <span className="text-brand-primary text-[10px] font-black uppercase tracking-[0.4em]">Operational Status: Market Active</span>
                                </div>
                                <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-8">
                                    Industry<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-accent to-emerald-400">Standard.</span>
                                </h2>
                                <div className="flex flex-wrap gap-4">
                                    <button onClick={() => { setActiveTab('marketplace'); setActiveFilter('newarrivals'); }} className="px-10 py-4 bg-brand-primary text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-brand-primary-hover transition-all shadow-xl shadow-brand-primary/20">Current Drops</button>
                                    <button onClick={scrollToFlavorExplorer} className="px-10 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-white/10 transition-all">Flavor DNA Engine</button>
                                </div>
                            </div>
                        </section>

                        {/* Product Grid - Premium Category Cards */}
                        <div className="px-4 -mt-16 md:-mt-24 relative z-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Featured Categories */}
                            {[
                                { title: 'Master Inventory', filter: 'all', tag: 'Master Ledger', items: [{ name: 'Mods', img: '/images/devices/smok-nord-4-kit.jpg' }, { name: 'Disposables', img: '/images/devices/elf-bar-bc5000.png' }, { name: 'Accessories', img: '/images/accessories/cotton-bacon-prime.jpg' }, { name: 'Glass', img: '/images/glass/ash-catcher-14mm.jpeg' }] },
                                { title: 'Peak Performance', filter: 'bestsellers', tag: 'Performance Tier', items: [{ name: 'Puffco Plus', img: '/images/devices/puffco-plus-pen.jpeg' }, { name: 'Uwell Caliburn', img: '/images/devices/uwell-caliburn-g2.webp' }, { name: 'Vaporesso XROS 3', img: '/images/devices/vaporesso-xros-3.png' }, { name: 'Vuse Alto', img: '/images/devices/vuse-alto-kit.jpg' }] },
                                { title: 'Current Drops', filter: 'newarrivals', tag: 'Recent Shipments', items: [{ name: 'Straight Tube', img: '/images/glass/straight-tube-bong.jpg' }, { name: 'Sherlock Pipe', img: '/images/glass/sherlock-pipe-glass.webp' }, { name: 'Spoon Pipe', img: '/images/glass/spoon-pipe-color.jpg' }, { name: 'Gravity Bong', img: '/images/glass/gravity-bong-glass.webp' }] },
                                { title: 'Express Logistics', filter: 'express', tag: 'Supply Chain', items: [{ name: 'Same-day', img: '/images/sameday_delivery_1773423053852.png' }, { name: 'Local', img: '/images/sameday_delivery_1773423053852.png' }, { name: 'Subscription', img: '/images/subscription_box_1773423072371.png' }, { name: 'Bulk', img: '/images/bulk_deals_1773423095884.png' }] },
                            ].map((cat, i) => (
                                <div key={i} onClick={() => { setActiveTab('marketplace'); setActiveFilter(cat.filter as any); }} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-900/5 flex flex-col h-full group hover:border-brand-primary/30 transition-all duration-500 cursor-pointer">
                                    <div className="flex flex-col mb-8">
                                        <span className="text-brand-primary text-[9px] font-black uppercase tracking-widest mb-1">{cat.tag}</span>
                                        <h3 className="text-base font-black uppercase tracking-tighter text-slate-900 transition-colors">{cat.title}</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 flex-1">
                                        {cat.items.map((item, j) => (
                                            <div key={j} className="space-y-3 group/item text-center">
                                                <div className="aspect-square bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden flex items-center justify-center p-3 group-hover/item:border-brand-primary transition-all group-hover/item:bg-white shadow-sm">
                                                    <img src={item.img} alt={item.name} className="max-w-full max-h-full object-contain group-hover/item:scale-110 transition-transform duration-500" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/item:text-slate-900 transition-colors">{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="mt-8 pt-6 border-t border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-900 group-hover:text-brand-primary flex items-center gap-2 transition-colors">
                                        Access Grid <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Horizontal Scroll Section - Master Inventory */}
                        <section className="bg-white mx-4 p-8 md:p-12 border border-slate-100 rounded-[2.5rem] shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/10">
                                        <TrendingUp className="text-brand-primary w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-brand-primary text-[10px] font-black uppercase tracking-[0.3em] mb-1">Global supply chain</span>
                                        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">
                                            {activeFilter === 'all' ? 'Master Inventory' :
                                                activeFilter === 'bestsellers' ? 'Peak Performance' :
                                                    activeFilter === 'newarrivals' ? 'Current Drops' :
                                                        'Express Logistics'}
                                        </h3>
                                    </div>
                                </div>
                                {activeFilter !== 'all' && (
                                    <button
                                        onClick={() => setActiveFilter('all')}
                                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary transition-all bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"
                                    >
                                        Reset Filter
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide px-2">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map(product => (
                                        <div key={product.id} onClick={() => setSelectedProductId(product.id)} className="min-w-[280px] max-w-[280px] flex flex-col gap-4 cursor-pointer group">
                                            <div className="aspect-square bg-slate-50 rounded-3xl flex items-center justify-center p-8 border border-slate-100 group-hover:border-brand-primary/30 group-hover:bg-white transition-all duration-500 shadow-sm relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700 relative z-10" />
                                                {product.isExpressDelivery && (
                                                    <div className="absolute top-4 right-4 bg-slate-900 border border-white/10 px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-xl">
                                                        <Zap className="w-3 h-3 text-brand-primary" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-white">Express</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-3 px-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{product.category || 'Hardware'}</span>
                                                    <h4 className="text-sm font-black text-slate-900 line-clamp-2 group-hover:text-brand-primary transition-colors leading-tight uppercase tracking-tight">{product.name}</h4>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex text-amber-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-3 h-3 fill-current ${i < Math.floor(product.rating) ? '' : 'text-slate-200'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">({product.reviews})</span>
                                                </div>
                                                <div className="flex items-baseline gap-1 pt-1">
                                                    <span className="text-xs font-black text-slate-900">$</span>
                                                    <span className="text-2xl font-black text-slate-900 tracking-tighter">{Math.floor(product.price)}</span>
                                                    <span className="text-[10px] font-black text-slate-500 align-top">.{(product.price % 1).toFixed(2).split('.')[1]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full py-20 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-100">
                                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">No matching inventory identified</span>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* AI Flavor Explorer - Amazon Style Integration */}
                        <div className="mx-4" id="flavor-explorer-section">
                            <FlavorExplorer />
                        </div>

                        {/* Recommendations Grid - Premium Cards */}
                        <section className="bg-white mx-4 p-10 border border-slate-100 rounded-[2.5rem] shadow-sm">
                            <div className="flex items-center justify-between mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                                        <Sparkles className="text-white w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-brand-primary text-[10px] font-black uppercase tracking-[0.3em] mb-1">Algorithmic Match</span>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                                            {activeFilter === 'all' ? 'Hardware Recommendations' : 'Related Inventory'}
                                        </h3>
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span className="hover:text-brand-primary cursor-pointer transition-colors">By Performance</span>
                                    <span className="hover:text-brand-primary cursor-pointer transition-colors">By Rating</span>
                                    <span className="hover:text-brand-primary cursor-pointer transition-colors">By Price</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
                                {filteredProducts.map(product => (
                                    <div key={product.id} onClick={() => setSelectedProductId(product.id)} className="flex flex-col gap-5 group cursor-pointer">
                                        <div className="aspect-square bg-slate-50 rounded-3xl p-8 relative overflow-hidden border border-slate-100 group-hover:bg-white group-hover:border-brand-primary/30 transition-all duration-500">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 relative z-10" />
                                            {product.isExpressDelivery && (
                                                <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-xl z-20">
                                                    <Zap className="w-3 h-3 text-brand-primary" />
                                                    <span className="text-white font-black text-[9px] uppercase tracking-widest">Express</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-4 px-1">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{product.category || 'Hardware'}</span>
                                                <h4 className="text-base font-black text-slate-900 line-clamp-2 group-hover:text-brand-primary transition-colors leading-tight uppercase tracking-tight">{product.name}</h4>
                                            </div>
                                            <div className="flex items-center justify-between pt-1">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xs font-black text-slate-900">$</span>
                                                    <span className="text-2xl font-black text-slate-900 tracking-tighter">{Math.floor(product.price)}</span>
                                                    <span className="text-[10px] font-black text-slate-500">.{(product.price % 1).toFixed(2).split('.')[1]}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex text-amber-400">
                                                        <Star className="w-3.5 h-3.5 fill-current" />
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{product.rating}</span>
                                                </div>
                                            </div>
                                            <button className="w-full py-3 bg-slate-100 hover:bg-slate-900 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 border border-slate-200 group-hover:border-slate-900">
                                                Analyze Module
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'marketplace' && selectedProductId && (
                    <ProductDetail
                        productId={selectedProductId}
                        onBack={() => setSelectedProductId(null)}
                        onAddToCart={addToCart}
                    />
                )}

                {activeTab === 'vendor' && (
                    <div className="p-6 space-y-8" ref={(el) => {
                        if (el && !botsLoading && !botInsights.review) loadVendorBots();
                        if (el && !statsLoading && !vendorStats) loadVendorStats();
                    }}>
                        <div className="bg-white p-8 md:p-10 premium-card flex flex-col md:flex-row items-center justify-between gap-8 border-b-8 border-brand-primary">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-900">Retailer OS</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Inventory Management & Intelligence Layer</p>
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <button
                                    onClick={requestNotificationPermission}
                                    className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-inner"
                                    title="Enable Push Notifications"
                                >
                                    <Bell className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={sendTestNotification}
                                    className="px-6 py-4 bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-[9px] rounded-2xl hover:bg-slate-900 hover:text-white transition-all"
                                >
                                    Logistics Test
                                </button>
                                <button
                                    className="px-8 py-4 bg-brand-primary text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex-1 md:flex-none"
                                    onClick={() => setShowVendorProductForm(true)}
                                >
                                    Initialize Product Node
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Cycle Velocity', value: `$${vendorStats?.todaySales?.toFixed(2) || '0.00'}`, change: 'Real-time Sales' },
                                { label: 'Active Pipeline', value: vendorStats?.openOrders || '0', change: 'Orders in fulfillment' },
                                { label: 'Critical Assets', value: vendorStats?.lowStockItems || '0', change: 'Restock required' },
                                { label: 'Total Volume', value: `$${vendorStats?.totalEarnings?.toLocaleString() || '0'}`, change: 'Lifetime Revenue' },
                            ].map((stat, i) => (
                                <div key={i} className="premium-card p-6 md:p-8 bg-white group hover:border-brand-primary transition-all">
                                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-4">{stat.label}</div>
                                    <div className="text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tighter">{stat.value}</div>
                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1 h-1 bg-brand-primary rounded-full animate-pulse" />
                                        {stat.change}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* VapesHub Intelligence Center - Multiple AI Bots */}
                        <div className="bg-white p-8 md:p-12 premium-card">
                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-primary/20 rotate-3">
                                    <Sparkles className="text-white w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">Intelligence Nexus</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Strategic AI Layer — Real-time Market Synthesis</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Review Analyst Bot */}
                                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6 group hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                                            <MessageSquare className="text-white w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-900">Sentiment Engine</h4>
                                            <span className="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em]">{botsLoading ? 'Syncing...' : 'Encrypted & Active'}</span>
                                        </div>
                                    </div>
                                    {botsLoading ? (
                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing...
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-5 border-l-2 border-slate-200 pl-4">{botInsights.review || 'Awaiting stream...'}</p>
                                    )}
                                </div>

                                {/* Inventory Analyst Bot */}
                                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6 group hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20 group-hover:scale-110 transition-transform">
                                            <Package className="text-white w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-900">Inventory Pulse</h4>
                                            <span className="text-[9px] text-brand-primary font-black uppercase tracking-[0.2em]">{botsLoading ? 'Optimizing...' : 'Live Ledger Active'}</span>
                                        </div>
                                    </div>
                                    {botsLoading ? (
                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Calculating...
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-5 border-l-2 border-slate-200 pl-4">{botInsights.inventory || 'Awaiting stream...'}</p>
                                    )}
                                </div>

                                {/* Market Trend Bot */}
                                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6 group hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 group-hover:-rotate-6 transition-transform">
                                            <TrendingUp className="text-brand-primary w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-900">Market Synthesis</h4>
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">{botsLoading ? 'Analyzing...' : 'External Data Linked'}</span>
                                        </div>
                                    </div>
                                    {botsLoading ? (
                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Fetching Trends...
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic line-clamp-5 border-l-2 border-slate-200 pl-4">{botInsights.trends || 'Awaiting stream...'}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-brand-secondary text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-2 text-center md:text-left">
                                    <h4 className="text-lg font-black uppercase tracking-widest">Ask VapesHub Intelligence</h4>
                                    <p className="text-sm text-gray-300">Get custom reports or business advice from our AI network.</p>
                                </div>
                                <form onSubmit={handleVendorAiQuery} className="flex w-full md:w-auto gap-3">
                                    <input
                                        type="text"
                                        value={vendorQuery}
                                        onChange={(e) => setVendorQuery(e.target.value)}
                                        placeholder="e.g. 'What should I restock this week?'"
                                        className="flex-1 md:w-80 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white/20"
                                    />
                                    <button type="submit" disabled={vendorAiLoading} className="bg-brand-primary text-white p-3 rounded-xl disabled:opacity-60">
                                        {vendorAiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
                                    </button>
                                </form>
                            </div>
                            {vendorAiResponse && (
                                <div className="mt-4 p-5 bg-gray-50 border border-gray-100 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">AI Response</p>
                                    <p className="text-sm text-gray-700 font-medium leading-relaxed">{vendorAiResponse}</p>
                                </div>
                            )}
                        </div>

                        {showVendorProductForm && currentUser && (
                            <VendorProductForm
                                token={localStorage.getItem('vapeshub_token') || ''}
                                onClose={() => setShowVendorProductForm(false)}
                                onSuccess={() => {
                                    setShowVendorProductForm(false);
                                    loadProducts(); // Refresh products
                                }}
                            />
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <VendorProductList token={localStorage.getItem('vapeshub_token') || ''} />
                            <VendorOrders token={localStorage.getItem('vapeshub_token') || ''} />
                        </div>

                        <div className="bg-white p-10 premium-card">
                            <div className="flex items-center gap-6 mb-10">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner">
                                    <Globe className="text-brand-primary w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Demand Heatmap</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Real-time Consumer Density Radar</p>
                                </div>
                            </div>
                            <div className="h-80 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 border border-slate-100 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />
                                <div className="text-center space-y-4 relative z-10 transition-transform group-hover:scale-110 duration-700">
                                    <div className="relative">
                                        <MapPin className="w-12 h-12 mx-auto text-brand-primary opacity-20" />
                                        <div className="absolute inset-0 w-12 h-12 mx-auto bg-brand-primary rounded-full animate-ping opacity-10" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Intelligence Node...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'admin' && (
                    <div className="p-4" ref={(el) => { if (el && !adminLoading && !adminStats) loadAdminStats(); }}>
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Global Analytics & Admin OS</h2>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Master Control Center — Restricted to Authorized Administrators</p>
                        </div>

                        <AdminDashboard token={localStorage.getItem('vapeshub_token') || ''} stats={adminStats} />
                    </div>
                )}
            </main>

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            className="fixed top-0 left-0 h-full w-full max-w-[320px] bg-slate-900 z-[101] flex flex-col shadow-2xl border-r border-white/5"
                        >
                            <div className="p-8 bg-slate-950 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                                        <UserIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">User Session</span>
                                        <span className="text-white font-black uppercase tracking-tight">{currentUser ? currentUser.name : 'Unauthenticated'}</span>
                                    </div>
                                </div>
                                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-10">
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">Navigation Nodes</h3>
                                    <ul className="space-y-5">
                                        <li className="flex items-center justify-between text-white font-black uppercase tracking-widest text-xs hover:text-brand-primary cursor-pointer transition-colors" onClick={() => { setActiveTab('marketplace'); setIsMenuOpen(false); }}>
                                            Master Inventory <ChevronRight className="w-4 h-4 text-slate-500" />
                                        </li>
                                        <li className="flex items-center justify-between text-white font-black uppercase tracking-widest text-xs hover:text-brand-primary cursor-pointer transition-colors" onClick={() => { setActiveTab('marketplace'); setActiveFilter('express'); setIsMenuOpen(false); }}>
                                            Express Logistics <ChevronRight className="w-4 h-4 text-slate-500" />
                                        </li>
                                        <li className="flex items-center justify-between text-white font-black uppercase tracking-widest text-xs hover:text-brand-primary cursor-pointer transition-colors" onClick={() => { scrollToFlavorExplorer(); setIsMenuOpen(false); }}>
                                            Flavor DNA Engine <ChevronRight className="w-4 h-4 text-slate-500" />
                                        </li>
                                    </ul>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">Operational Layers</h3>
                                    <ul className="space-y-5">
                                        <li className="text-white font-black uppercase tracking-widest text-xs hover:text-brand-primary cursor-pointer transition-colors">User Profile</li>
                                        <li onClick={() => { handleVendorTabClick(); setIsMenuOpen(false); }} className="text-brand-accent font-black uppercase tracking-widest text-xs hover:text-white cursor-pointer transition-colors flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
                                            Retailer OS
                                        </li>
                                        {currentUser?.role === 'admin' && (
                                            <li onClick={() => { setActiveTab('admin'); setIsMenuOpen(false); }} className="text-rose-400 font-black uppercase tracking-widest text-xs hover:text-white cursor-pointer transition-colors flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4" />
                                                Admin Layer
                                            </li>
                                        )}
                                        <li onClick={handleSignOut} className="text-slate-500 font-black uppercase tracking-widest text-xs hover:text-red-400 cursor-pointer transition-colors">Terminate Session</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="p-8 border-t border-white/5 bg-slate-950/50">
                                <div className="flex items-center gap-3">
                                    <Zap className="text-brand-primary w-5 h-5" />
                                    <span className="text-lg font-black tracking-tighter text-white uppercase italic">VapesHub<span className="text-brand-primary">.</span></span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Cart Drawer */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[101] flex flex-col shadow-2xl border-l border-slate-100"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex flex-col">
                                    <span className="text-brand-primary text-[10px] font-black uppercase tracking-[0.3em] mb-1">Manifest Ledger</span>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Your Hub Cart ({cart.length})</h2>
                                </div>
                                <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-200 rounded-2xl transition-all">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-slate-100">
                                            <ShoppingCart className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[11px]">Ledger Sync Null</p>
                                            <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Awaiting Module Acquisition</p>
                                        </div>
                                        <button
                                            onClick={() => setIsCartOpen(false)}
                                            className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-brand-primary transition-all shadow-xl shadow-slate-900/10"
                                        >
                                            Initialize Acquisition
                                        </button>
                                    </div>
                                ) : (
                                    // Group by product id to show quantity
                                    Object.entries(
                                        cart.reduce((acc: Record<number, { item: Product, indices: number[] }>, item, idx) => {
                                            if (!acc[item.id]) acc[item.id] = { item, indices: [] };
                                            acc[item.id].indices.push(idx);
                                            return acc;
                                        }, {})
                                    ).map(([, { item, indices }]) => (
                                        <div key={item.id} className="group relative flex gap-6 p-6 bg-white border border-slate-100 rounded-3xl hover:border-brand-primary/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-slate-900/5">
                                            <div className="w-24 h-24 bg-slate-50 rounded-2xl p-4 flex-shrink-0 border border-slate-50 group-hover:bg-white transition-colors">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div className="flex-1 space-y-3 min-w-0">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary mb-1">{item.brand}</span>
                                                    <h4 className="text-sm font-black text-slate-900 line-clamp-2 uppercase tracking-tight leading-tight">{item.name}</h4>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-xl font-black text-slate-900 tracking-tighter">${(item.price * indices.length).toFixed(2)}</div>
                                                    <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                                        <button onClick={() => removeFromCart(indices[0])} className="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-900 font-black flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm">−</button>
                                                        <span className="text-xs font-black w-4 text-center text-slate-900">{indices.length}</span>
                                                        <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-900 font-black flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm">+</button>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => indices.forEach(() => removeFromCart(cart.findIndex(c => c.id === item.id)))}
                                                    className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    Eject Module
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {cart.length > 0 && (
                                <div className="p-8 border-t border-slate-100 bg-slate-50/50 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ledger Aggregation</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-black text-slate-900">$</span>
                                            <span className="text-4xl font-black text-slate-900 tracking-tighter">{Math.floor(cart.reduce((acc, item) => acc + item.price, 0))}</span>
                                            <span className="text-base font-black text-slate-400">.{(cart.reduce((acc, item) => acc + item.price, 0) % 1).toFixed(2).split('.')[1]}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        className="w-full py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/20 hover:bg-brand-primary transition-all flex items-center justify-center gap-4 group"
                                    >
                                        <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        <span>Authorize Transaction</span>
                                    </button>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" />
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Biometric Age Verification Required</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Floating AI Chat - Bottom Right */}
            <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] flex flex-col items-end gap-5 pointer-events-none w-[calc(100vw-2rem)] md:w-auto">
                <AnimatePresence>
                    {aiChatOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="w-full md:w-[380px] h-[450px] md:h-[550px] bg-brand-secondary rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden pointer-events-auto"
                        >
                            <div className="bg-brand-secondary p-6 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                                        <Sparkles className="text-white w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-black uppercase tracking-tighter">VapeOS AI</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Neural Link Active</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setAiChatOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-brand-secondary/80">
                                {aiMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-black uppercase tracking-tight shadow-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-brand-primary text-white rounded-tr-none'
                                            : 'bg-white/10 text-slate-200 border border-white/5 rounded-tl-none'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleAiChat} className="p-6 bg-brand-secondary border-t border-white/5">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="Inquire module data..."
                                        className="flex-1 bg-white/10 border border-white/10 rounded-xl px-5 py-3 text-xs text-white focus:outline-none focus:border-brand-primary focus:bg-white/15 transition-all font-black uppercase tracking-widest placeholder:text-slate-400"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                    />
                                    <button type="submit" className="bg-brand-primary text-white p-3 rounded-xl shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all">
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Floating Toggle Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setAiChatOpen(!aiChatOpen)}
                    className="bg-brand-primary text-white p-5 md:p-6 rounded-[2rem] shadow-2xl shadow-brand-primary/40 pointer-events-auto flex items-center justify-center group relative border border-brand-primary-hover hover:bg-brand-primary-hover transition-all"
                >
                    {aiChatOpen ? <X className="w-6 h-6 md:w-7 md:h-7" /> : <MessageSquare className="w-6 h-6 md:w-7 md:h-7 text-white" />}
                    {!aiChatOpen && (
                        <div className="absolute right-full mr-6 py-3 px-5 bg-brand-secondary backdrop-blur-xl rounded-2xl border border-white/10 shadow-3xl opacity-0 group-hover:opacity-100 transition-all hidden md:flex items-center gap-3">
                            <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                            <span className="text-white text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Neural Link Standby</span>
                        </div>
                    )}
                </motion.button>
            </div>

            <footer className="bg-brand-secondary text-white mt-auto">
                {/* Return to Top */}
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="w-full py-6 bg-slate-800 hover:bg-slate-700 text-[11px] font-black uppercase tracking-[0.3em] transition-all border-b border-white/5"
                >
                    Return to Hub Origin
                </button>

                <div className="max-w-[1500px] mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary">Corporate Node</h4>
                        <ul className="space-y-4 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Careers')}>Hub Careers</li>
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Newsletter')}>Market Stream</li>
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Sustainability')}>Compliance Layer</li>
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Hardware Support')}>Press Assets</li>
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary">Retailer OS</h4>
                        <ul className="space-y-4 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Sell on Hub')}>Authorized Vendor</li>
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Fulfillment')}>Logistics Engine</li>
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Advertising')}>Market Dominance</li>
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Hub Global')}>Global Expansion</li>
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary">Payment Layer</h4>
                        <ul className="space-y-4 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Rewards Card')}>Hub Rewards Visa</li>
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Store Card')}>Corporate Ledger</li>
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Business Card')}>Terminal Access</li>
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Points Checkout')}>Point Conversion</li>
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary">Operations</h4>
                        <ul className="space-y-4 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Account Tracking')}>User Session</li>
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Order Tracking')}>Order Manifest</li>
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Shipping Info')}>Shipping Protocols</li>
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Returns Policy')}>RMA Procedures</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 py-16 flex flex-col items-center gap-8 bg-slate-950/50">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-primary/20 group-hover:rotate-12 transition-all">
                            <Zap className="text-white w-7 h-7" />
                        </div>
                        <span className="text-3xl font-black tracking-tighter uppercase italic">VapesHub<span className="text-brand-primary">.</span></span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                        <span className="hover:text-white cursor-pointer transition-colors">Compliance Standards</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Privacy Protocol</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Ad-Synthesis</span>
                    </div>
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">© 2026, VAPESHUB.COM — BIOMETRIC AGE VERIFICATION ENFORCED.</p>
                </div>
            </footer>

            {/* Duplicate AI trigger removed — handled by the floating chat widget above */}
        </div>
    );
}
