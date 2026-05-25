import {
    AlertCircle,
    ChevronDown,
    Filter,
    Loader2,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Star,
    X,
    Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_CATALOG_IMAGE, resolveCatalogImage } from '../../shared/product-images';
import { FALLBACK_PRODUCTS } from '../data/fallback-products';
import { fetchProducts } from '../services/api';
import { Product } from '../types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function seededUnitValue(seed: number): number {
    const n = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return n - Math.floor(n);
}

function getMetrics(id: number) {
    const rating = Number((4.2 + seededUnitValue(id + 17) * 0.8).toFixed(1));
    const reviews = 12 + Math.floor(seededUnitValue(id + 31) * 37);
    return { rating, reviews };
}

function getOriginalPrice(p: Product): number {
    if (typeof p.originalPrice === 'number' && p.originalPrice > p.price) return p.originalPrice;
    if (typeof p.discountPercentage === 'number' && p.discountPercentage > 0)
        return Number((p.price / (1 - p.discountPercentage / 100)).toFixed(2));
    return Number((p.price * 1.2).toFixed(2));
}

function getSale(p: Product): number {
    if (typeof p.discountPercentage === 'number' && p.discountPercentage > 0)
        return Math.round(p.discountPercentage);
    const orig = getOriginalPrice(p);
    return Math.max(0, Math.round(((orig - p.price) / orig) * 100));
}

// ─── Sort options ─────────────────────────────────────────────────────────────

type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'newest' | 'bestsellers';
const SORT_LABELS: Record<SortOption, string> = {
    featured: 'Featured',
    price_asc: 'Price: Low → High',
    price_desc: 'Price: High → Low',
    newest: 'Newest',
    bestsellers: 'Best Sellers',
};

function sortProducts(products: Product[], sort: SortOption): Product[] {
    const copy = [...products];
    switch (sort) {
        case 'price_asc': return copy.sort((a, b) => a.price - b.price);
        case 'price_desc': return copy.sort((a, b) => b.price - a.price);
        case 'newest': return copy.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
        case 'bestsellers': return copy.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
        default: return copy;
    }
}

// ─── Mini product card ────────────────────────────────────────────────────────

function ShopProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
    const resolvedImage = useMemo(
        () => resolveCatalogImage({ image: product.image, name: product.name, brand: product.brand, category: product.category, flavor: product.flavor }),
        [product]
    );
    const [imgSrc, setImgSrc] = useState(resolvedImage);
    useEffect(() => { setImgSrc(resolvedImage); }, [resolvedImage]);

    const originalPrice = getOriginalPrice(product);
    const salePercent = getSale(product);
    const { rating, reviews } = getMetrics(product.id);

    return (
        <article
            onClick={onOpen}
            className="group flex h-full flex-col rounded-[1.5rem] border border-[#e8ebef] bg-white cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]"
        >
            {/* Image */}
            <div className="relative aspect-square bg-slate-50 overflow-hidden">
                <img
                    src={imgSrc}
                    alt={product.name}
                    loading="lazy"
                    onError={() => { setImgSrc((prev) => prev !== DEFAULT_CATALOG_IMAGE ? DEFAULT_CATALOG_IMAGE : prev); }}
                    className={`h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-105`}
                />
                {salePercent > 0 && (
                    <span className="absolute left-3 top-3 rounded-md bg-emerald-500 px-2.5 py-1 text-[10px] font-black text-white">
                        -{salePercent}%
                    </span>
                )}
                {product.isExpressDelivery && (
                    <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 shadow-sm">
                        <Zap className="h-3 w-3 text-[#4AB1F4]" />
                        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-700">Express</span>
                    </span>
                )}
                {(product.isBestSeller || product.stockQty <= 150) && (
                    <span className="absolute bottom-8 left-3 rounded-full bg-rose-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white z-20">
                        Limited Stock!
                    </span>
                )}
                {/* Top site-wide nicotine warning is handled globally; remove per-card warnings */}
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 line-clamp-1">
                        {product.brand}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-slate-900">
                        {product.name}
                    </h3>
                    {product.flavor && (
                        <p className="mt-0.5 text-[11px] font-medium text-slate-400 line-clamp-1">{product.flavor}</p>
                    )}
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1.5">
                    <div className="flex text-[#FFA41C]">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 fill-current ${i < Math.round(rating) ? '' : 'text-slate-200'}`} />
                        ))}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">({reviews})</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-slate-400 line-through sm:text-xs">${originalPrice.toFixed(2)}</span>
                    <span className="text-lg font-black tracking-tight text-[#4AB1F4] sm:text-xl">${product.price.toFixed(2)}</span>
                </div>

                {/* CTA */}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpen(); }}
                    className="mt-auto w-full rounded-[0.9rem] bg-slate-900 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-[#4AB1F4] active:scale-95"
                >
                    View Product
                </button>
            </div>
        </article>
    );
}

// ─── Filter sidebar content ───────────────────────────────────────────────────

const CATEGORIES = ['Disposables', 'Pulse X Series', 'The Kits', 'The Originals', 'Nicotine Pouches', 'Supplements'];
const BRANDS = [
    'Geekbar Pulse X',
    'Geek Bar Pulse X',
    'Geek Bar Pulse X 25K',
    'Foger Pods',
    'Fogger Pods',
    'Fogger Kit',
    'Foger Switch Pro Kit',
    'Foger Switch Pro Pod',
    'Utbar',
    'Utbar UT 50K',
    'Flum Mello',
    'Flum Mellow',
    'Numbz',
    'Zyns',
    'Hydroxie (7-OH)',
    'Blues',
];
const TAGS = [
    { key: 'all', label: 'All' },
    { key: 'bestsellers', label: 'Best Sellers' },
    { key: 'newarrivals', label: 'New Arrivals' },
    { key: 'express', label: 'Express' },
] as const;

interface FilterState {
    categories: string[];
    brands: string[];
    tag: string;
    search: string;
}

function buildFiltersFromParams(params: URLSearchParams): FilterState {
    return {
        categories: params.getAll('cat'),
        brands: params.getAll('brand'),
        tag: params.get('tag') ?? 'all',
        search: params.get('q') ?? params.get('search') ?? '',
    };
}

function areFiltersEqual(a: FilterState, b: FilterState): boolean {
    if (a.tag !== b.tag || a.search !== b.search) return false;
    if (a.categories.length !== b.categories.length || a.brands.length !== b.brands.length) return false;
    return a.categories.every((value, index) => value === b.categories[index])
        && a.brands.every((value, index) => value === b.brands[index]);
}

function toggle(arr: string[], value: string): string[] {
    return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

interface FilterPanelProps {
    filters: FilterState;
    productCounts: { categories: Record<string, number>; brands: Record<string, number> };
    onChange: (f: FilterState) => void;
    onClose?: () => void;
}

function FilterPanel({ filters, productCounts, onChange, onClose }: FilterPanelProps) {
    return (
        <div className="flex flex-col gap-6 py-2">
            {onClose && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Filters</p>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100">
                        <X className="h-4 w-4 text-slate-500" />
                    </button>
                </div>
            )}

            {/* Tag pills */}
            <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Show</p>
                <div className="flex flex-col gap-1.5">
                    {TAGS.map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onChange({ ...filters, tag: key })}
                            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${filters.tag === key ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        >
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Category */}
            <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Category</p>
                <div className="flex flex-col gap-1.5">
                    {CATEGORIES.map((cat) => {
                        const count = productCounts.categories[cat] ?? 0;
                        const checked = filters.categories.includes(cat);
                        return (
                            <label key={cat} className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => onChange({ ...filters, categories: toggle(filters.categories, cat) })}
                                    className="h-4 w-4 rounded border-slate-300 text-[#4AB1F4] accent-[#4AB1F4]"
                                />
                                <span className="flex-1 text-[11px] font-semibold text-slate-700">{cat}</span>
                                {count > 0 && <span className="text-[10px] font-bold text-slate-400">{count}</span>}
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Brand */}
            <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Brand</p>
                <div className="flex flex-col gap-1.5">
                    {BRANDS.map((brand) => {
                        const count = productCounts.brands[brand] ?? 0;
                        const checked = filters.brands.includes(brand);
                        return (
                            <label key={brand} className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => onChange({ ...filters, brands: toggle(filters.brands, brand) })}
                                    className="h-4 w-4 rounded border-slate-300 accent-[#4AB1F4]"
                                />
                                <span className="flex-1 text-[11px] font-semibold text-slate-700">{brand}</span>
                                {count > 0 && <span className="text-[10px] font-bold text-slate-400">{count}</span>}
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Clear */}
            {(filters.categories.length > 0 || filters.brands.length > 0 || filters.tag !== 'all' || filters.search) && (
                <button
                    type="button"
                    onClick={() => onChange({ categories: [], brands: [], tag: 'all', search: '' })}
                    className="w-full rounded-xl border border-slate-200 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 hover:border-rose-300 hover:text-rose-500 transition-all"
                >
                    Clear All Filters
                </button>
            )}
        </div>
    );
}

// ─── Main ShopAll page ─────────────────────────────────────────────────────────

export default function ShopAll() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [sort, setSort] = useState<SortOption>((searchParams.get('sort') as SortOption) ?? 'featured');
    const [filters, setFilters] = useState<FilterState>(() => buildFiltersFromParams(searchParams));
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);
    const [localSearch, setLocalSearch] = useState(filters.search);
    const sortRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const nextFilters = buildFiltersFromParams(searchParams);
        if (!areFiltersEqual(filters, nextFilters)) {
            setFilters(nextFilters);
            setLocalSearch(nextFilters.search);
        }
    }, [searchParams, filters]);

    // Fetch ALL products — retry once on cold-start empty response
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setFetchError(false);

        async function load() {
            let data = await fetchProducts({ filter: 'all' });
            if (cancelled) return;
            if (data.length === 0) {
                // First attempt empty — wait 2s and retry once (handles cold-starts).
                await new Promise<void>((r) => setTimeout(r, 2000));
                if (cancelled) return;
                data = await fetchProducts({ filter: 'all' });
            }
            if (cancelled) return;
            // Still empty after retry — use fallback catalogue so page is never blank.
            setAllProducts(data.length > 0 ? data : FALLBACK_PRODUCTS);
            setLoading(false);
        }
        load().catch(() => {
            if (!cancelled) { setFetchError(true); setLoading(false); }
        });

        return () => { cancelled = true; };
    }, [retryCount]);

    // Sync filters → URL params
    useEffect(() => {
        const params = new URLSearchParams();
        filters.categories.forEach((c) => params.append('cat', c));
        filters.brands.forEach((b) => params.append('brand', b));
        if (filters.tag !== 'all') params.set('tag', filters.tag);
        if (filters.search) params.set('q', filters.search);
        if (sort !== 'featured') params.set('sort', sort);
        setSearchParams(params, { replace: true });
    }, [filters, sort, setSearchParams]);

    // Close sort dropdown on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Product count per category/brand for filter panel
    const productCounts = useMemo(() => {
        const categories: Record<string, number> = {};
        const brands: Record<string, number> = {};
        allProducts.forEach((p) => {
            categories[p.category] = (categories[p.category] ?? 0) + 1;
            brands[p.brand] = (brands[p.brand] ?? 0) + 1;
        });
        return { categories, brands };
    }, [allProducts]);

    // Apply client-side filters
    const displayProducts = useMemo(() => {
        let out = allProducts;

        if (filters.categories.length > 0) {
            out = out.filter((p) => filters.categories.includes(p.category));
        }
        if (filters.brands.length > 0) {
            out = out.filter((p) => filters.brands.includes(p.brand));
        }
        if (filters.tag === 'bestsellers') out = out.filter((p) => p.isBestSeller);
        if (filters.tag === 'newarrivals') out = out.filter((p) => p.isNewArrival);
        if (filters.tag === 'express') out = out.filter((p) => p.isExpressDelivery);
        if (filters.search.trim()) {
            const q = filters.search.toLowerCase();
            out = out.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.flavor?.toLowerCase().includes(q));
        }

        return sortProducts(out, sort);
    }, [allProducts, filters, sort]);

    const handleFilterChange = useCallback((f: FilterState) => {
        setFilters(f);
        setLocalSearch(f.search);
    }, []);

    const hasActiveFilters = filters.categories.length > 0 || filters.brands.length > 0 || filters.tag !== 'all' || filters.search;

    const activeChips: { label: string; remove: () => void }[] = [
        ...filters.categories.map((c) => ({ label: c, remove: () => setFilters((f) => ({ ...f, categories: f.categories.filter((x) => x !== c) })) })),
        ...filters.brands.map((b) => ({ label: b, remove: () => setFilters((f) => ({ ...f, brands: f.brands.filter((x) => x !== b) })) })),
        ...(filters.tag !== 'all' ? [{ label: SORT_LABELS[filters.tag as SortOption] ?? filters.tag, remove: () => setFilters((f) => ({ ...f, tag: 'all' })) }] : []),
        ...(filters.search ? [{ label: `"${filters.search}"`, remove: () => { setFilters((f) => ({ ...f, search: '' })); setLocalSearch(''); } }] : []),
    ];

    const pageHeaderTitle = filters.search.trim()
        ? `Search results for "${filters.search.trim()}"`
        : 'All Products';

    return (
        <div className="mx-4 mt-4 mb-12">
            {/* ── Page header ─────────────────────────────────────────── */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4AB1F4]">Banana Leaf</p>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 sm:text-3xl">{pageHeaderTitle}</h1>
                    {!loading && (
                        <p className="mt-1 text-[11px] font-semibold text-slate-400">
                            {displayProducts.length} {displayProducts.length === 1 ? 'product' : 'products'}
                            {hasActiveFilters && ' — filtered'}
                        </p>
                    )}
                </div>

                {/* Search + Sort row */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 sm:w-56 sm:flex-none">
                        <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search products…"
                            value={localSearch}
                            onChange={(e) => {
                                setLocalSearch(e.target.value);
                                setFilters((f) => ({ ...f, search: e.target.value }));
                            }}
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-[11px] font-semibold placeholder-slate-400 focus:border-[#4AB1F4] focus:outline-none focus:ring-2 focus:ring-[#4AB1F4]/20 transition-all"
                        />
                        {localSearch && (
                            <button type="button" onClick={() => { setLocalSearch(''); setFilters((f) => ({ ...f, search: '' })); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Sort dropdown */}
                    <div className="relative shrink-0" ref={sortRef}>
                        <button
                            type="button"
                            onClick={() => setSortOpen((o) => !o)}
                            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-black uppercase tracking-[0.14em] text-slate-700 hover:border-[#4AB1F4] transition-all"
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {sortOpen && (
                            <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/10">
                                {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => { setSort(key); setSortOpen(false); }}
                                        className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${sort === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {sort === key && <span className="h-1.5 w-1.5 rounded-full bg-[#4AB1F4] shrink-0" />}
                                        {SORT_LABELS[key]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mobile filter toggle */}
                    <button
                        type="button"
                        onClick={() => setMobileFiltersOpen(true)}
                        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white hover:border-[#4AB1F4] transition-all lg:hidden"
                    >
                        <Filter className="h-4 w-4 text-slate-600" />
                        {hasActiveFilters && (
                            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-[#4AB1F4]" />
                        )}
                    </button>
                </div>
            </div>

            {/* ── Active filter chips ─────────────────────────────────── */}
            {activeChips.length > 0 && (
                <div className="mb-5 flex flex-wrap items-center gap-2">
                    {activeChips.map((chip) => (
                        <span key={chip.label} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 shadow-sm">
                            {chip.label}
                            <button type="button" onClick={chip.remove} className="ml-0.5 text-slate-400 hover:text-rose-500 transition-colors">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <button
                        type="button"
                        onClick={() => { setFilters({ categories: [], brands: [], tag: 'all', search: '' }); setLocalSearch(''); }}
                        className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 hover:text-rose-500 transition-colors"
                    >
                        Clear All
                    </button>
                </div>
            )}

            {/* ── Layout: sidebar + grid ──────────────────────────────── */}
            <div className="flex gap-8">
                {/* Desktop sidebar */}
                <aside className="hidden lg:block w-56 shrink-0">
                    <div className="sticky top-28 rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm overflow-y-auto max-h-[calc(100vh-9rem)]">
                        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Filters</p>
                        <FilterPanel
                            filters={filters}
                            productCounts={productCounts}
                            onChange={handleFilterChange}
                        />
                    </div>
                </aside>

                {/* Product grid */}
                <div className="min-w-0 flex-1">
                    {loading ? (
                        <div className="flex w-full items-center justify-center gap-3 rounded-[2rem] border border-dashed border-slate-100 bg-slate-50 py-24">
                            <Loader2 className="h-5 w-5 animate-spin text-[#4AB1F4]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Loading…</span>
                        </div>
                    ) : fetchError ? (
                        <div className="flex w-full flex-col items-center justify-center gap-5 rounded-[2rem] border border-dashed border-rose-200 bg-rose-50/40 py-24 text-center">
                            <AlertCircle className="h-10 w-10 text-rose-400" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-400">Connection Issue</p>
                                <p className="mt-1 text-xl font-black uppercase tracking-tighter text-slate-900">Unable to Load Products</p>
                                <p className="mt-2 text-xs font-medium text-slate-400 max-w-xs mx-auto">The product catalogue could not be reached. Please try again.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setLoading(true); setFetchError(false); setRetryCount((c) => c + 1); }}
                                className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#4AB1F4] transition-all active:scale-95"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Retry
                            </button>
                        </div>
                    ) : displayProducts.length === 0 && !hasActiveFilters ? (
                        <div className="flex w-full flex-col items-center justify-center gap-5 rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 py-24 text-center">
                            <img src="/logo.png" alt="Banana Leaf" className="h-14 w-auto opacity-30" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4AB1F4]">Coming Soon</p>
                                <p className="mt-1 text-xl font-black uppercase tracking-tighter text-slate-900">Catalogue Being Updated</p>
                                <p className="mt-2 text-xs font-medium text-slate-400">New products are being added. Check back soon.</p>
                            </div>
                        </div>
                    ) : displayProducts.length === 0 ? (
                        <div className="flex w-full flex-col items-center justify-center gap-5 rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 py-24 text-center">
                            <img src="/logo.png" alt="Banana Leaf" className="h-14 w-auto opacity-30" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4AB1F4]">No results</p>
                                <p className="mt-1 text-xl font-black uppercase tracking-tighter text-slate-900">Nothing matched your filters</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setFilters({ categories: [], brands: [], tag: 'all', search: '' }); setLocalSearch(''); }}
                                className="rounded-2xl bg-slate-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#4AB1F4] transition-all"
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                            {displayProducts.map((product) => (
                                <ShopProductCard
                                    key={product.id}
                                    product={product}
                                    onOpen={() => navigate(`/product/${product.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Mobile filter drawer ────────────────────────────────── */}
            {mobileFiltersOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm lg:hidden"
                        onClick={() => setMobileFiltersOpen(false)}
                    />
                    {/* Drawer */}
                    <div className="fixed bottom-0 left-0 right-0 z-[70] max-h-[85vh] overflow-y-auto rounded-t-[2rem] border-t border-slate-200 bg-white p-5 shadow-2xl lg:hidden">
                        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
                        <FilterPanel
                            filters={filters}
                            productCounts={productCounts}
                            onChange={handleFilterChange}
                            onClose={() => setMobileFiltersOpen(false)}
                        />
                        <div className="pb-safe mt-6">
                            <button
                                type="button"
                                onClick={() => setMobileFiltersOpen(false)}
                                className="w-full rounded-2xl bg-slate-900 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#4AB1F4] transition-all active:scale-95"
                            >
                                Show {displayProducts.length} Results
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
