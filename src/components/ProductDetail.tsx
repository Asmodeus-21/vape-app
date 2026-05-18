import {
    ArrowLeft,
    Minus,
    Package,
    Plus,
    Shield,
    Star,
    Truck,
    Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { DEFAULT_CATALOG_IMAGE, resolveCatalogImage, resolveFlavorImage } from '../../shared/product-images';
import { ParentVariantGroup, Product } from '../types';

interface ProductDetailProps {
    group: ParentVariantGroup | null;
    selectedVariantId: number;
    onBack: () => void;
    onVariantChange: (groupKey: string, variantId: number) => void;
    onAddToCart: (product: Product, quantity: number, options: { flavor: string; nicotine: string }) => void;
}

function selectNearestVariant(variants: Product[], nextFlavor: string, nextNicotine: string, fallbackVariant: Product) {
    return variants.find((variant) => variant.flavor === nextFlavor && variant.nicotine === nextNicotine)
        ?? variants.find((variant) => variant.flavor === nextFlavor)
        ?? variants.find((variant) => variant.nicotine === nextNicotine)
        ?? fallbackVariant;
}

export default function ProductDetail({ group, selectedVariantId, onBack, onVariantChange, onAddToCart }: ProductDetailProps) {
    const [quantity, setQuantity] = useState(1);
    const selectedVariant = useMemo(() => {
        if (!group || group.variants.length === 0) {
            return null;
        }

        return group.variants.find((variant) => variant.id === selectedVariantId) ?? group.variants[0];
    }, [group, selectedVariantId]);
    const uniqueFlavors = useMemo(() => {
        if (!group) {
            return [];
        }

        return Array.from(new Set(group.variants.map((variant) => variant.flavor).filter((value) => value && value !== 'N/A')));
    }, [group]);
    const uniqueNicotineStrengths = useMemo(() => {
        if (!group) {
            return [];
        }

        return Array.from(new Set(group.variants.map((variant) => variant.nicotine).filter((value) => value && value !== 'N/A')));
    }, [group]);
    const resolvedImage = useMemo(() => {
        if (!selectedVariant) {
            return '';
        }

        return resolveCatalogImage({
            image: selectedVariant.image,
            name: selectedVariant.name,
            brand: selectedVariant.brand,
            category: selectedVariant.category,
        });
    }, [selectedVariant]);

    // Flavor-specific image: swap when a flavor is selected; falls back to resolvedImage
    const flavorImage = useMemo(
        () => resolveFlavorImage(selectedVariant?.brand, selectedVariant?.flavor) ?? resolvedImage,
        [selectedVariant?.brand, selectedVariant?.flavor, resolvedImage],
    );
    const [displayImage, setDisplayImage] = useState(flavorImage);

    useEffect(() => {
        setDisplayImage(flavorImage);
    }, [flavorImage]);

    const shouldShowFlavorProfile = uniqueFlavors.length > 0;
    const shouldShowStrength = uniqueNicotineStrengths.length > 0;
    const displayTitle = selectedVariant?.flavor && selectedVariant.flavor !== 'N/A'
        ? `${group?.parentName ?? ''} - ${selectedVariant.flavor}`
        : group?.parentName ?? '';
    const maxOrderQuantity = Math.max(1, selectedVariant?.stockQty ?? 1);

    useEffect(() => {
        setQuantity((prev) => Math.min(Math.max(prev, 1), maxOrderQuantity));
    }, [maxOrderQuantity]);

    if (!group || !selectedVariant) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-bg-main py-20 space-y-4">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Product Not Found</h2>
                <button onClick={onBack} className="amazon-button-secondary">Return to Marketplace</button>
            </div>
        );
    }


    const handleAddToCart = () => {
        if (selectedVariant.stockQty < quantity) {
            toast.error(`Only ${selectedVariant.stockQty} items left in stock.`);
            return;
        }
        onAddToCart(selectedVariant, quantity, { flavor: selectedVariant.flavor, nicotine: selectedVariant.nicotine });
        toast.success('Added to cart!');
    };

    return (
        <div className="flex-1 bg-bg-main pb-20">
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-16 md:top-20 z-10 hidden md:block">
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-primary transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Products
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
                {/* Mobile Back Button */}
                <button onClick={onBack} className="md:hidden flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-primary transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="premium-card flex flex-col lg:flex-row">

                    {/* Left: Image Gallery */}
                    <div className="w-full lg:w-1/2 p-8 md:p-12 lg:border-r border-slate-100 flex items-center justify-center bg-white relative">
                        {selectedVariant.isBestSeller && (
                            <div className="absolute top-6 left-6 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-3 rounded-md z-10">
                                #1 Best Seller
                            </div>
                        )}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative w-full aspect-square max-w-md"
                        >
                            <img
                                src={displayImage}
                                alt={displayTitle}
                                className="w-full h-full object-contain filter drop-shadow-2xl"
                                onError={() => {
                                    if (displayImage !== resolvedImage) {
                                        setDisplayImage(resolvedImage);
                                    } else if (displayImage !== DEFAULT_CATALOG_IMAGE) {
                                        setDisplayImage(DEFAULT_CATALOG_IMAGE);
                                    }
                                }}
                            />
                        </motion.div>
                    </div>

                    {/* Right: Product Details */}
                    <div className="w-full lg:w-1/2 p-6 md:p-10 flex flex-col bg-white">
                        <div className="mb-2">
                            <span className="text-[11px] font-black uppercase tracking-widest text-brand-primary">{group.brand}</span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight uppercase tracking-tighter">
                            {displayTitle}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                <Star className="w-4 h-4 text-brand-primary fill-brand-primary" />
                                <span className="font-black text-xs text-slate-700">{selectedVariant.rating}</span>
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">({selectedVariant.reviews} reviews)</span>
                            </div>

                            <div className="h-6 w-px bg-slate-100"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 capitalize">{group.category.replace('-', ' ')}</span>
                        </div>

                        <div className="mb-8">
                            <div className="flex items-baseline gap-3 mb-3">
                                <span className="text-5xl font-black text-slate-900 tracking-tighter">${selectedVariant.price.toFixed(2)}</span>
                                {selectedVariant.isExpressDelivery && (
                                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary bg-slate-900 px-3 py-1.5 rounded-full shadow-lg">
                                        <Zap className="w-3 h-3 fill-current" /> Express Hub
                                    </span>
                                )}
                            </div>
                            {selectedVariant.stockQty > 0 ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                                        In Stock — Ready to Ship
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-rose-500 rounded-full" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Out of Stock — Check Back Soon</p>
                                </div>
                            )}
                        </div>

                        {/* Options Pickers */}
                        <div className="space-y-6 mb-8">
                            {shouldShowStrength && (
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Strength</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {uniqueNicotineStrengths.map((nicotine) => {
                                            const isActive = selectedVariant.nicotine === nicotine;

                                            return (
                                                <button
                                                    key={nicotine}
                                                    type="button"
                                                    aria-pressed={isActive}
                                                    onClick={() => {
                                                        const nextVariant = selectNearestVariant(group.variants, selectedVariant.flavor, nicotine, selectedVariant);
                                                        onVariantChange(group.key, nextVariant.id);
                                                    }}
                                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${isActive
                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-700'
                                                        }`}
                                                >
                                                    {nicotine}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {shouldShowFlavorProfile && (
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Flavor Profile</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {uniqueFlavors.map((flavor) => {
                                            const isActive = selectedVariant.flavor === flavor;

                                            return (
                                                <button
                                                    key={flavor}
                                                    type="button"
                                                    aria-pressed={isActive}
                                                    onClick={() => {
                                                        const nextVariant = selectNearestVariant(group.variants, flavor, selectedVariant.nicotine, selectedVariant);
                                                        onVariantChange(group.key, nextVariant.id);
                                                    }}
                                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${isActive
                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-700'
                                                        }`}
                                                >
                                                    {flavor}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-10 border-t border-slate-100">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                                {/* Qty Selector */}
                                <div className="flex items-center justify-between w-full sm:w-40 bg-slate-50 border border-slate-100 rounded-[2rem] p-1.5 h-16">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 rounded-[1.5rem] transition-all border border-transparent hover:border-slate-200 shadow-sm"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="font-black text-xl w-8 text-center text-slate-900">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min(maxOrderQuantity, quantity + 1))}
                                        className="w-12 h-12 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 rounded-[1.5rem] transition-all border border-transparent hover:border-slate-200 shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Add to Cart */}
                                <button
                                    onClick={handleAddToCart}
                                    disabled={selectedVariant.stockQty === 0}
                                    className={`w-full min-h-[60px] h-16 sm:h-16 sm:flex-1 rounded-[2rem] flex items-center justify-center gap-3 font-black uppercase tracking-[0.14em] text-base shadow-2xl transition-all active:scale-[0.97] hover:scale-[1.02] ${selectedVariant.stockQty > 0
                                        ? 'bg-slate-900 text-white hover:bg-brand-primary shadow-slate-900/25'
                                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                        }`}
                                >
                                    <Package className="w-6 h-6" />
                                    {selectedVariant.stockQty > 0 ? 'Add to Cart' : 'Out of Stock'}
                                </button>
                            </div>

                            {/* Guarantees */}
                            <div className="grid grid-cols-2 gap-6 mt-10">
                                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                                    <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                                        <Shield className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    100% Authentic
                                </div>
                                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                                    <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
                                        <Truck className="w-4 h-4 text-brand-primary" />
                                    </div>
                                    Fast Delivery
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Description */}
                <div className="mt-8 premium-card p-8 lg:p-12">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 pb-4">Product Description</h3>
                    <div className="prose prose-slate max-w-none">
                        <p className="text-slate-600 leading-relaxed font-bold text-sm">
                            {selectedVariant.description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
