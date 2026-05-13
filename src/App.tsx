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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_CATALOG_IMAGE, resolveCatalogImage } from '../shared/product-images';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import CheckoutOverlay from './components/CheckoutOverlay';
import ProductDetail from './components/ProductDetail';
import VendorOrders from './components/VendorOrders';
import VendorProductForm from './components/VendorProductForm';
import VendorProductList from './components/VendorProductList';
import { HOMEPAGE_FALLBACK_GROUPS } from './data/fallback-products';
import AdminLeads from './pages/AdminLeads';
import Authenticity from './pages/Authenticity';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import HelpCenter from './pages/HelpCenter';
import OurStory from './pages/OurStory';
import Press from './pages/Press';
import ReturnsPolicy from './pages/ReturnsPolicy';
import ShippingPolicy from './pages/ShippingPolicy';
import ShopAll from './pages/ShopAll';
import PulseXSeries from './pages/shop/PulseXSeries';
import TheKits from './pages/shop/TheKits';
import TheOriginals from './pages/shop/TheOriginals';
import { getSmartAiResponse, SYSTEM_INSTRUCTIONS, vapeosAI } from './services/aiService';
import { addCartItemApi, fetchAdminStats, fetchCart, fetchCurrentUser, fetchHomepageMasterListings, fetchProducts, fetchVendorStats, removeCartItemApi, updateCartItemApi } from './services/api';
import { ParentVariantGroup, Product } from './types';

interface AuthUser {
    id: number;
    email: string;
    name: string;
    role: string;
    storeId?: number | null;
}

interface CheckoutSummary {
    orderId: number;
    total: number;
    deliveryFee: number;
    shippingAddress: string;
    customerEmail: string;
    items: Array<{ name: string; quantity: number; lineTotal: number }>;
}

type ProductFilter = 'all' | 'bestsellers' | 'newarrivals' | 'express';

interface ProductCardImageProps {
    imageUrl: string;
    productName: string;
    brand: string;
    category: string;
    flavor: string;
    isExpressDelivery: boolean;
    salePercent?: number;
}

interface MarketplaceProductCardProps {
    group: ParentVariantGroup;
    selectedVariant: Product;
    onOpenProduct: () => void;
    onSelectVariant: (variantId: number) => void;
    cardMode?: 'standard' | 'master';
}

interface FeatureBanner {
    brand: string;
    headlinePrefix: string;
    fallbackPrice: number;
    description: string;
    imageUrl: string;
    backgroundImageUrl: string;
    search?: string;
    category?: string;
}

interface MarketplaceEmptyStateProps {
    title: string;
    description: string;
    onReset: () => void;
}

interface CollectionMenuItem {
    id: string;
    label: string;
    onSelect: () => void;
}

const FALLBACK_DISCOUNT_PERCENT = {
    bestSeller: 17,
    newArrival: 15,
    expressDelivery: 12,
    standard: 10,
} as const;

interface ProductRouteParams {
    tag?: string;
    category?: string;
    search?: string;
    assistant?: 'flavor';
    quickDelivery?: boolean;
}

function toCategoryParam(category: string): string {
    return category.trim().toLowerCase();
}

function formatCategoryLabel(category: string): string {
    return category
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map((part) => part.split('-').filter(Boolean).map((segment) => `${segment[0].toUpperCase()}${segment.slice(1)}`).join('-'))
        .join(' ');
}

function buildProductsSearch(params?: ProductRouteParams): string {
    const query = new URLSearchParams();
    if (params?.tag) query.set('tag', params.tag);
    if (params?.category) query.set('category', toCategoryParam(params.category));
    if (params?.search) query.set('search', params.search);
    if (params?.assistant) query.set('assistant', params.assistant);
    if (params?.quickDelivery) query.set('quickDelivery', 'true');
    return query.toString();
}

function buildProductsUrl(params?: ProductRouteParams): string {
    const search = buildProductsSearch(params);
    return `/products${search ? `?${search}` : ''}`;
}

function buildProductDetailUrl(productId: number): string {
    return `/product/${productId}`;
}

function parseProductIdFromPath(pathname: string): number | null {
    const match = pathname.match(/^\/product\/(\d+)$/);
    if (!match) {
        return null;
    }

    const productId = Number(match[1]);
    return Number.isInteger(productId) && productId > 0 ? productId : null;
}

function normalizePathname(pathname: string): string {
    const normalized = pathname.replace(/\/+$/, '');
    return normalized || '/';
}

function seededUnitValue(seed: number): number {
    const normalizedSeed = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return normalizedSeed - Math.floor(normalizedSeed);
}

function getPlaceholderCardMetrics(productId: number): { rating: number; reviews: number } {
    const ratingSeed = seededUnitValue(productId + 17);
    const reviewsSeed = seededUnitValue(productId + 31);
    const rating = Number((4.2 + ratingSeed * 0.8).toFixed(1));
    const reviews = 12 + Math.floor(reviewsSeed * 37);

    return { rating, reviews };
}

function getFallbackHotDealPercent(productId: number): number {
    const dealOptions = [15, 17, 20];
    const seed = seededUnitValue(productId + 53);
    const index = Math.floor(seed * dealOptions.length) % dealOptions.length;
    return dealOptions[index];
}

function ProductCardImage({ imageUrl, productName, brand, category, flavor, isExpressDelivery, salePercent = 0 }: ProductCardImageProps) {
    const resolvedCatalogImage = useMemo(() => resolveCatalogImage({ image: imageUrl, name: productName, brand, category, flavor }), [imageUrl, productName, brand, category, flavor]);
    const [currentImageUrl, setCurrentImageUrl] = useState(resolvedCatalogImage);

    useEffect(() => {
        setCurrentImageUrl(resolvedCatalogImage);
    }, [resolvedCatalogImage]);

    return (
        <div className="relative isolate overflow-hidden rounded-[1.25rem] border border-[#ebedf0] bg-white shadow-sm">
            <div className="aspect-square flex items-center justify-center p-6">
                <img
                    src={currentImageUrl}
                    alt={productName}
                    loading="lazy"
                    onError={() => {
                        if (currentImageUrl !== resolvedCatalogImage) {
                            setCurrentImageUrl(resolvedCatalogImage);
                        } else if (currentImageUrl !== DEFAULT_CATALOG_IMAGE) {
                            setCurrentImageUrl(DEFAULT_CATALOG_IMAGE);
                        }
                    }}
                    className={`h-full w-full object-contain transition-transform duration-500 group-hover:scale-105 ${/^(hydroxie|blues)/i.test(brand) ? 'grayscale opacity-60' : ''}`}
                />
            </div>
            {salePercent > 0 && (
                <div className="absolute left-3 top-3 z-20 rounded-md bg-emerald-500 px-2.5 py-1 text-[10px] font-black text-white shadow-sm" aria-label={`Sale: ${salePercent}% off`}>
                    -{salePercent}%
                </div>
            )}
            {isExpressDelivery && (
                <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 shadow-sm">
                    <Zap className="w-3 h-3 text-[#4AB1F4]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-700">Express</span>
                </div>
            )}
            {/^(hydroxie|blues)/i.test(brand) && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-1.5 rounded-[1.25rem] bg-slate-900/60 backdrop-blur-[2px]">
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/90">Coming Soon</span>
                    <span className="text-[8px] font-semibold text-white/60">Image Placeholder</span>
                </div>
            )}
        </div>
    );
}

function getDisplayOriginalPrice(product: Product): number {
    if (typeof product.originalPrice === 'number' && product.originalPrice > product.price) {
        return Number(product.originalPrice.toFixed(2));
    }

    if (typeof product.discountPercentage === 'number' && product.discountPercentage > 0 && product.discountPercentage < 100) {
        return Number((product.price / (1 - product.discountPercentage / 100)).toFixed(2));
    }

    return Number((product.price * 1.2).toFixed(2));
}

function getSalePercentage(product: Product): number {
    if (typeof product.discountPercentage === 'number' && product.discountPercentage > 0) {
        return Math.round(product.discountPercentage);
    }

    if (typeof product.id === 'number') {
        return getFallbackHotDealPercent(product.id);
    }

    const originalPrice = getDisplayOriginalPrice(product);
    return Math.max(0, Math.round(((originalPrice - product.price) / originalPrice) * 100));
}

function isHighDemandProduct(product: Product): boolean {
    return Boolean(product.isBestSeller || product.isNewArrival || product.stockQty <= 150);
}

function MarketplaceProductCard({ group, selectedVariant, onOpenProduct, onSelectVariant, cardMode = 'standard' }: MarketplaceProductCardProps) {
    const originalPrice = getDisplayOriginalPrice(selectedVariant);
    const salePercentage = getSalePercentage(selectedVariant);
    const categoryLabel = (selectedVariant.category || group.category || 'Vapes').trim().toUpperCase();
    const placeholderMetrics = getPlaceholderCardMetrics(selectedVariant.id);
    const lowestPrice = Math.min(...group.variants.map((variant) => variant.price));
    const isMasterCard = cardMode === 'master';

    return (
        <article
            onClick={onOpenProduct}
            className="group flex min-h-full cursor-pointer flex-col gap-4 rounded-[1.5rem] border border-[#e8ebef] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)]"
        >
            <ProductCardImage
                imageUrl={selectedVariant.image}
                productName={group.parentName}
                brand={group.brand}
                category={group.category}
                flavor={selectedVariant.flavor}
                isExpressDelivery={selectedVariant.isExpressDelivery}
                salePercent={salePercentage}
            />

            <div className="flex min-h-[250px] flex-col gap-4">
                <div className="space-y-2">
                    <p className="line-clamp-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{categoryLabel}</p>
                    <h4 className="line-clamp-2 text-base font-bold leading-6 text-slate-950">{group.parentName}</h4>
                    {isMasterCard && (
                        <p className="text-[11px] font-semibold text-slate-500">{group.variants.length} Flavors available</p>
                    )}
                    {isHighDemandProduct(selectedVariant) && (
                        <span className="juicefly-stock-pill" role="status" aria-live="polite">Limited Stock!</span>
                    )}
                </div>

                {!isMasterCard && group.variants.length > 1 && (
                    <div className="flex min-h-[44px] items-center gap-2 overflow-x-auto pr-1 scrollbar-hide">
                        {group.variants.map((variant) => {
                            const isSelected = variant.id === selectedVariant.id;
                            return (
                                <button
                                    key={variant.id}
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onSelectVariant(variant.id);
                                    }}
                                    className={`shrink-0 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] transition-all ${isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-[#4AB1F4] hover:text-[#4AB1F4]'}`}
                                >
                                    {variant.flavor}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <div className="flex text-[#FFA41C]" aria-label={`Rated ${placeholderMetrics.rating} out of 5 stars`}>
                        {[...Array(5)].map((_, index) => (
                            <Star
                                key={index}
                                aria-hidden="true"
                                className={`h-3.5 w-3.5 fill-current ${index < Math.round(placeholderMetrics.rating) ? '' : 'text-slate-200'}`}
                            />
                        ))}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">({placeholderMetrics.reviews})</span>
                </div>

                <div className="flex items-baseline gap-2.5">
                    {isMasterCard ? (
                        <span className="text-2xl font-black tracking-tight text-[#4AB1F4]">From ${lowestPrice.toFixed(2)}</span>
                    ) : (
                        <>
                            <span className="text-sm font-semibold text-slate-400 line-through">${originalPrice.toFixed(2)}</span>
                            <span className="text-2xl font-black tracking-tight text-[#4AB1F4]">${selectedVariant.price.toFixed(2)}</span>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpenProduct();
                    }}
                    className="juicefly-action-button mt-auto w-full justify-center"
                >
                    Select Option
                </button>
            </div>
        </article>
    );
}

const FEATURE_BANNERS: readonly FeatureBanner[] = [
    {
        brand: 'Geek Bar',
        headlinePrefix: 'Geek Bar from',
        fallbackPrice: 21.9,
        description: 'Layered mint, candy, and citrus profiles with a premium disposable finish.',
        imageUrl: '/images/geek-bar-pulse-x-25000-clear.jpg',
        backgroundImageUrl: '/images/geek-bar-pulse-x-25000-clear.jpg',
        search: 'Geekbar Pulse X',
    },
    {
        brand: 'Flum',
        headlinePrefix: 'Flum from',
        fallbackPrice: 19.92,
        description: 'Bright, fruit-forward all-day picks with the soft silhouette customers recognize.',
        imageUrl: '/images/devices/elf-bar-bc5000.png',
        backgroundImageUrl: '/images/devices/elf-bar-bc5000.png',
        search: 'Flum Mello',
    },
    {
        brand: 'RAZ',
        headlinePrefix: 'RAZ from',
        fallbackPrice: 22.5,
        description: 'A moody, modern disposable edit styled for high-conversion deal framing.',
        imageUrl: '/images/devices/pngtree-a-sleek-vaping-device-with-transparent-tank-glowing-orange-light-and-png-image_15912369.png',
        backgroundImageUrl: '/images/devices/geekvape-aegis-legend.jpg',
        category: 'Disposables',
    },
] as const;

function MarketplaceEmptyState({ title, description, onReset }: MarketplaceEmptyStateProps) {
    return (
        <div className="w-full py-20 flex flex-col items-center justify-center gap-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 px-6">
            <img src="/logo.png" alt="Banana Leaf Store" className="h-16 w-auto opacity-40" />
            <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-primary">Coming Soon</p>
                <p className="text-xl font-black uppercase tracking-tighter text-slate-900">{title}</p>
                <p className="text-xs font-medium text-slate-400 max-w-sm mx-auto">{description}</p>
            </div>
            <button
                onClick={onReset}
                className="px-6 py-3 bg-brand-secondary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-primary transition-all"
            >
                Browse All Inventory
            </button>
        </div>
    );
}

// ─── Fallback mock data moved to src/data/fallback-products.ts ───────────────

const HOMEPAGE_FAQS = [
    {
        q: 'How long does shipping take?',
        a: 'Orders placed before 3PM on business days ship the same day. Standard delivery is 3–5 business days. Express delivery options are available at checkout for 1–2 business day service.',
    },
    {
        q: 'Are your products authentic?',
        a: 'Every product in our catalogue is sourced directly from authorised distributors. We never stock counterfeits — each brand and batch is verified before it goes live on our platform.',
    },
    {
        q: 'What is your return policy?',
        a: 'We accept returns within 7 days of delivery for unopened, undamaged items. If you received a defective or incorrect product, we will replace it or issue a full refund immediately.',
    },
    {
        q: 'Do you verify age before selling?',
        a: 'Yes — age verification is a mandatory step during checkout. You must be 21 or older to purchase nicotine products. We take compliance seriously and reserve the right to cancel any order that fails verification.',
    },
    {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex) as well as digital wallets. All transactions are encrypted and processed securely via our payment processor.',
    },
    {
        q: 'Do you ship internationally?',
        a: 'Currently we ship within the United States only. International shipping is on our roadmap — sign up to our newsletter to be notified when your region becomes available.',
    },
];

export default function App() {
    const location = useLocation();
    const currentPath = normalizePathname(location.pathname);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'marketplace' | 'vendor' | 'admin'>('marketplace');
    const [products, setProducts] = useState<Product[]>([]);
    const [homepageGridGroups, setHomepageGridGroups] = useState<ParentVariantGroup[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [homepageGridLoading, setHomepageGridLoading] = useState(true);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCollectionMenuOpen, setIsCollectionMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [showCheckoutOverlay, setShowCheckoutOverlay] = useState(false);
    const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummary | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [aiChatOpen, setAiChatOpen] = useState(false);
    const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<ProductFilter>('all');
    const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
    const [pendingScrollTarget, setPendingScrollTarget] = useState<string | null>(null);
    const [selectedVariantByGroup, setSelectedVariantByGroup] = useState<Record<string, number>>({});
    const [authChecked, setAuthChecked] = useState(false);
    const mapTagToFilter = useCallback((tag: string | null): ProductFilter => {
        if (!tag || !tag.trim()) return 'all';
        const normalizedTag = tag.trim().toLowerCase();

        if (normalizedTag === 'bestseller' || normalizedTag === 'bestsellers' || normalizedTag === 'peak-performance') {
            return 'bestsellers';
        }
        if (normalizedTag === 'newarrival' || normalizedTag === 'newarrivals' || normalizedTag === 'current-drops') {
            return 'newarrivals';
        }
        if (normalizedTag === 'express' || normalizedTag === 'quick-delivery') {
            return 'express';
        }
        return 'all';
    }, []);

    const applyMarketplaceStateFromUrl = useCallback((params: URLSearchParams) => {
        const filterFromQuery = params.get('filter') as ProductFilter | null;
        const tag = params.get('tag');
        const categoryParam = params.get('category');
        const category = categoryParam ? formatCategoryLabel(categoryParam) : undefined;
        const search = params.get('search') || '';
        const quickDelivery = params.get('quickDelivery') === 'true';
        const assistant = params.get('assistant');

        const mappedFilter = filterFromQuery && ['all', 'bestsellers', 'newarrivals', 'express'].includes(filterFromQuery)
            ? filterFromQuery
            : mapTagToFilter(tag);

        const resolvedFilter = quickDelivery ? 'express' : mappedFilter;

        setActiveTab('marketplace');
        setSelectedProductId(null);
        setActiveFilter(resolvedFilter);
        setActiveCategory(category);
        setSearchQuery(search);

        if (assistant === 'flavor') {
            setAiChatOpen(true);
            setAiMessages((prev) => {
                if (prev.length > 0) return prev;
                return [{ role: 'ai', text: "Hey! I'm Banana Leaf AI — tell me what flavors you usually like and I'll recommend your best match." }];
            });
        }

        if (resolvedFilter === 'express') {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const logisticsSection = document.getElementById('shipping-logistics-section');
                    if (logisticsSection) {
                        const offset = 100;
                        const sectionPosition = logisticsSection.getBoundingClientRect().top + window.pageYOffset - offset;
                        window.scrollTo({ top: sectionPosition, behavior: 'smooth' });
                    }
                });
            });
        }
    }, [mapTagToFilter]);

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
    const desktopCollectionMenuRef = useRef<HTMLDivElement | null>(null);

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
            fetchCurrentUser(token)
                .then(user => {
                    if (user) {
                        setCurrentUser(user);
                    } else {
                        localStorage.removeItem('vapeshub_token');
                    }
                })
                .catch(() => {
                    localStorage.removeItem('vapeshub_token');
                })
                .finally(() => {
                    setAuthChecked(true);
                });
            return;
        }

        setAuthChecked(true);
    }, []);

    useEffect(() => {
        if (location.pathname === '/products') {
            applyMarketplaceStateFromUrl(searchParams);
        }
    }, [applyMarketplaceStateFromUrl, location.pathname, searchParams]);

    useEffect(() => {
        setShowCheckoutOverlay(location.pathname === '/checkout');
    }, [location.pathname]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [location.pathname]);

    useEffect(() => {
        if (location.pathname !== '/dashboard' || !authChecked) {
            return;
        }

        if (!currentUser) {
            setShowAuthModal(true);
            navigate('/products', { replace: true });
        }
    }, [authChecked, currentUser, location.pathname, navigate]);

    useEffect(() => {
        if (location.pathname !== '/admin/leads' || !authChecked) {
            return;
        }

        if (!currentUser || currentUser.role !== 'admin') {
            navigate('/products', { replace: true });
        }
    }, [authChecked, currentUser, location.pathname, navigate]);

    useEffect(() => {
        const routedProductId = parseProductIdFromPath(location.pathname);

        if (routedProductId !== null) {
            setActiveTab('marketplace');
            setSelectedProductId(routedProductId);
            return;
        }

        if (location.pathname === '/products') {
            setSelectedProductId(null);
        }
    }, [location.pathname]);

    useEffect(() => {
        if (!isCollectionMenuOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            const isInsideDesktopMenu = desktopCollectionMenuRef.current?.contains(target);

            if (!isInsideDesktopMenu) {
                setIsCollectionMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsCollectionMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isCollectionMenuOpen]);

    useEffect(() => {
        if (isMenuOpen) {
            setIsMobileSearchOpen(false);
        }
    }, [isMenuOpen]);

    useEffect(() => {
        if (activeTab !== 'marketplace' || location.pathname !== '/products') {
            return;
        }

        const params = new URLSearchParams();
        if (activeFilter !== 'all') params.set('filter', activeFilter);
        if (activeCategory) params.set('category', toCategoryParam(activeCategory));
        if (searchQuery.trim()) params.set('search', searchQuery.trim());

        const targetUrl = `/products${params.toString() ? `?${params.toString()}` : ''}`;
        const currentUrl = `${location.pathname}${location.search}`;

        if (targetUrl !== currentUrl) {
            navigate(targetUrl, { replace: true });
        }
    }, [activeTab, activeFilter, activeCategory, location.pathname, location.search, navigate, searchQuery]);

    // ── Products: fetch from API ───────────────────────────────────────
    const loadProducts = useCallback(async () => {
        setProductsLoading(true);
        try {
            const data = await fetchProducts({ filter: activeFilter, search: searchQuery, category: activeCategory });
            setProducts(data);
        } finally {
            setProductsLoading(false);
        }
    }, [activeFilter, searchQuery, activeCategory]);

    useEffect(() => {
        const debounce = setTimeout(loadProducts, 300);
        return () => clearTimeout(debounce);
    }, [loadProducts]);

    useEffect(() => {
        let isCancelled = false;

        const loadHomepageGridProducts = async () => {
            setHomepageGridLoading(true);
            try {
                const data = await fetchHomepageMasterListings(8);
                if (!isCancelled) {
                    setHomepageGridGroups(data.length > 0 ? data : HOMEPAGE_FALLBACK_GROUPS);
                }
            } catch {
                if (!isCancelled) {
                    setHomepageGridGroups(HOMEPAGE_FALLBACK_GROUPS);
                }
            } finally {
                if (!isCancelled) {
                    setHomepageGridLoading(false);
                }
            }
        };

        loadHomepageGridProducts();

        return () => {
            isCancelled = true;
        };
    }, []);

    useEffect(() => {
        // AI Pop-up after 5s — only once per browser session (survives refresh, clears on tab close)
        // Flag is set immediately so a re-render/StrictMode double-invoke never queues a second popup
        if (sessionStorage.getItem('chatPopupShown')) return;
        sessionStorage.setItem('chatPopupShown', 'true');
        const timer = setTimeout(() => {
            setAiChatOpen(true);
            setAiMessages((prev) => {
                if (prev.length > 0) return prev;
                return [{ role: 'ai', text: "Hey! I'm Banana Leaf AI — tell me what you're looking for and I'll find the perfect match! 🌿" }];
            });
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    // ── PWA: Service Worker Registration ──────────────────────────────
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            const isLocalDevelopment = window.location.hostname === 'localhost'
                || window.location.hostname === '127.0.0.1';

            if (isLocalDevelopment) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    registrations.forEach((registration) => {
                        registration.unregister().catch(() => { });
                    });
                });

                if ('caches' in window) {
                    caches.keys().then((cacheNames) => {
                        cacheNames.forEach((cacheName) => {
                            caches.delete(cacheName).catch(() => { });
                        });
                    });
                }

                return;
            }

            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(registrationError => {
                    console.error('Service worker registration failed:', registrationError);
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
                registration.showNotification('Banana Leaf Store Live Alert', {
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
        setIsCartOpen(true);
        const token = localStorage.getItem('vapeshub_token');
        if (token && product.id) {
            addCartItemApi(token, product.id, quantity).catch(() => { });
        }
    };

    const removeFromCart = (index: number) => {
        const removedProduct = cart[index];
        setCart(prev => {
            const next = prev.filter((_, i) => i !== index);
            const token = localStorage.getItem('vapeshub_token');
            if (token && removedProduct) {
                const remaining = next.filter(p => p.id === removedProduct.id).length;
                if (remaining === 0) {
                    removeCartItemApi(token, removedProduct.id).catch(() => { });
                } else {
                    updateCartItemApi(token, removedProduct.id, remaining).catch(() => { });
                }
            }
            return next;
        });
    };

    const updateQty = (index: number, delta: number) => {
        const product = cart[index];
        setCart(prev => {
            const updated = [...prev];
            if (delta < 0) { updated.splice(index, 1); } else { updated.splice(index + 1, 0, updated[index]); }
            const token = localStorage.getItem('vapeshub_token');
            if (token && product) {
                const newQty = updated.filter(p => p.id === product.id).length;
                if (newQty <= 0) {
                    removeCartItemApi(token, product.id).catch(() => { });
                } else {
                    updateCartItemApi(token, product.id, newQty).catch(() => { });
                }
            }
            return updated;
        });
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            toast.error('Your cart is empty');
            return;
        }
        setIsCartOpen(false);
        navigate('/checkout');
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
        setIsCollectionMenuOpen(false);
    };

    const handleProfileNavigation = () => {
        if (!currentUser) {
            setShowAuthModal(true);
            return;
        }

        if (currentUser.role === 'admin') {
            setActiveTab('admin');
        } else if (currentUser.role === 'vendor') {
            setActiveTab('vendor');
        } else {
            setActiveTab('marketplace');
        }

        setSelectedProductId(null);
        setIsMenuOpen(false);
        setIsCollectionMenuOpen(false);
    };

    const handleProtectedDashboardLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (!currentUser) {
            event.preventDefault();
            toast('Please sign in to access your dashboard.', { icon: '🔒' });
            setShowAuthModal(true);
            return;
        }

        setIsMenuOpen(false);
        setIsCollectionMenuOpen(false);
    };

    const handleSessionAccessClick = () => {
        if (currentUser) {
            handleSignOut();
            return;
        }

        setShowAuthModal(true);
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
        try {
            const response = await vapeosAI.generateResponse(userMsg, SYSTEM_INSTRUCTIONS.FLAVOR_EXPERT);
            setAiMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: 'ai', text: response || getSmartAiResponse(userMsg, SYSTEM_INSTRUCTIONS.FLAVOR_EXPERT) };
                return next;
            });
        } catch (error) {
            console.error('Flavor chat fallback engaged:', error);
            setAiMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: 'ai', text: getSmartAiResponse(userMsg, SYSTEM_INSTRUCTIONS.FLAVOR_EXPERT) };
                return next;
            });
        }
    };

    const scrollToSection = useCallback((sectionId: string) => {
        const target = document.getElementById(sectionId);
        if (!target) return;

        const offset = 100;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }, []);

    const focusMarketplaceSection = useCallback((options: { filter: ProductFilter; sectionId: string; openAssistant?: boolean; category?: string; search?: string }) => {
        setActiveTab('marketplace');
        setSelectedProductId(null);
        setActiveFilter(options.filter);
        setActiveCategory(options.category);
        setSearchQuery(options.search ?? '');
        setPendingScrollTarget(options.sectionId);
        setIsCollectionMenuOpen(false);

        const nextUrl = buildProductsUrl({
            category: options.category,
            search: options.search,
            tag: options.filter !== 'all' ? options.filter : undefined,
        });
        const currentUrl = `${location.pathname}${location.search}`;
        if (nextUrl !== currentUrl) {
            navigate(nextUrl);
        }

        if (options.openAssistant) {
            setAiChatOpen(true);
        }
    }, [location.pathname, location.search, navigate]);

    const resetMarketplaceFilters = useCallback(() => {
        setActiveFilter('all');
        setActiveCategory(undefined);
        setSearchQuery('');
        setPendingScrollTarget('inventory-stream-section');
        navigate('/products');
    }, [navigate]);

    const emptyStateTitle = activeCategory
        ? `${activeCategory} Collection`
        : searchQuery.trim()
            ? `No Results For ${searchQuery.trim()}`
            : 'Collection Update In Progress';

    const emptyStateDescription = activeCategory
        ? `The Banana Leaf collection for ${activeCategory} is currently being curated. Check back soon for premium drops.`
        : searchQuery.trim()
            ? `The Banana Leaf collection matching ${searchQuery.trim()} is currently being curated. Check back soon for premium drops.`
            : 'The Banana Leaf collection is currently being curated. Check back soon for premium drops.';

    const isContentPage = [
        '/about/our-story',
        '/about/authenticity',
        '/about/press',
        '/support/help-center',
        '/support/shipping',
        '/support/returns',
        '/support/contact',
        '/shop',
        '/shop/pulse-x-series',
        '/shop/the-kits',
        '/shop/the-originals',
        '/admin/leads',
    ].includes(currentPath);

    const isDashboardPage = currentPath === '/dashboard';

    const featureBannerPrices = useMemo(() => {
        const pricesByBrand: Record<string, number> = {};

        for (const group of homepageGridGroups) {
            const lowestPrice = Math.min(...group.variants.map((variant) => variant.price));
            const brandKey = group.brand.trim().toLowerCase();
            const existingPrice = pricesByBrand[brandKey];
            if (existingPrice === undefined || lowestPrice < existingPrice) {
                pricesByBrand[brandKey] = lowestPrice;
            }
        }

        return pricesByBrand;
    }, [homepageGridGroups]);

    const getFeatureBannerHeadline = useCallback((banner: FeatureBanner) => {
        const livePrice = featureBannerPrices[banner.brand.trim().toLowerCase()];
        const resolvedPrice = typeof livePrice === 'number' ? livePrice : banner.fallbackPrice;
        return `${banner.headlinePrefix} $${resolvedPrice.toFixed(2)}`;
    }, [featureBannerPrices]);

    useEffect(() => {
        if (!pendingScrollTarget) {
            return;
        }

        let isCancelled = false;
        let attempts = 0;
        let timeoutId: number | undefined;

        const attemptScroll = () => {
            if (isCancelled) {
                return;
            }

            if (activeTab !== 'marketplace' || selectedProductId !== null) {
                if (attempts >= 20) {
                    setPendingScrollTarget(null);
                    return;
                }
                attempts += 1;
                timeoutId = window.setTimeout(attemptScroll, 80);
                return;
            }

            const target = document.getElementById(pendingScrollTarget);
            if (target) {
                scrollToSection(pendingScrollTarget);
                setPendingScrollTarget(null);
                return;
            }

            if (attempts >= 20) {
                setPendingScrollTarget(null);
                return;
            }

            attempts += 1;
            timeoutId = window.setTimeout(attemptScroll, 80);
        };

        timeoutId = window.setTimeout(attemptScroll, 0);

        return () => {
            isCancelled = true;
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [pendingScrollTarget, activeTab, selectedProductId, scrollToSection]);

    const scrollToFlavorExplorer = useCallback(() => {
        focusMarketplaceSection({
            filter: activeFilter,
            sectionId: 'inventory-stream-section',
        });
    }, [activeFilter, focusMarketplaceSection]);

    const collectionMenuItems = useMemo<CollectionMenuItem[]>(() => ([
        {
            id: 'all-inventory',
            label: 'All Inventory',
            onSelect: () => navigate('/shop'),
        },
        {
            id: 'shop-the-collection',
            label: 'Shop The Collection',
            onSelect: () => focusMarketplaceSection({ filter: 'all', sectionId: 'brand-showcase-section' }),
        },
        {
            id: 'pulse-x-series',
            label: 'Pulse X Series',
            onSelect: () => navigate('/shop/pulse-x-series'),
        },
        {
            id: 'start-your-session',
            label: 'Start Your Session',
            onSelect: scrollToFlavorExplorer,
        },
        {
            id: 'seamless-delivery',
            label: 'Seamless Delivery',
            onSelect: () => focusMarketplaceSection({ filter: 'express', sectionId: 'shipping-logistics-section' }),
        },
    ]), [focusMarketplaceSection, navigate, scrollToFlavorExplorer]);

    const handleCollectionMenuSelect = useCallback((item: CollectionMenuItem, surface: 'desktop' | 'mobile') => {
        item.onSelect();
        if (surface === 'desktop') {
            setIsCollectionMenuOpen(false);
            return;
        }
        setIsMenuOpen(false);
    }, []);

    // Server-side filtering — products are already filtered, just use them directly
    const filteredProducts = products;

    const categoryOrder = useMemo(() => ['Disposables', 'Nicotine Pouches', 'Supplements', 'Pod Systems', 'Devices', 'Mods', 'Accessories', 'Glass', 'E-Liquids', 'Nic Salts'], []);

    const sortedFilteredProducts = useMemo(() => {
        const orderIndex = new Map(categoryOrder.map((cat, i) => [cat.toLowerCase(), i]));
        return [...filteredProducts].sort((a, b) => {
            const ra = orderIndex.get((a.category || '').toLowerCase()) ?? 999;
            const rb = orderIndex.get((b.category || '').toLowerCase()) ?? 999;
            return ra !== rb ? ra - rb : a.name.localeCompare(b.name);
        });
    }, [filteredProducts, categoryOrder]);

    const parentVariantGroups = useMemo(() => {
        const groups = new Map<string, ParentVariantGroup>();

        for (const product of sortedFilteredProducts) {
            const category = product.category || 'Uncategorized';
            const parentName = product.name.split(' - ')[0]?.trim() || product.brand || product.name;
            const key = `${category.toLowerCase()}::${(product.brand || 'unknown').toLowerCase()}::${parentName.toLowerCase()}`;
            const existingGroup = groups.get(key);

            if (!existingGroup) {
                groups.set(key, {
                    key,
                    parentName,
                    brand: product.brand,
                    category,
                    variants: [product],
                });
                continue;
            }

            existingGroup.variants.push(product);
        }

        const orderIndex = new Map(categoryOrder.map((cat, i) => [cat.toLowerCase(), i]));

        return Array.from(groups.values())
            .map((group) => ({
                ...group,
                variants: [...group.variants].sort((a, b) => a.flavor.localeCompare(b.flavor)),
            }))
            .sort((a, b) => {
                const aRank = orderIndex.get(a.category.toLowerCase()) ?? 999;
                const bRank = orderIndex.get(b.category.toLowerCase()) ?? 999;
                return aRank !== bRank ? aRank - bRank : a.parentName.localeCompare(b.parentName);
            });
    }, [sortedFilteredProducts, categoryOrder]);

    useEffect(() => {
        setSelectedVariantByGroup((prev) => {
            if (parentVariantGroups.length === 0) {
                return Object.keys(prev).length === 0 ? prev : {};
            }

            const next: Record<string, number> = {};

            for (const group of parentVariantGroups) {
                const selectedId = prev[group.key];
                const selectedVariant = group.variants.find((variant) => variant.id === selectedId);
                next[group.key] = selectedVariant?.id ?? group.variants[0].id;
            }

            const prevKeys = Object.keys(prev);
            const nextKeys = Object.keys(next);
            if (prevKeys.length !== nextKeys.length) {
                return next;
            }

            for (const key of nextKeys) {
                if (prev[key] !== next[key]) {
                    return next;
                }
            }

            return prev;
        });
    }, [parentVariantGroups]);

    const getSelectedVariant = useCallback((group: ParentVariantGroup) => {
        const selectedId = selectedVariantByGroup[group.key];
        return group.variants.find((variant) => variant.id === selectedId) ?? group.variants[0];
    }, [selectedVariantByGroup]);

    const handleProductDetailVariantChange = useCallback((groupKey: string, variantId: number) => {
        setSelectedProductId(variantId);
        setSelectedVariantByGroup((prev) => {
            if (prev[groupKey] === variantId) {
                return prev;
            }

            return {
                ...prev,
                [groupKey]: variantId,
            };
        });
    }, []);

    const selectedProductGroup = useMemo(() => {
        if (selectedProductId === null) {
            return null;
        }

        return parentVariantGroups.find((group) => group.variants.some((variant) => variant.id === selectedProductId))
            ?? homepageGridGroups.find((group) => group.variants.some((variant) => variant.id === selectedProductId))
            ?? null;
    }, [parentVariantGroups, homepageGridGroups, selectedProductId]);

    const openProductDetailPage = useCallback((productId: number) => {
        setSelectedProductId(productId);
        navigate(buildProductDetailUrl(productId));
    }, [navigate]);

    const shouldShowProductsLoading = productsLoading;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
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
                        onAuthSuccess={async (user, token) => {
                            setCurrentUser(user);
                            localStorage.setItem('vapeshub_token', token);

                            // Gateway routing based on user role
                            if (user.role === 'admin' || user.role === 'super_admin') {
                                setActiveTab('admin');
                            } else {
                                // Push any pre-login local cart items to the DB, then sync
                                const localCart = cart;
                                const byProductId = new Map<number, number>();
                                for (const item of localCart) {
                                    byProductId.set(item.id, (byProductId.get(item.id) || 0) + 1);
                                }
                                await Promise.all(
                                    Array.from(byProductId.entries()).map(([pid, qty]) =>
                                        addCartItemApi(token, pid, qty).catch(() => { })
                                    )
                                );
                                const dbItems = await fetchCart(token);
                                const expanded: Product[] = [];
                                for (const item of dbItems) {
                                    for (let i = 0; i < item.quantity; i++) expanded.push(item.product);
                                }
                                setCart(expanded);
                                setActiveTab('marketplace');
                            }
                        }}
                    />
                )}
            </AnimatePresence>
            {/* Checkout Overlay */}
            <AnimatePresence>
                {showCheckoutOverlay && (
                    <CheckoutOverlay
                        cart={cart}
                        token={localStorage.getItem('vapeshub_token')}
                        currentUser={currentUser}
                        onAuthSuccess={(user, token) => {
                            setCurrentUser(user);
                            localStorage.setItem('vapeshub_token', token);
                        }}
                        onClose={() => navigate('/products')}
                        onOrderComplete={(summary) => {
                            setCheckoutSummary(summary);
                            navigate('/checkout/success');
                        }}
                        onSuccess={() => {
                            setCart([]);
                        }}
                    />
                )}
            </AnimatePresence>
            {/* Premium Top Nav */}
            <header className="w-full bg-[#f8f9fa] md:bg-white/95 border-b border-slate-200/80 text-slate-900 sticky top-0 z-50 backdrop-blur-xl">
                <div className="max-w-[1500px] mx-auto w-full px-0 md:px-6 md:h-24 md:flex md:items-center md:gap-8">
                    <div className="md:hidden mx-3 my-2 rounded-full bg-white shadow-lg px-4 py-3">
                        <div className="relative flex items-center">
                            {/* LEFT — Hamburger anchor */}
                            <div className="flex items-center flex-1 justify-start">
                                <button
                                    type="button"
                                    className="flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm active:scale-95 transition-all"
                                    onClick={() => setIsMenuOpen(true)}
                                    aria-label="Open menu"
                                >
                                    <Menu className="w-4 h-4" />
                                </button>
                            </div>

                            {/* CENTER — Logo (absolutely centered) */}
                            <div
                                onClick={() => {
                                    setActiveTab('marketplace');
                                    setSelectedProductId(null);
                                    setSearchQuery('');
                                    navigate('/products');
                                }}
                                className="absolute left-1/2 -translate-x-1/2 flex items-center cursor-pointer group"
                            >
                                <img
                                    src="/logo.png"
                                    alt="Banana Leaf Store"
                                    className="h-48 w-auto object-contain"
                                    onError={(e) => {
                                        const img = e.currentTarget;
                                        img.style.display = 'none';
                                        const fallback = img.nextElementSibling as HTMLElement | null;
                                        if (fallback) fallback.style.display = 'flex';
                                    }}
                                />
                                <div className="hidden flex-col">
                                    <span className="text-xl font-black tracking-tighter uppercase italic leading-none">Banana Leaf<span className="text-brand-primary">.</span></span>
                                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Store</span>
                                </div>
                            </div>

                            {/* RIGHT — Search + Cart anchors */}
                            <div className="flex items-center gap-2 flex-1 justify-end">
                                <button
                                    type="button"
                                    className="flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm active:scale-95 transition-all"
                                    onClick={() => setIsMobileSearchOpen((prev) => !prev)}
                                    aria-expanded={isMobileSearchOpen}
                                    aria-label="Toggle search"
                                >
                                    <Search className="w-4 h-4" />
                                </button>

                                <button
                                    type="button"
                                    className="relative bg-slate-900 p-2.5 rounded-full shadow-xl shadow-slate-900/10 hover:bg-brand-primary transition-all duration-300"
                                    onClick={() => setIsCartOpen(true)}
                                    aria-label="Open cart"
                                >
                                    <ShoppingCart className="w-5 h-5 text-white" />
                                    <span className="absolute -top-1 -right-1 bg-brand-primary text-slate-900 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-white transition-all">{cart.length}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex w-full h-16 sm:h-20 md:h-24 items-center gap-3 md:gap-8">
                        {/* Logo */}
                        <div
                            onClick={() => {
                                setActiveTab('marketplace');
                                setSelectedProductId(null);
                                setSearchQuery('');
                                navigate('/products');
                            }}
                            className="flex items-center gap-3 cursor-pointer group shrink-0 overflow-hidden"
                        >
                            <img
                                src="/logo.png"
                                alt="Banana Leaf Store"
                                className="h-14 sm:h-16 md:h-[112px] w-auto max-w-[140px] sm:max-w-[180px] md:max-w-[280px] object-contain"
                                onError={(e) => {
                                    const img = e.currentTarget;
                                    img.style.display = 'none';
                                    const fallback = img.nextElementSibling as HTMLElement | null;
                                    if (fallback) fallback.style.display = 'flex';
                                }}
                            />
                            <div className="hidden flex-col">
                                <span className="text-xl md:text-2xl font-black tracking-tighter uppercase italic leading-none">Banana Leaf<span className="text-brand-primary">.</span></span>
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Store</span>
                            </div>
                        </div>

                        <div className="hidden sm:flex flex-1 items-center gap-3">
                            {/* Search Bar */}
                            <div className="flex flex-1 max-w-md h-12 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all">
                                <div className="bg-slate-100 flex items-center px-4 border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Inventory</span>
                                </div>
                                <input
                                    type="text"
                                    className="flex-1 px-4 bg-transparent text-sm font-bold text-slate-900 focus:outline-none placeholder:text-slate-300"
                                    placeholder="Search product identifiers, flavors, or brands..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button className="h-12 flex items-center bg-slate-900 px-6 hover:bg-brand-primary transition-colors">
                                    <Search className="w-5 h-5 text-white" />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/shop')}
                                className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-slate-900 transition-all hover:border-brand-primary hover:text-brand-primary hover:bg-slate-50 hover:scale-105 active:scale-95"
                            >
                                Shop All
                            </button>
                            <div ref={desktopCollectionMenuRef} className="relative shrink-0">
                                <button
                                    type="button"
                                    aria-haspopup="menu"
                                    aria-expanded={isCollectionMenuOpen}
                                    onClick={() => setIsCollectionMenuOpen((prev) => !prev)}
                                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-slate-900 transition-all hover:border-slate-900 hover:bg-slate-50"
                                >
                                    Collections
                                    <ChevronDown className={`h-4 w-4 transition-transform ${isCollectionMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isCollectionMenuOpen && (
                                    <div role="menu" className="absolute right-0 top-full z-[70] mt-3 w-[320px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
                                        {collectionMenuItems.map((item, index) => (
                                            <React.Fragment key={item.id}>
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    onClick={() => handleCollectionMenuSelect(item, 'desktop')}
                                                    className={`flex w-full items-center justify-between rounded-[1.25rem] px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.22em] transition-colors ${index === 0
                                                        ? 'text-brand-primary hover:bg-brand-primary/5'
                                                        : 'text-slate-900 hover:bg-slate-100'}`}
                                                >
                                                    {item.label}
                                                    <ArrowRight className={`h-4 w-4 ${index === 0 ? 'text-brand-primary/50' : 'text-slate-300'}`} />
                                                </button>
                                                {index === 0 && <div className="mx-3 my-1 h-px bg-slate-100" />}
                                            </React.Fragment>
                                        ))}
                                        {currentUser?.role === 'admin' && (
                                            <>
                                                <div className="mx-3 my-2 h-px bg-slate-200" />
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    onClick={handleVendorTabClick}
                                                    className="flex w-full items-center justify-between rounded-[1.25rem] px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 transition-colors hover:bg-emerald-50"
                                                >
                                                    Retailer OS
                                                    <ArrowRight className="h-4 w-4 text-emerald-300" />
                                                </button>
                                            </>
                                        )}
                                        {currentUser?.role === 'admin' && (
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={() => { handleProfileNavigation(); setIsCollectionMenuOpen(false); }}
                                                className="flex w-full items-center justify-between rounded-[1.25rem] px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.22em] text-rose-700 transition-colors hover:bg-rose-50"
                                            >
                                                Admin Layer
                                                <ShieldCheck className="h-4 w-4 text-rose-300" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User & Actions */}
                        <div className="flex items-center gap-3 md:gap-6 shrink-0">
                            {currentUser ? (
                                <div
                                    className="hidden md:flex items-center gap-4 cursor-pointer group"
                                    onClick={handleProfileNavigation}
                                >
                                    <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all border-2 border-brand-primary/20">
                                        <UserIcon className="w-5 h-5 text-brand-primary" />
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
                                <div className="relative bg-slate-900 p-3 md:p-4 rounded-[1.25rem] shadow-xl shadow-slate-900/10 group-hover:bg-brand-primary transition-all duration-300 before:absolute before:inset-0 before:bg-white/10 before:rounded-[1.25rem] before:opacity-0 group-hover:before:opacity-100">
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
                </div>

                {/* Mobile Search - Visible only on mobile */}
                <div className={`relative z-[60] md:hidden px-3 pb-3 ${isMobileSearchOpen ? 'block' : 'hidden'}`}>
                    <div className="mx-1 flex h-10 rounded-full overflow-hidden border border-gray-200 bg-white shadow-sm">
                        <input
                            type="text"
                            className="flex-1 px-3 text-sm focus:outline-none"
                            placeholder="Search products..."
                            aria-label="Search products"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="bg-brand-primary px-4">
                            <Search className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-[1500px] mx-auto w-full pb-12">
                {currentPath === '/about/our-story' && <OurStory />}
                {currentPath === '/about/authenticity' && <Authenticity />}
                {currentPath === '/about/press' && <Press />}
                {currentPath === '/support/help-center' && <HelpCenter />}
                {currentPath === '/support/shipping' && <ShippingPolicy />}
                {currentPath === '/support/returns' && <ReturnsPolicy />}
                {currentPath === '/support/contact' && <Contact />}
                {currentPath === '/admin/leads' && currentUser?.role === 'admin' && (
                    <AdminLeads token={localStorage.getItem('vapeshub_token') || ''} />
                )}

                {currentPath === '/shop' && <ShopAll />}
                {currentPath === '/shop/pulse-x-series' && <PulseXSeries />}
                {currentPath === '/shop/the-kits' && <TheKits />}
                {currentPath === '/shop/the-originals' && <TheOriginals />}

                {isDashboardPage && currentUser && <Dashboard userName={currentUser.name} email={currentUser.email} />}

                {isDashboardPage && !currentUser && !authChecked && (
                    <section className="mx-4 mt-6 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm md:p-10 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#4AB1F4]">Loading</p>
                        <h2 className="mt-3 text-3xl font-black uppercase tracking-tighter text-slate-900">Preparing Your Dashboard</h2>
                    </section>
                )}

                {activeTab === 'marketplace' && !selectedProductId && location.pathname !== '/checkout/success' && !isContentPage && !isDashboardPage && (
                    <div className="space-y-6">
                        <section id="brand-showcase-section" className="mx-4 space-y-3 pt-3 md:pt-4">
                            {FEATURE_BANNERS.map((banner) => (
                                <article
                                    key={banner.brand}
                                    className="relative overflow-hidden rounded-[1.9rem] border border-slate-200 shadow-[0_16px_42px_rgba(15,23,42,0.1)]"
                                >
                                    <div
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{
                                            backgroundImage: `linear-gradient(92deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.84) 44%, rgba(15,23,42,0.48) 72%, rgba(15,23,42,0.24) 100%), url(${banner.backgroundImageUrl})`,
                                        }}
                                    />
                                    <div className="relative grid min-h-[292px] gap-4 px-4 py-5 sm:px-7 sm:py-6 md:min-h-[296px] md:grid-cols-[minmax(0,1.08fr)_minmax(240px,0.92fr)] md:items-center md:gap-6 md:px-10 md:py-8 lg:min-h-[320px] lg:px-12">
                                        <div className="space-y-3 pr-0 text-white md:max-w-[35rem] md:pr-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#8bd1ff]">{banner.brand}</p>
                                            <div className="space-y-2.5">
                                                <h3 className="max-w-[12ch] text-[1.72rem] font-black leading-[0.95] tracking-[-0.05em] text-white sm:text-[2.05rem] md:text-[2.6rem] lg:text-[3.1rem]">{getFeatureBannerHeadline(banner)}</h3>
                                                <p className="max-w-[34rem] text-[0.86rem] leading-5 text-slate-200 sm:text-[0.92rem] sm:leading-6 md:text-[0.98rem] md:leading-7">{banner.description}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => focusMarketplaceSection({
                                                    filter: 'all',
                                                    search: banner.brand,
                                                    category: banner.category,
                                                    sectionId: 'marketplace-grid-section',
                                                })}
                                                className="inline-flex h-12 items-center justify-center rounded-[1rem] bg-[#4AB1F4] px-6 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_22px_rgba(74,177,244,0.42)] transition-all hover:-translate-y-0.5 hover:bg-[#2f9ce5]"
                                            >
                                                Claim Deal
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-end">
                                            <div className="ml-auto flex h-[146px] w-[146px] items-center justify-center rounded-[1.4rem] border border-slate-100 bg-white p-3 shadow-[0_20px_50px_rgba(15,23,42,0.22)] sm:h-[184px] sm:w-[184px] sm:p-4 md:h-[216px] md:w-[216px] md:p-5 lg:h-[236px] lg:w-[236px]">
                                                <img
                                                    src={banner.imageUrl}
                                                    alt={`${banner.brand} promotional device`}
                                                    className="h-full w-full object-contain"
                                                    loading="lazy"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </section>

                        <section id="marketplace-grid-section" className="mx-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-10">
                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
                                {homepageGridLoading ? (
                                    <div className="col-span-full w-full py-20 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-100 flex items-center justify-center gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Loading Collection...</span>
                                    </div>
                                ) : homepageGridGroups.length > 0 ? (
                                    homepageGridGroups.map((group) => {
                                        const selectedVariant = group.variants[0];

                                        return (
                                            <div key={`banner-grid-${group.key}`}>
                                                <MarketplaceProductCard
                                                    group={group}
                                                    selectedVariant={selectedVariant}
                                                    onOpenProduct={() => openProductDetailPage(selectedVariant.id)}
                                                    onSelectVariant={() => { }}
                                                    cardMode="master"
                                                />
                                            </div>
                                        );
                                    })
                                ) : (
                                    <MarketplaceEmptyState
                                        title={emptyStateTitle}
                                        description={emptyStateDescription}
                                        onReset={resetMarketplaceFilters}
                                    />
                                )}
                            </div>
                        </section>

                        {/* ── Why Shop Banana Leaf ─────────────────────────── */}
                        <section id="inventory-stream-section" className="mx-4 rounded-[2rem] border border-slate-100 bg-white p-8 md:p-12 shadow-sm">
                            <div className="text-center mb-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4AB1F4] mb-3">Our Promise</p>
                                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">Why Shop Banana Leaf?</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                {([
                                    { icon: Zap, title: 'Same-Day Dispatch', body: 'Orders before 3PM ship the same business day — no delays, no excuses.' },
                                    { icon: ShieldCheck, title: 'Lab-Verified Products', body: 'Sourced from authorised suppliers and quality-checked before every listing.' },
                                    { icon: Star, title: 'Premium Selection', body: 'Top brands — Geekbar, Foger, Flum, Zyns and more, curated for quality.' },
                                    { icon: Package, title: 'Hassle-Free Returns', body: 'Something wrong? Easy returns within 7 days. We make it right, fast.' },
                                ] as const).map(({ icon: Icon, title, body }) => (
                                    <div key={title} className="flex flex-col items-center text-center gap-4 p-6 rounded-[1.5rem] bg-slate-50 hover:bg-blue-50/60 transition-colors group">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-[#4AB1F4] transition-colors shrink-0">
                                            <Icon className="w-5 h-5 text-[#4AB1F4] group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-tight text-slate-900 mb-1.5">{title}</p>
                                            <p className="text-[11px] font-medium text-slate-400 leading-relaxed">{body}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ── Customer Reviews ─────────────────────────────── */}
                        <section className="mx-4 rounded-[2rem] border border-slate-100 bg-slate-50 p-8 md:p-12 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4AB1F4] mb-2">Verified Reviews</p>
                                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">What Our Customers Say</h2>
                                </div>
                                <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm shrink-0 self-start sm:self-auto">
                                    <div className="flex text-[#FFA41C]">
                                        {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-slate-900 leading-none">4.9</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">1,200+ reviews</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {([
                                    { name: 'Jordan M.', location: 'Los Angeles, CA', rating: 5, text: 'Best vape shop online. Got my Geekbar Pulse X in 24 hours. The flavour selection is insane and the packaging was perfect. Will 100% be back.', date: '2 days ago' },
                                    { name: 'Priya S.', location: 'Seattle, WA', rating: 5, text: 'I switched from another store and the difference is night and day. Prices are fair, shipping is fast, and the Zyns pouches I ordered were fresh. Highly recommend.', date: '1 week ago' },
                                    { name: 'Marcus T.', location: 'Austin, TX', rating: 5, text: 'Customer service helped me pick the right nicotine strength. The Foger Ultra 15k is my new daily. Quality is unmatched. 5 stars no question.', date: '2 weeks ago' },
                                ] as const).map((review) => (
                                    <article key={review.name} className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm flex flex-col gap-4">
                                        <div className="flex gap-0.5 text-[#FFA41C]">
                                            {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed flex-1">&ldquo;{review.text}&rdquo;</p>
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                            <div>
                                                <p className="text-[11px] font-black text-slate-900">{review.name}</p>
                                                <p className="text-[10px] text-slate-400">{review.location}</p>
                                            </div>
                                            <p className="text-[10px] text-slate-300 font-medium">{review.date}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>

                        {/* ── FAQ ──────────────────────────────────────────── */}
                        <section className="mx-4 rounded-[2rem] border border-slate-100 bg-white p-8 md:p-12 shadow-sm">
                            <div className="text-center mb-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4AB1F4] mb-3">Got Questions?</p>
                                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">Frequently Asked Questions</h2>
                            </div>
                            <div className="max-w-3xl mx-auto divide-y divide-slate-100">
                                {HOMEPAGE_FAQS.map((faq, index) => {
                                    const isOpen = openFaqIndex === index;
                                    return (
                                        <div key={index}>
                                            <button
                                                type="button"
                                                onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                                                className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                                                aria-expanded={isOpen}
                                            >
                                                <span className="text-sm font-black text-slate-900 group-hover:text-[#4AB1F4] transition-colors">{faq.q}</span>
                                                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isOpen && (
                                                <p className="pb-5 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <div id="shipping-logistics-section" className="h-0 w-full" aria-hidden="true" />
                    </div>
                )
                }

                {
                    location.pathname === '/checkout/success' && checkoutSummary && (
                        <section className="mx-4 mt-6 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm md:p-10">
                            <div className="mb-8 flex flex-col gap-3 border-b border-slate-100 pb-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#4AB1F4]">Thank You</p>
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Order Confirmed</h2>
                                <p className="text-sm font-semibold text-slate-500">Order #{checkoutSummary.orderId} has been received.</p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Shipping</p>
                                    <p className="mt-2 text-sm font-bold text-slate-900">{checkoutSummary.shippingAddress}</p>
                                    <p className="mt-2 text-xs font-semibold text-slate-500">Email: {checkoutSummary.customerEmail}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Totals</p>
                                    <p className="mt-2 text-sm font-bold text-slate-900">Subtotal: ${(checkoutSummary.total - checkoutSummary.deliveryFee).toFixed(2)}</p>
                                    <p className="text-sm font-bold text-slate-900">Delivery: ${checkoutSummary.deliveryFee.toFixed(2)}</p>
                                    <p className="mt-2 text-xl font-black tracking-tight text-[#4AB1F4]">Total: ${checkoutSummary.total.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="mt-6 rounded-2xl border border-slate-100">
                                <div className="border-b border-slate-100 px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Order Summary</div>
                                <div className="divide-y divide-slate-100">
                                    {checkoutSummary.items.map((item) => (
                                        <div key={`${item.name}-${item.quantity}`} className="flex items-center justify-between px-5 py-4">
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{item.name}</p>
                                                <p className="text-xs font-semibold text-slate-500">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="text-sm font-black text-slate-900">${item.lineTotal.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCheckoutSummary(null);
                                        navigate('/products');
                                    }}
                                    className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#4AB1F4]"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </section>
                    )
                }

                {
                    location.pathname === '/checkout/success' && !checkoutSummary && (
                        <section className="mx-4 mt-6 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm md:p-10 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#4AB1F4]">Thank You</p>
                            <h2 className="mt-3 text-3xl font-black uppercase tracking-tighter text-slate-900">Order Received</h2>
                            <p className="mt-3 text-sm font-semibold text-slate-500">Your order has been placed successfully.</p>
                            <button
                                type="button"
                                onClick={() => navigate('/products')}
                                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#4AB1F4]"
                            >
                                Return To Products
                            </button>
                        </section>
                    )
                }

                {
                    activeTab === 'marketplace' && selectedProductId && (
                        <ProductDetail
                            group={selectedProductGroup}
                            selectedVariantId={selectedProductId}
                            onBack={() => navigate(buildProductsUrl({
                                tag: activeFilter !== 'all' ? activeFilter : undefined,
                                category: activeCategory,
                                search: searchQuery.trim() || undefined,
                            }))}
                            onVariantChange={handleProductDetailVariantChange}
                            onAddToCart={addToCart}
                        />
                    )
                }

                {
                    activeTab === 'vendor' && !isContentPage && !isDashboardPage && (
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

                            {/* Banana Leaf Intelligence Center - Multiple AI Bots */}
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
                                        <h4 className="text-lg font-black uppercase tracking-widest">Ask Banana Leaf Intelligence</h4>
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
                    )
                }

                {
                    activeTab === 'admin' && !isContentPage && !isDashboardPage && (
                        <div className="p-4" ref={(el) => { if (el && !adminLoading && !adminStats) loadAdminStats(); }}>
                            <div className="mb-8">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Global Analytics & Admin OS</h2>
                                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Master Control Center - Restricted to Authorized Administrators</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/admin/leads')}
                                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50"
                                    >
                                        View Chat Leads
                                    </button>
                                </div>
                            </div>

                            <AdminDashboard token={localStorage.getItem('vapeshub_token') || ''} stats={adminStats} currentUser={currentUser} />
                        </div>
                    )
                }
            </main >

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {
                    isMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMenuOpen(false)}
                                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: -14, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                className="fixed top-[76px] left-1/2 -translate-x-1/2 w-[min(calc(100vw-1.5rem),24rem)] max-h-[calc(100vh-92px)] overflow-hidden rounded-[1.75rem] bg-slate-900 z-[101] flex flex-col shadow-2xl border border-white/10"
                            >
                                <div className="p-5 bg-slate-950 flex items-center justify-between border-b border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                                            <UserIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{currentUser ? 'Account Login' : 'Welcome, Guest'}</span>
                                            <span className="text-white font-black uppercase tracking-tight">{currentUser ? currentUser.name : 'Sign In / Register'}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                        <X className="w-6 h-6 text-white" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-5 space-y-7">
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">Collections</h3>
                                        <ul className="space-y-5">
                                            {collectionMenuItems.map((item, index) => (
                                                <li
                                                    key={item.id}
                                                    role="menuitem"
                                                    tabIndex={0}
                                                    className={`flex items-center justify-between font-black uppercase tracking-widest text-xs cursor-pointer transition-colors ${index === 0
                                                        ? 'text-brand-primary hover:text-white'
                                                        : 'text-white hover:text-brand-primary'}`}
                                                    onClick={() => handleCollectionMenuSelect(item, 'mobile')}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter' || event.key === ' ') {
                                                            event.preventDefault();
                                                            handleCollectionMenuSelect(item, 'mobile');
                                                        }
                                                    }}
                                                >
                                                    {item.label} <ChevronRight className={`w-4 h-4 ${index === 0 ? 'text-brand-primary/50' : 'text-slate-500'}`} />
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">Account</h3>
                                        <ul className="space-y-5">
                                            {currentUser ? (
                                                <li onClick={() => { handleProfileNavigation(); setIsMenuOpen(false); }} className="text-white font-black uppercase tracking-widest text-xs hover:text-brand-primary cursor-pointer transition-colors">My Account</li>
                                            ) : (
                                                <li onClick={() => { setShowAuthModal(true); setIsMenuOpen(false); }} className="text-white font-black uppercase tracking-widest text-xs hover:text-brand-primary cursor-pointer transition-colors">Sign In / Register</li>
                                            )}
                                            {currentUser?.role === 'admin' && (
                                                <li onClick={() => { handleVendorTabClick(); setIsMenuOpen(false); }} className="text-brand-accent font-black uppercase tracking-widest text-xs hover:text-white cursor-pointer transition-colors flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
                                                    Retailer OS
                                                </li>
                                            )}
                                            {currentUser?.role === 'admin' && (
                                                <li onClick={() => { handleProfileNavigation(); setIsMenuOpen(false); }} className="text-rose-400 font-black uppercase tracking-widest text-xs hover:text-white cursor-pointer transition-colors flex items-center gap-2">
                                                    <ShieldCheck className="w-4 h-4" />
                                                    Admin Layer
                                                </li>
                                            )}
                                            {currentUser && (
                                                <li onClick={handleSignOut} className="text-slate-500 font-black uppercase tracking-widest text-xs hover:text-red-400 cursor-pointer transition-colors">Log Out</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                                <div className="p-5 border-t border-white/5 bg-slate-950/50">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src="/logo.png"
                                            alt="Banana Leaf Store"
                                            className="h-8 w-auto object-contain brightness-0 invert"
                                            onError={(e) => {
                                                const img = e.currentTarget;
                                                img.style.display = 'none';
                                                const fallback = img.nextElementSibling as HTMLElement | null;
                                                if (fallback) fallback.style.display = 'inline';
                                            }}
                                        />
                                        <span className="hidden text-lg font-black tracking-tighter text-white uppercase italic">Banana Leaf<span className="text-brand-primary">.</span></span>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )
                }
            </AnimatePresence >

            {/* Cart Drawer */}
            <AnimatePresence>
                {
                    isCartOpen && (
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
                    )
                }
            </AnimatePresence >

            {/* Floating AI Chat - Bottom Right */}
            < div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] flex flex-col items-end gap-5 pointer-events-none w-[calc(100vw-2rem)] md:w-auto" >
                <AnimatePresence>
                    {aiChatOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="w-full md:w-[380px] h-[450px] md:h-[550px] bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden pointer-events-auto"
                        >
                            <div className="bg-slate-950 p-6 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                                        <Sparkles className="text-white w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-black uppercase tracking-tighter">Banana Leaf AI</span>
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

                            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-900/50">
                                {aiMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-black uppercase tracking-tight shadow-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-brand-primary text-slate-900 rounded-tr-none'
                                            : 'bg-white/5 text-slate-300 border border-white/5 rounded-tl-none'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleAiChat} className="p-6 bg-slate-950/50 border-t border-white/5">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="Inquire module data..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-xs text-white focus:outline-none focus:border-brand-primary focus:bg-white/10 transition-all font-black uppercase tracking-widest placeholder:text-slate-600"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                    />
                                    <button type="submit" className="bg-brand-primary text-slate-900 p-3 rounded-xl shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all">
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
                    className="bg-[#4AB1F4] text-white p-5 md:p-6 rounded-[2rem] shadow-2xl shadow-[#4AB1F4]/30 pointer-events-auto flex items-center justify-center group relative transition-all hover:bg-[#2f9ce5]"
                >
                    {aiChatOpen ? <X className="w-6 h-6 md:w-7 md:h-7" /> : <MessageSquare className="w-6 h-6 md:w-7 md:h-7 text-white" />}
                </motion.button>
            </div >

            <footer className="bg-slate-900 text-white mt-auto">
                {/* Return to Top */}
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="w-full py-6 bg-slate-800 hover:bg-slate-700 text-[11px] font-black uppercase tracking-[0.3em] transition-all border-b border-white/5"
                >
                    Back To Top
                </button>

                <div className="max-w-[1500px] mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary">About Banana Leaf</h4>
                        <ul className="space-y-4 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                            <li><Link to="/about/our-story" className="hover:text-white transition-colors">Our Story</Link></li>
                            <li><Link to="/about/authenticity" className="hover:text-white transition-colors">Authenticity</Link></li>
                            <li><Link to="/about/press" className="hover:text-white transition-colors">Press Assets</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary">Shop</h4>
                        <ul className="space-y-4 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                            <li><Link to="/shop/pulse-x-series" className="hover:text-white transition-colors">Pulse X Series</Link></li>
                            <li><Link to="/shop/the-kits" className="hover:text-white transition-colors">The Kits</Link></li>
                            <li><Link to="/shop/the-originals" className="hover:text-white transition-colors">The Originals</Link></li>
                            <li><Link to={buildProductsUrl({ search: 'Cloud' })} className="hover:text-white transition-colors">Cloud Series</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary">Support</h4>
                        <ul className="space-y-4 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                            <li><Link to="/support/help-center" className="hover:text-white transition-colors">Help Center</Link></li>
                            <li><Link to="/support/shipping" className="hover:text-white transition-colors">Shipping</Link></li>
                            <li><Link to="/support/returns" className="hover:text-white transition-colors">Returns</Link></li>
                            <li><Link to="/support/contact" className="hover:text-white transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary">Account</h4>
                        <ul className="space-y-4 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                            <li><Link to="/dashboard" className="hover:text-white transition-colors" onClick={handleProtectedDashboardLinkClick}>My Profile</Link></li>
                            <li><Link to="/dashboard" className="hover:text-white transition-colors" onClick={handleProtectedDashboardLinkClick}>Order Status</Link></li>
                            <li><Link to="/dashboard" className="hover:text-white transition-colors" onClick={handleProtectedDashboardLinkClick}>Saved Items</Link></li>
                            <li>
                                <button
                                    type="button"
                                    onClick={handleSessionAccessClick}
                                    className="hover:text-white transition-colors"
                                >
                                    {currentUser ? 'Log Out' : 'Sign In / Register'}
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 py-16 flex flex-col items-center gap-8 bg-slate-950/50">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <img
                            src="/logo.png"
                            alt="Banana Leaf Store"
                            className="h-12 w-auto object-contain brightness-0 invert"
                            onError={(e) => {
                                const img = e.currentTarget;
                                img.style.display = 'none';
                                const fallback = img.nextElementSibling as HTMLElement | null;
                                if (fallback) fallback.style.display = 'inline';
                            }}
                        />
                        <span className="hidden text-3xl font-black tracking-tighter uppercase italic">Banana Leaf<span className="text-brand-primary">.</span></span>
                    </div>
                    <div className="text-center space-y-3 px-6">
                        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-white">Banana Leaf // Authenticity First.</p>
                        <p className="text-sm text-slate-400">Curated Quality. Seamless Delivery.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                        <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Support</span>
                    </div>
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">© 2026 Banana Leaf Store. Age verification required.</p>
                </div>
            </footer>

            {/* Duplicate AI trigger removed — handled by the floating chat widget above */}
        </div >
    );
}
