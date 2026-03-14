import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Star, 
  Shield, 
  Package, 
  Truck, 
  Zap, 
  Plus, 
  Minus, 
  Check,
  Loader2 
} from 'lucide-react';
import { Product } from '../types';
import { fetchProductById } from '../services/api';
import toast from 'react-hot-toast';

interface ProductDetailProps {
  productId: number;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, options: { flavor: string; nicotine: string }) => void;
}

export default function ProductDetail({ productId, onBack, onAddToCart }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [selectedNicotine, setSelectedNicotine] = useState<string>('');

  // Extract mock options based on the product string (since DB just has a single string for now)
  const flavorOptions = product?.flavor.split(',').map(f => f.trim()) || [];
  const nicotineOptions = product?.nicotine.split(',').map(n => n.trim()) || [];

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const data = await fetchProductById(productId);
        setProduct(data);
        if (data) {
          const flavors = data.flavor.split(',').map(f => f.trim());
          const nics = data.nicotine.split(',').map(n => n.trim());
          if (flavors.length > 0) setSelectedFlavor(flavors[0]);
          if (nics.length > 0) setSelectedNicotine(nics[0]);
        }
      } catch (err) {
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-main py-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Synchronizing hardware data...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-main py-20 space-y-4">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Product Not Found</h2>
        <button onClick={onBack} className="amazon-button-secondary">Return to Marketplace</button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.stockQty < quantity) {
      toast.error(`Only ${product.stockQty} items left in stock.`);
      return;
    }
    onAddToCart(product, quantity, { flavor: selectedFlavor, nicotine: selectedNicotine });
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
            {product.isBestSeller && (
              <div className="absolute top-6 left-6 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-3 rounded-md z-10">
                #1 Best Seller
              </div>
            )}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full aspect-square max-w-md"
            >
              <img src={product.image} alt={product.name} className="w-full h-full object-contain filter drop-shadow-2xl" />
            </motion.div>
          </div>

          {/* Right: Product Details */}
          <div className="w-full lg:w-1/2 p-6 md:p-10 flex flex-col bg-white">
            <div className="mb-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-brand-primary">{product.brand}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight uppercase tracking-tighter">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <Star className="w-4 h-4 text-brand-primary fill-brand-primary" />
                <span className="font-black text-xs text-slate-700">{product.rating}</span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">({product.reviews} reviews)</span>
              </div>
              
              <div className="h-6 w-px bg-slate-100"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 capitalize">{product.category.replace('-', ' ')}</span>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">${product.price.toFixed(2)}</span>
                {product.isExpressDelivery && (
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary bg-slate-900 px-3 py-1.5 rounded-full shadow-lg">
                    <Zap className="w-3 h-3 fill-current" /> Express Hub
                  </span>
                )}
              </div>
              {product.stockQty > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                    Inventory node active — Immediate Dispatch
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-rose-500 rounded-full" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Node Depleted — Awaiting Restock</p>
                </div>
              )}
            </div>

            {/* Options Pickers */}
            <div className="space-y-6 mb-8">
              {flavorOptions.length > 0 && flavorOptions[0] !== 'N/A' && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Flavor Profile</h3>
                  <div className="flex flex-wrap gap-2">
                    {flavorOptions.map(flavor => (
                      <button
                        key={flavor}
                        onClick={() => setSelectedFlavor(flavor)}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                          selectedFlavor === flavor 
                            ? 'border-brand-primary bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                            : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {flavor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {nicotineOptions.length > 0 && nicotineOptions[0] !== 'N/A' && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Strength</h3>
                  <div className="flex flex-wrap gap-2">
                    {nicotineOptions.map(nic => (
                      <button
                        key={nic}
                        onClick={() => setSelectedNicotine(nic)}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                          selectedNicotine === nic 
                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                            : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {nic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-10 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row items-center gap-6">
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
                    onClick={() => setQuantity(Math.min(product.stockQty, quantity + 1))}
                    className="w-12 h-12 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 rounded-[1.5rem] transition-all border border-transparent hover:border-slate-200 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stockQty === 0}
                  className={`flex-1 w-full h-16 rounded-[2rem] flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl transition-all active:scale-95 ${
                    product.stockQty > 0 
                      ? 'bg-slate-900 text-white hover:bg-brand-primary shadow-slate-900/20' 
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  {product.stockQty > 0 ? 'Initialize Secure Order' : 'Asset Unavailable'}
                </button>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-6 mt-10">
                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Shield className="w-4 h-4 text-emerald-500" />
                  </div>
                  Authenticity Verified
                </div>
                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                   <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
                    <Truck className="w-4 h-4 text-brand-primary" />
                  </div>
                  Secure Logistics
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="mt-8 premium-card p-8 lg:p-12">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 pb-4">Product Specifications</h3>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed font-bold text-sm">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
