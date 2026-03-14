import React, { useEffect, useState } from 'react';
import { Package, Trash2, Edit3, Loader2, AlertCircle, X } from 'lucide-react';
import { fetchVendorProducts, deleteVendorProduct } from '../services/api';
import { Product } from '../types';
import VendorProductForm from './VendorProductForm';
import toast from 'react-hot-toast';

interface VendorProductListProps {
  token: string;
}

export default function VendorProductList({ token }: VendorProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, [token]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchVendorProducts(token);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load vendor products:', err);
      toast.error('Could not load your products.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteVendorProduct(token, productId);
      toast.success('Product deleted');
      await loadProducts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white p-16 text-center rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 mt-8">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-slate-200" />
        </div>
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Inventory Empty</h3>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest max-w-xs mx-auto mt-4 leading-loose">Initialize your supply chain by adding your first premium hardware listing.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mt-8">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Inventory Ledger</h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Found {products.length} registered hardware nodes</p>
        </div>
      </div>

      {editingProduct && (
        <VendorProductForm 
          token={token}
          initialData={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            setEditingProduct(null);
            loadProducts();
          }}
        />
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-8 py-6">Hardware Node</th>
              <th className="px-8 py-6">Unit Value</th>
              <th className="px-8 py-6">Inventory State</th>
              <th className="px-8 py-6">Classification</th>
              <th className="px-8 py-6 text-right">Operational Logic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl p-2 flex-shrink-0 shadow-sm group-hover:rotate-3 transition-transform">
                      <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{p.name}</div>
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">{p.brand}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-sm font-black text-slate-900 tracking-tighter">${p.price.toFixed(2)}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${p.stockQty < 20 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className={`text-xs font-black uppercase tracking-widest ${p.stockQty < 20 ? 'text-rose-500' : 'text-slate-900'}`}>
                      {p.stockQty} Units
                    </span>
                    {p.stockQty < 20 && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                    {p.category}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={() => setEditingProduct(p)}
                      className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-brand-primary hover:border-brand-primary hover:shadow-lg transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 hover:border-rose-500 hover:shadow-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
