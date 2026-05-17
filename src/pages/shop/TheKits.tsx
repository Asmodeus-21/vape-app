
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveCatalogImage } from '../../shared/product-images';
import { fetchProducts } from '../../services/api';
import { Product } from '../../types';

export default function TheKits() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            const data = await fetchProducts({ category: 'The Kits' });
            if (mounted) {
                setProducts(data);
                setLoading(false);
            }
        };
        void load();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <main className="container mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-2">The Kits</h1>
            <p className="text-sm text-slate-500 mb-8">Live inventory from Supabase category: The Kits</p>

            {loading ? (
                <div className="bg-slate-100 rounded-xl p-8 text-slate-700 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading products...
                </div>
            ) : products.length === 0 ? (
                <div className="bg-slate-100 rounded-xl p-8 text-slate-700">
                    <p>No The Kits products found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                        <Link key={product.id} to={`/product/${product.id}`} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400 transition-colors flex flex-col group cursor-pointer relative z-10">
                            <div className="aspect-square bg-slate-50 rounded-lg mb-4 overflow-hidden relative">
                                <img src={resolveCatalogImage(product.image)} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">{product.brand}</p>
                            <h2 className="mt-1 text-sm font-bold text-slate-900 line-clamp-1">{product.name}</h2>
                            <p className="mt-1 text-xs text-slate-500">{product.flavor}</p>
                            <p className="mt-2 text-sm font-black text-brand-primary">${product.price.toFixed(2)}</p>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
