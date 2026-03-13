/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User as UserIcon, 
  MapPin, 
  Menu, 
  X, 
  Sparkles, 
  TrendingUp, 
  Package, 
  Settings, 
  MessageSquare,
  ChevronRight,
  Filter,
  Zap,
  ShieldCheck,
  Star,
  ChevronDown,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, User } from './types';
import { vapeosAI, SYSTEM_INSTRUCTIONS } from './services/aiService';
import { fetchProducts } from './services/api';
import AgeVerification from './components/AgeVerification';
import FlavorExplorer from './components/FlavorExplorer';
import { Toaster, toast } from 'react-hot-toast';

export default function App() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'vendor' | 'admin'>('marketplace');
  const [products, setProducts] = useState<Product[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [showCheckoutVerification, setShowCheckoutVerification] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [cart, setCart] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'bestsellers' | 'newarrivals' | 'express'>('all');

  useEffect(() => {
    fetchProducts().then(data => setProducts(data));

    // AI Pop-up right away
    const timer = setTimeout(() => {
      setAiChatOpen(true);
      setAiMessages([{ role: 'ai', text: "Hey, what can I help you with today?" }]);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => [...prev, product]);
  };

  const handleCheckout = () => {
    if (!isAgeVerified) {
      setShowCheckoutVerification(true);
    } else {
      toast.success("Proceeding to secure payment module...");
    }
  };

  const handleFeatureNotReady = (featureName: string) => {
    toast(`🚧 ${featureName} feature coming soon in v2!`, {
      icon: '🚀',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  const handleAiChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');

    const response = await vapeosAI.generateResponse(userMsg, SYSTEM_INSTRUCTIONS.FLAVOR_EXPERT);
    setAiMessages(prev => [...prev, { role: 'ai', text: response || 'Error' }]);
  };

  const scrollToFlavorExplorer = () => {
    const element = document.getElementById('flavor-explorer-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'bestsellers') return matchesSearch && p.isBestSeller;
    if (activeFilter === 'newarrivals') return matchesSearch && p.isNewArrival;
    if (activeFilter === 'express') return matchesSearch && p.isExpressDelivery;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#eaeded]">
      <Toaster position="top-center" />
      {/* Age Verification Modal (Only at Checkout) */}
      <AnimatePresence>
        {showCheckoutVerification && (
          <AgeVerification onVerified={() => {
            setIsAgeVerified(true);
            setShowCheckoutVerification(false);
          }} />
        )}
      </AnimatePresence>
      {/* Premium Top Nav */}
      <header className="bg-white border-b border-gray-200 text-text-main sticky top-0 z-50">
        <div className="max-w-[1500px] mx-auto flex items-center gap-3 md:gap-6 px-4 py-3">
          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab('marketplace')}>
            <div className="bg-brand-primary p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
              <Zap className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="text-xl md:text-2xl font-extrabold tracking-tight text-brand-secondary">VapesHub</span>
          </div>

          {/* Location - Hidden on mobile */}
          <div className="hidden lg:flex flex-col cursor-pointer hover:text-brand-primary transition-colors">
            <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider">Deliver to</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-brand-primary" />
              <span className="text-sm font-bold">Ukiah 95482</span>
            </div>
          </div>

          {/* Search Bar - Mobile Responsive */}
          <div className="hidden sm:flex flex-1 h-11 rounded-xl overflow-hidden border-2 border-gray-100 focus-within:border-brand-primary transition-all bg-gray-50">
            <div className="hidden md:flex bg-gray-100 text-text-muted px-4 items-center gap-2 border-r border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors">
              <span className="text-xs font-bold uppercase">All</span>
              <ChevronDown className="w-3 h-3" />
            </div>
            <input 
              type="text" 
              className="flex-1 px-4 bg-transparent text-text-main focus:outline-none placeholder:text-gray-400 font-medium"
              placeholder="Search premium vapes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="bg-brand-primary hover:bg-[#f3a847] px-6 flex items-center justify-center transition-colors">
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-3 md:gap-6">
            {/* Account */}
            <div className="hidden md:flex flex-col cursor-pointer group" onClick={() => handleFeatureNotReady('User Accounts')}>
              <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider">Account</span>
              <div className="flex items-center gap-1 group-hover:text-brand-primary transition-colors">
                <span className="text-sm font-bold">Sign In</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>

            {/* Cart */}
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsCartOpen(true)}>
              <div className="relative bg-gray-50 p-2 rounded-xl group-hover:bg-brand-accent transition-colors">
                <ShoppingCart className="w-6 h-6 text-brand-secondary" />
                <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>
              </div>
              <span className="hidden lg:block text-sm font-bold">Cart</span>
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
            />
            <button className="bg-brand-primary px-4">
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Sub Nav - Mobile Responsive */}
        <div className="bg-brand-secondary text-white px-4 py-2 flex items-center gap-4 md:gap-6 text-[10px] md:text-xs font-bold uppercase tracking-widest overflow-x-auto scrollbar-hide">
          <div 
            onClick={() => { setActiveTab('marketplace'); setActiveFilter('all'); }}
            className={`flex items-center gap-2 cursor-pointer hover:text-brand-primary transition-colors whitespace-nowrap ${activeFilter === 'all' ? 'text-brand-primary' : ''}`}
          >
            <Menu className="w-4 h-4" />
            <span>All</span>
          </div>
          <span 
            onClick={() => { setActiveTab('marketplace'); setActiveFilter('bestsellers'); }}
            className={`cursor-pointer hover:text-brand-primary transition-colors whitespace-nowrap ${activeFilter === 'bestsellers' ? 'text-brand-primary' : ''}`}
          >
            Best Sellers
          </span>
          <span 
            onClick={() => { setActiveTab('marketplace'); setActiveFilter('newarrivals'); }}
            className={`cursor-pointer hover:text-brand-primary transition-colors whitespace-nowrap ${activeFilter === 'newarrivals' ? 'text-brand-primary' : ''}`}
          >
            New Arrivals
          </span>
          <span 
            onClick={scrollToFlavorExplorer}
            className="cursor-pointer hover:text-brand-primary transition-colors whitespace-nowrap"
          >
            Flavor Explorer
          </span>
          <span 
            onClick={() => { setActiveTab('marketplace'); setActiveFilter('express'); }}
            className={`hidden md:block cursor-pointer hover:text-brand-primary transition-colors whitespace-nowrap ${activeFilter === 'express' ? 'text-brand-primary' : ''}`}
          >
            VapesHub Express
          </span>
          <div className="flex-1" />
          <div 
            onClick={() => setActiveTab('vendor')}
            className="flex items-center gap-2 text-brand-primary cursor-pointer hover:text-white transition-colors whitespace-nowrap"
          >
            <Zap className="w-3 h-3" />
            <span>Retailer OS</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1500px] mx-auto w-full pb-12">
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            {/* Hero Section */}
            <section className="relative h-[300px] md:h-[600px] overflow-hidden">
              <img src="/images/devices/geekvape-aegis-legend.jpg" alt="Hero" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#eaeded]" />
            </section>

            {/* Product Grid - Amazon Style Cards */}
            <div className="px-4 -mt-20 md:-mt-60 relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Featured Categories */}
              {[
                { title: 'Shop by Category', items: [{name: 'Mods', img: '/images/devices/smok-nord-4-kit.jpg'}, {name: 'Disposables', img: '/images/devices/elf-bar-bc5000.png'}, {name: 'Accessories', img: '/images/accessories/cotton-bacon-prime.jpg'}, {name: 'Glass', img: '/images/glass/ash-catcher-14mm.jpeg'}] },
                { title: 'Top Rated Hardware', items: [{name: 'Puffco Plus', img: '/images/devices/puffco-plus-pen.jpeg'}, {name: 'Uwell Caliburn', img: '/images/devices/uwell-caliburn-g2.webp'}, {name: 'Vaporesso XROS 3', img: '/images/devices/vaporesso-xros-3.png'}, {name: 'Vuse Alto', img: '/images/devices/vuse-alto-kit.jpg'}] },
                { title: 'Premium Glass', items: [{name: 'Straight Tube', img: '/images/glass/straight-tube-bong.jpg'}, {name: 'Sherlock Pipe', img: '/images/glass/sherlock-pipe-glass.webp'}, {name: 'Spoon Pipe', img: '/images/glass/spoon-pipe-color.jpg'}, {name: 'Gravity Bong', img: '/images/glass/gravity-bong-glass.webp'}] },
                { title: 'VapesHub Express', items: [{name: 'Same-day Pickup', img: '/images/Cloud9 logo.png'}, {name: 'Local Delivery', img: '/images/Cloud9 logo.png'}, {name: 'Subscription', img: '/images/Cloud9 logo.png'}, {name: 'Bulk Deals', img: '/images/Cloud9 logo.png'}] },
              ].map((cat, i) => (
                <div key={i} className="bg-white p-5 flex flex-col h-full shadow-sm">
                  <h3 className="text-xl font-bold mb-4">{cat.title}</h3>
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    {cat.items.map((item, j) => (
                      <div key={j} className="space-y-1 cursor-pointer group" onClick={() => handleFeatureNotReady(`Category ${item.name}`)}>
                        <div className="aspect-square bg-gray-100 overflow-hidden flex items-center justify-center p-2">
                          <img src={item.img} alt={item.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" />
                        </div>
                        <span className="text-xs text-gray-700 font-medium group-hover:text-brand-primary">{item.name}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setActiveTab('marketplace'); setActiveFilter('all'); }} className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mt-4 text-left">Shop now</button>
                </div>
              ))}
            </div>

            {/* Horizontal Scroll Section - Best Sellers */}
            <section className="bg-white mx-4 p-6 shadow-sm rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-brand-primary w-6 h-6" />
                  <h3 className="text-2xl font-bold tracking-tight">
                    {activeFilter === 'all' ? 'Best Sellers in VapesHub' : 
                     activeFilter === 'bestsellers' ? 'Our Top Rated Products' :
                     activeFilter === 'newarrivals' ? 'Just Landed: New Arrivals' :
                     'VapesHub Express: Same Day Delivery'}
                  </h3>
                </div>
                {activeFilter !== 'all' && (
                  <button 
                    onClick={() => setActiveFilter('all')}
                    className="text-sm font-bold text-brand-primary hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <div key={product.id} className="min-w-[240px] max-w-[240px] flex flex-col gap-3 cursor-pointer group">
                      <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center p-6 border border-gray-100 group-hover:border-brand-primary transition-colors">
                        <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-text-main line-clamp-2 group-hover:text-brand-primary transition-colors leading-tight">{product.name}</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex text-[#FFA41C]">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 fill-current ${i < Math.floor(product.rating) ? '' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-brand-secondary">({product.reviews.toLocaleString()})</span>
                        </div>
                        <p className="text-[11px] text-text-muted line-clamp-2 italic">{product.description}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-bold align-top mt-1 text-brand-secondary">$</span>
                          <span className="text-2xl font-extrabold text-brand-secondary">{Math.floor(product.price)}</span>
                          <span className="text-xs font-bold align-top mt-1 text-brand-secondary">{(product.price % 1).toFixed(2).split('.')[1]}</span>
                        </div>
                        {product.isExpressDelivery && (
                          <div className="flex items-center gap-2 bg-brand-accent/30 w-fit px-2 py-0.5 rounded-md">
                            <Zap className="w-3 h-3 text-brand-primary" />
                            <span className="text-[10px] font-bold text-brand-secondary">Fastest Delivery Available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full py-12 text-center text-gray-400 font-bold uppercase tracking-widest">
                    No products found matching this filter
                  </div>
                )}
              </div>
            </section>

            {/* AI Flavor Explorer - Amazon Style Integration */}
            <div className="mx-4" id="flavor-explorer-section">
              <FlavorExplorer />
            </div>

            {/* Recommendations Grid - Premium Cards */}
            <section className="bg-white mx-4 p-8 shadow-sm rounded-xl">
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="text-brand-primary w-7 h-7" />
                <h3 className="text-2xl font-bold tracking-tight">
                  {activeFilter === 'all' ? 'Inspired by your shopping trend' : 'More for You'}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {filteredProducts.map(product => (
                  <div key={product.id} className="flex flex-col gap-4 group p-4 border border-transparent hover:border-gray-100 hover:shadow-xl rounded-2xl transition-all duration-300">
                    <div className="aspect-square bg-gray-50 rounded-xl p-6 relative overflow-hidden">
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                      {product.isExpressDelivery && (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                          <Zap className="w-3 h-3 text-brand-primary" />
                          <span className="text-brand-secondary font-bold text-[10px]">Express</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-base font-bold text-text-main line-clamp-2 group-hover:text-brand-primary transition-colors leading-snug">{product.name}</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="flex text-[#FFA41C]">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 fill-current ${i < Math.floor(product.rating) ? '' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-text-muted">{product.rating}</span>
                        </div>
                        <span className="text-xs font-medium text-text-muted">{product.reviews.toLocaleString()} reviews</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-black text-brand-secondary">${product.price}</div>
                        <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider">In Stock</div>
                      </div>
                      <button 
                        onClick={() => addToCart(product)}
                        className="amazon-button-primary w-full py-3 rounded-xl shadow-lg hover:shadow-brand-primary/20 flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'vendor' && (
          <div className="p-4 space-y-8">
            <div className="bg-white p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">VapesHub Seller Central</h2>
                <p className="text-gray-600">Manage your retail operations and AI growth strategies.</p>
              </div>
              <button className="amazon-button-primary w-full md:w-auto" onClick={() => handleFeatureNotReady('Product Listing')}>Add New Product</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Today\'s Sales', value: '$1,240.50', change: '+5.2%' },
                { label: 'Open Orders', value: '12', change: '3 urgent' },
                { label: 'Inventory Health', value: 'Good', change: '98% in stock' },
                { label: 'Customer Feedback', value: '4.8', change: '12 new reviews' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-4 md:p-5 shadow-sm border-t-4 border-brand-primary">
                  <div className="text-[10px] md:text-sm text-gray-500 uppercase font-bold tracking-wider">{stat.label}</div>
                  <div className="text-lg md:text-2xl font-black my-1">{stat.value}</div>
                  <div className="text-[10px] text-green-600 font-bold">{stat.change}</div>
                </div>
              ))}
            </div>

            {/* VapesHub Intelligence Center - Multiple AI Bots */}
            <div className="bg-white p-6 shadow-sm rounded-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-brand-primary p-2 rounded-xl">
                  <Sparkles className="text-white w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">VapesHub Intelligence Center</h3>
                  <p className="text-xs text-text-muted font-bold">Multiple AI Agents working for your business</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Review Summarizer Bot */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="text-blue-600 w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Review Analyst AI</h4>
                      <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Active</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 italic">"Customers are praising the 'Arctic Breeze' for its long-lasting flavor, but 15% mention the packaging is hard to open."</p>
                  <button className="text-[10px] font-black uppercase tracking-widest text-brand-secondary hover:text-brand-primary transition-colors" onClick={() => handleFeatureNotReady('Analytics Report')}>View Full Report</button>
                </div>

                {/* Inventory Analyst Bot */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Package className="text-orange-600 w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Inventory Optimizer AI</h4>
                      <span className="text-[10px] text-orange-600 font-bold uppercase tracking-widest">Active</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 italic">"Restock Alert: Cloud King Pro is selling 40% faster than predicted. Order 200 units now to avoid stockout."</p>
                  <button className="text-[10px] font-black uppercase tracking-widest text-brand-secondary hover:text-brand-primary transition-colors" onClick={() => handleFeatureNotReady('Inventory Orders')}>Approve Order</button>
                </div>

                {/* Market Trend Bot */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="text-purple-600 w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Market Trends AI</h4>
                      <span className="text-[10px] text-purple-600 font-bold uppercase tracking-widest">Active</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 italic">"Emerging Trend: 'Savory Dessert' profiles are gaining 200% search volume in Ukiah. Consider adding 'Salted Caramel' to inventory."</p>
                  <button className="text-[10px] font-black uppercase tracking-widest text-brand-secondary hover:text-brand-primary transition-colors" onClick={() => handleFeatureNotReady('Trend Explorer')}>Explore Trends</button>
                </div>
              </div>

              <div className="mt-8 p-6 bg-brand-secondary text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <h4 className="text-lg font-black uppercase tracking-widest">Ask VapesHub Intelligence</h4>
                  <p className="text-sm text-gray-300">Get custom reports or business advice from our AI network.</p>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                  <input type="text" placeholder="e.g. 'Summarize my sales for last week'" className="flex-1 md:w-80 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white/20" />
                  <button className="bg-brand-primary text-white p-3 rounded-xl">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 shadow-sm rounded-xl">
              <div className="flex items-center gap-2 mb-6">
                <Globe className="text-brand-primary w-6 h-6" />
                <h3 className="text-xl font-bold">Local Demand Heatmap</h3>
              </div>
              <div className="h-64 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                <div className="text-center space-y-2">
                  <MapPin className="w-8 h-8 mx-auto opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest opacity-40">Interactive Map Loading...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="p-4">
            <div className="bg-white p-12 text-center shadow-sm space-y-4">
              <Settings className="w-16 h-16 text-gray-300 mx-auto" />
              <h2 className="text-2xl font-bold">Platform Administration</h2>
              <p className="text-gray-600 max-w-md mx-auto">Global oversight of VapesHub marketplace, vendor approvals, and fraud detection systems.</p>
              <button className="amazon-button-secondary" onClick={() => handleFeatureNotReady('Admin Dashboard')}>Access Admin Console</button>
            </div>
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
              className="fixed inset-0 bg-brand-secondary/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed top-0 left-0 h-full w-full max-w-[280px] bg-white z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 bg-brand-secondary text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-6 h-6" />
                  <span className="font-bold">Hello, Sign In</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">Shop by Category</h3>
                  <ul className="space-y-4 text-sm font-bold">
                    <li className="flex items-center justify-between">Mods <ChevronRight className="w-4 h-4" /></li>
                    <li className="flex items-center justify-between">Disposables <ChevronRight className="w-4 h-4" /></li>
                    <li className="flex items-center justify-between">E-Liquids <ChevronRight className="w-4 h-4" /></li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">Help & Settings</h3>
                  <ul className="space-y-4 text-sm font-bold">
                    <li>Your Account</li>
                    <li>Customer Service</li>
                    <li onClick={() => { setActiveTab('vendor'); setIsMenuOpen(false); }} className="text-brand-primary">Retailer OS</li>
                    <li>Sign Out</li>
                  </ul>
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
              className="fixed inset-0 bg-brand-secondary/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="text-xl font-black uppercase tracking-widest">Your Cart ({cart.length})</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <ShoppingCart className="w-16 h-16 text-gray-200 mx-auto" />
                    <p className="text-text-muted font-bold uppercase tracking-widest text-sm">Your cart is empty</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="amazon-button-secondary"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  cart.map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <div className="w-20 h-20 bg-gray-50 rounded-xl p-2">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-bold line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-text-muted font-medium">{item.brand}</p>
                        <div className="text-lg font-black text-brand-secondary">${item.price}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
                  <div className="flex items-center justify-between text-xl font-black">
                    <span>Total:</span>
                    <span>${cart.reduce((acc, item) => acc + item.price, 0).toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="amazon-button-primary w-full py-4 rounded-2xl text-lg shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3"
                  >
                    <ShieldCheck className="w-6 h-6" />
                    <span>Secure Checkout</span>
                  </button>
                  <p className="text-[10px] text-center text-text-muted font-bold uppercase tracking-widest">Age Verification Required at Checkout</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating AI Chat - Bottom Right */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[60] flex flex-col items-end gap-3 md:gap-4 pointer-events-none w-[calc(100vw-2rem)] md:w-auto">
        <AnimatePresence>
          {aiChatOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full md:w-[320px] h-[350px] md:h-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden pointer-events-auto"
            >
              <div className="bg-brand-secondary text-white p-2 md:p-3 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  <div className="bg-brand-primary p-1 rounded-md shadow-inner">
                    <Sparkles className="text-white w-3.5 h-3.5 md:w-4 md:h-4" />
                  </div>
                  <div>
                    <span className="block font-black uppercase tracking-widest text-[8px] md:text-[9px]">VAPEOS AI</span>
                  </div>
                </div>
                <button onClick={() => setAiChatOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-3 bg-gray-50/30">
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-2.5 rounded-xl text-[10px] md:text-[11px] font-medium shadow-sm ${
                      msg.role === 'user' 
                      ? 'bg-brand-primary text-white rounded-tr-none' 
                      : 'bg-white text-brand-secondary border border-gray-50 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAiChat} className="p-2 md:p-3 bg-white border-t border-gray-50">
                <div className="flex gap-1.5">
                  <input 
                    type="text" 
                    placeholder="Ask AI..." 
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-[10px] md:text-[11px] focus:outline-none focus:border-brand-primary focus:bg-white transition-all font-medium"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="bg-brand-primary text-white p-1.5 rounded-lg shadow-md hover:scale-105 active:scale-95 transition-all">
                    <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
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
          className="bg-brand-primary text-white p-3.5 md:p-4 rounded-full shadow-2xl shadow-brand-primary/40 pointer-events-auto flex items-center justify-center group relative"
        >
          {aiChatOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />}
          {!aiChatOpen && (
            <span className="absolute right-full mr-4 bg-white text-brand-secondary px-4 py-2 rounded-xl text-[10px] md:text-xs font-black shadow-xl border border-gray-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
              Need help? Ask AI
            </span>
          )}
        </motion.button>
      </div>

      {/* Footer - Premium Styling */}
      <footer className="bg-brand-secondary text-white mt-auto">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-full bg-[#1a5a8e] hover:bg-[#206fb0] py-4 text-xs font-black uppercase tracking-[0.2em] transition-colors"
        >
          Back to top
        </button>
        
        <div className="max-w-[1200px] mx-auto py-16 px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6 text-brand-primary">Get to Know Us</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Careers')}>Careers</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Blog')}>Blog</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('About')}>About VapesHub</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Sustainability')}>Sustainability</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6 text-brand-primary">Make Money</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Sell on VapesHub')}>Sell on VapesHub</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Retailer OS Info')}>VapesHub OS for Shops</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Affiliates')}>Become an Affiliate</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Advertising')}>Advertise Products</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6 text-brand-primary">Payment</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Rewards Card')}>VapesHub Rewards Visa</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Store Card')}>Store Card</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Business Card')}>Business Card</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Points Checkout')}>Shop with Points</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6 text-brand-primary">Support</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Account Tracking')}>Your Account</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Order Tracking')}>Your Orders</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Shipping Info')}>Shipping Rates</li>
              <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleFeatureNotReady('Returns Policy')}>Returns & Replacements</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-10 flex flex-col items-center gap-6 bg-brand-secondary/50">
          <div className="flex items-center gap-3">
            <Zap className="text-brand-primary w-8 h-8" />
            <span className="text-2xl font-black tracking-tighter">VapesHub</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <span className="hover:text-white cursor-pointer transition-colors">Conditions of Use</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Notice</span>
            <span className="hover:text-white cursor-pointer transition-colors">Interest-Based Ads</span>
          </div>
          <p className="text-[10px] text-gray-500 font-medium">© 2026, VapesHub.com, Inc. or its affiliates. Strict age verification in place.</p>
        </div>
      </footer>

      {/* Floating AI Trigger */}
      <button 
        onClick={() => setAiChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-primary text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    </div>
  );
}
