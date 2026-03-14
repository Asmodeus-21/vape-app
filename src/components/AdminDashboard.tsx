import React, { useEffect, useState } from 'react';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  ShieldCheck, 
  AlertCircle, 
  UserCheck, 
  UserX, 
  Loader2, 
  Search,
  CheckCircle2,
  XCircle,
  Package,
  ClipboardList,
  Eye,
  Trash2,
  UserCog
} from 'lucide-react';
import { 
  fetchAdminUsers, 
  updateAdminUserVerification, 
  fetchAdminProducts, 
  fetchAdminOrders,
  deleteVendorProduct,
  updateAdminUserRole 
} from '../services/api';
import toast from 'react-hot-toast';

interface AdminDashboardProps {
  token: string;
  stats: any;
}

type Tab = 'users' | 'products' | 'orders';

export default function AdminDashboard({ token, stats }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [token, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'users') {
        const users = await fetchAdminUsers(token);
        setData(users);
      } else if (activeTab === 'products') {
        const products = await fetchAdminProducts(token);
        setData(products);
      } else if (activeTab === 'orders') {
        const orders = await fetchAdminOrders(token);
        setData(orders);
      }
    } catch (err: any) {
      toast.error(`Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: number, status: 'verified' | 'rejected' | 'unverified') => {
    setUpdatingId(userId);
    try {
      await updateAdminUserVerification(token, userId, status);
      toast.success(`User status updated to ${status}`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Status update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateRole = async (userId: number, newRole: string) => {
    setUpdatingId(userId);
    try {
      await updateAdminUserRole(token, userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      await loadData();
    } catch (err: any) {
      toast.error('Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Delete this product? It will be removed globally.')) return;
    try {
      await deleteVendorProduct(token, productId);
      toast.success('Product removed');
      await loadData();
    } catch (err: any) {
      toast.error('Failed to delete product');
    }
  };

  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase();
    if (activeTab === 'users') {
      return item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q);
    } else if (activeTab === 'products') {
      return item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q);
    } else if (activeTab === 'orders') {
      return item.customer_name?.toLowerCase().includes(q) || item.shipping_address?.toLowerCase().includes(q) || item.id.toString().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Platform Users', value: stats?.totalUsers || 0, icon: <Users className="text-brand-primary" />, bg: 'bg-emerald-50' },
          { label: 'Active Vendors', value: stats?.totalVendors || 0, icon: <ShoppingBag className="text-slate-900" />, bg: 'bg-slate-100' },
          { label: 'Global Volume', value: `$${stats?.totalSales?.toLocaleString() || 0}`, icon: <DollarSign className="text-brand-primary" />, bg: 'bg-emerald-50' },
          { label: 'Policy Queue', value: stats?.pendingVerifications || 0, icon: <ShieldCheck className="text-rose-500" />, bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="premium-card p-8 flex items-center gap-6 bg-white">
            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center shadow-inner`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-100/50 backdrop-blur p-1.5 rounded-2xl w-fit border border-slate-100">
        {[
          { id: 'users', label: 'Identity', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'products', label: 'Global Supply', icon: <Package className="w-3.5 h-3.5" /> },
          { id: 'orders', label: 'Market Streams', icon: <ClipboardList className="w-3.5 h-3.5" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as Tab); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50' 
                : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="premium-card bg-white">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
          <div>
             <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">{activeTab} Ledger</h3>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Platform Administrative Oversight</p>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Search designated ${activeTab} data...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto text-slate-900">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black tracking-[0.2em] text-slate-400">
              {activeTab === 'users' ? (
                <tr>
                  <th className="px-8 py-6">Validated Entity</th>
                  <th className="px-8 py-6">Privilege Level</th>
                  <th className="px-8 py-6">Compliance</th>
                  <th className="px-8 py-6">Initialized</th>
                  <th className="px-8 py-6 text-right">Operations</th>
                </tr>
              ) : activeTab === 'products' ? (
                <tr>
                  <th className="px-8 py-6">Inventory Node</th>
                  <th className="px-8 py-6">Hardware Vendor</th>
                  <th className="px-8 py-6">Unit Value</th>
                  <th className="px-8 py-6">Supply level</th>
                  <th className="px-8 py-6 text-right">Operations</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-8 py-6">Order Hash</th>
                  <th className="px-8 py-6">Economic Source</th>
                  <th className="px-8 py-6">Total Volume</th>
                  <th className="px-8 py-6">Logistics Phase</th>
                  <th className="px-8 py-6 text-right">Operations</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-primary" />
                    Fetching {activeTab}...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                    No results found
                  </td>
                </tr>
              ) : filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  {activeTab === 'users' ? (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{item.name}</span>
                          <span className="text-xs text-gray-500">{item.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                          item.role === 'admin' ? 'bg-red-50 text-red-600' : 
                          item.role === 'vendor' ? 'bg-blue-50 text-blue-600' : 
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {item.verification_status === 'verified' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          {item.verification_status === 'pending' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                          {item.verification_status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                          <span className="text-xs font-bold capitalize text-gray-700">{item.verification_status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-medium">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {updatingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-brand-primary ml-auto" />
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleUpdateRole(item.id, item.role === 'vendor' ? 'customer' : 'vendor')}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-primary transition-all"
                              title={item.role === 'vendor' ? 'Demote to Customer' : 'Promote to Vendor'}
                            >
                              <UserCog className="w-5 h-5" />
                            </button>
                            {item.role === 'vendor' && item.verification_status !== 'verified' && (
                              <button 
                                onClick={() => handleVerify(item.id, 'verified')}
                                className="p-2 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition-all"
                              >
                                <UserCheck className="w-5 h-5" />
                              </button>
                            )}
                            {item.role === 'vendor' && item.verification_status === 'verified' && (
                              <button 
                                onClick={() => handleVerify(item.id, 'unverified')}
                                className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all"
                              >
                                <UserX className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </>
                  ) : activeTab === 'products' ? (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt="" className="w-8 h-8 rounded bg-gray-100 object-contain" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{item.name}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">{item.brand}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        Vendor #{item.vendor_id || 'SYSTEM'}
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-brand-secondary">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${item.stockQty < 10 ? 'text-red-500' : 'text-gray-700'}`}>
                          {item.stockQty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteProduct(item.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm font-black text-gray-900 uppercase">
                        #{item.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{item.customer_name}</span>
                          <span className="text-[10px] text-gray-500 line-clamp-1">{item.shipping_address}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-brand-secondary">
                        ${item.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                         <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                          item.status === 'delivered' ? 'bg-green-50 text-green-600' : 
                          item.status === 'cancelled' ? 'bg-red-50 text-red-600' : 
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-primary transition-all">
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
