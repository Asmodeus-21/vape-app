import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, Loader2, TrendingUp } from 'lucide-react';
import { fetchVendorOrders, updateVendorOrderStatus } from '../services/api';
import toast from 'react-hot-toast';

interface VendorOrder {
  id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
  customer_name: string;
  customer_email: string;
}

interface VendorOrdersProps {
  token: string;
}

export default function VendorOrders({ token }: VendorOrdersProps) {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchVendorOrders(token);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [token]);

  const handleStatusUpdate = async (orderId: number, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateVendorOrderStatus(token, orderId, nextStatus);
      toast.success(`Order #${orderId} marked as ${nextStatus}`);
      await loadOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 flex items-center justify-center border border-slate-100 shadow-xl shadow-slate-200/50 mt-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing Logistics Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 rounded-2xl p-6 flex flex-col items-center gap-2 border border-red-100 mt-8">
        <AlertCircle className="w-8 h-8" />
        <p className="font-bold">{error}</p>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'processing': return { icon: <Package className="w-3.5 h-3.5" />, color: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'shipped': return { icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'bg-purple-50 text-purple-600 border-purple-100' };
      case 'delivered': return { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'cancelled': return { icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-rose-50 text-rose-600 border-rose-100' };
      default: return { icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-slate-50 text-slate-600 border-slate-100' };
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 mt-8 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Fulfillment Queue</h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Real-time marketplace order stream</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-40">Session Hash</th>
              <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recipient Node</th>
              <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chronology</th>
              <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ledger Value</th>
              <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status State</th>
              <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Ops</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-20 text-center">
                   <div className="flex flex-col items-center gap-4 opacity-20">
                      <Package className="w-12 h-12 text-slate-400" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Queue Status: Idle</p>
                   </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-8">
                       <div className="text-[11px] font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg w-fit border border-slate-200">
                         #{order.id.toString().padStart(6, '0')}
                       </div>
                    </td>
                    <td className="p-8">
                      <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{order.customer_name}</div>
                      <div className="text-[10px] text-slate-400 font-bold lowercase">{order.customer_email}</div>
                    </td>
                    <td className="p-8">
                       <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                         {new Date(order.created_at).toLocaleDateString()}
                       </div>
                    </td>
                    <td className="p-8">
                       <span className="text-sm font-black text-slate-900 tracking-tighter">
                         ${order.total_amount.toFixed(2)}
                       </span>
                    </td>
                    <td className="p-8">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusConfig.color}`}>
                        {statusConfig.icon}
                        {order.status}
                      </div>
                    </td>
                    <td className="p-8 text-right">
                      {updatingId === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-brand-primary ml-auto" />
                      ) : (
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          {order.status === 'processing' && (
                            <button 
                              onClick={() => handleStatusUpdate(order.id, 'shipped')}
                              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all flex items-center gap-2 group/btn"
                            >
                              Dispatch <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          )}
                          {order.status === 'shipped' && (
                            <button 
                              onClick={() => handleStatusUpdate(order.id, 'delivered')}
                              className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 group/btn"
                            >
                              Fulfill <CheckCircle2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
