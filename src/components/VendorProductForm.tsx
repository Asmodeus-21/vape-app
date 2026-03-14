import React, { useState } from 'react';
import { PackagePlus, Upload, X, Loader2, DollarSign, Tag, FileText, Beaker, Edit } from 'lucide-react';
import { createVendorProduct, updateVendorProduct, fetchProducts } from '../services/api';
import toast from 'react-hot-toast';

interface VendorProductFormProps {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any; // To differentiate between Add and Edit
}

export default function VendorProductForm({ token, onClose, onSuccess, initialData }: VendorProductFormProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    brand: initialData?.brand || '',
    flavor: initialData?.flavor || 'N/A',
    nicotine: initialData?.nicotine || 'N/A',
    price: initialData?.price?.toString() || '',
    category: initialData?.category || 'Disposables',
    description: initialData?.description || '',
    stockQty: initialData?.stockQty?.toString() || '100',
    image: initialData?.image || '/images/products/placeholder.webp'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.name || !formData.price || !formData.category || !formData.description) {
        throw new Error('Please fill out all required fields.');
      }
      
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stockQty: parseInt(formData.stockQty, 10),
      };

      if (isEdit) {
        await updateVendorProduct(token, initialData.id, payload);
        toast.success('Product updated successfully!');
      } else {
        await createVendorProduct(token, payload);
        toast.success('Product successfully added to VapesHub!');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || `Error ${isEdit ? 'updating' : 'creating'} product`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end bg-slate-900/60 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-xl bg-white h-full shadow-[-32px_0_64px_-16px_rgba(0,0,0,0.3)] overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 p-8 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 ${isEdit ? 'bg-slate-900' : 'bg-brand-primary'} rounded-2xl flex items-center justify-center shadow-lg rotate-3`}>
              {isEdit ? <Edit className="w-6 h-6 text-brand-primary" /> : <PackagePlus className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{isEdit ? 'Asset Modification' : 'New Product Entry'}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{isEdit ? 'Updating supply node parameters' : 'Registering new SKU in the Hub network'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Image Upload (Mock) */}
          {/* Image Upload (Mock) */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Visual Identification</label>
            <div className="border border-slate-100 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-all cursor-pointer group bg-slate-50/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-all relative z-10">
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-brand-primary" />
              </div>
              <p className="font-black text-slate-900 text-xs uppercase tracking-widest relative z-10">Initialize Capture</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 relative z-10">PNG / JPG Protocol Max 5MB</p>
              <div className="mt-6 px-4 py-2 bg-white rounded-xl text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] shadow-sm relative z-10">
                Status: Awaiting Stream Source
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Market Designation *</label>
              <div className="relative">
                <Tag className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Geekvape Legend 3" 
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold text-xs"
                  required
                />
              </div>
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Manufacturer Node</label>
              <input 
                type="text" 
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. Geekvape" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold text-xs"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Tier Classification *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold text-xs text-slate-700 appearance-none"
                required
              >
                <option value="Disposables">Disposables</option>
                <option value="Pod Systems">Pod Systems</option>
                <option value="E-Liquids">E-Liquids</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Market Valuation *</label>
              <div className="relative">
                <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="number" 
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="24.99" 
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold text-xs"
                  required
                />
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Inventory Depth *</label>
              <input 
                type="number" 
                name="stockQty"
                value={formData.stockQty}
                onChange={handleChange}
                min="0"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Flavor */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2"><Beaker className="w-3.5 h-3.5"/> Sensory Profile</label>
              <input 
                type="text" 
                name="flavor"
                value={formData.flavor}
                onChange={handleChange}
                placeholder="e.g. Watermelon Chill" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold text-xs"
              />
            </div>

            {/* Nicotine */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Chemical Density</label>
              <input 
                type="text" 
                name="nicotine"
                value={formData.nicotine}
                onChange={handleChange}
                placeholder="e.g. 5%" 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Detailed Specifications *</label>
            <div className="relative">
              <FileText className="absolute left-6 top-6 w-4 h-4 text-slate-400" />
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                placeholder="Enter full device specifications and logistical notes..." 
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold text-xs resize-none"
                required
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-10 border-t border-slate-100 flex items-center justify-end gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
            >
              Discard
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className={`px-10 py-4 ${isEdit ? 'bg-slate-900 shadow-slate-900/20' : 'bg-brand-primary shadow-brand-primary/20'} text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl transition-all flex items-center gap-3 active:scale-[0.98]`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEdit ? <Edit className="w-4 h-4" /> : <PackagePlus className="w-4 h-4" />)}
              {loading ? (isEdit ? 'Syncing...' : 'Publishing...') : (isEdit ? 'Update Node' : 'Register Asset')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
