import { Loader2, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ChatLead, fetchAdminLeads } from '../services/api';

interface AdminLeadsProps {
    token: string;
}

function formatLeadDate(value: string): string {
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
        return value;
    }
    return new Date(timestamp).toLocaleString();
}

export default function AdminLeads({ token }: AdminLeadsProps) {
    const [leads, setLeads] = useState<ChatLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLeads = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAdminLeads(token, 150);
            setLeads(data);
        } catch (err: any) {
            setError(err?.message || 'Failed to load chat leads');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            setError('Missing admin token');
            return;
        }
        void loadLeads();
    }, [loadLeads, token]);

    return (
        <section className="mx-4 mt-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#4AB1F4]">Admin Console</p>
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-tighter text-slate-900">Chat Leads</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Recent customer contact submissions from the AI assistant.</p>
                </div>
                <button
                    type="button"
                    onClick={() => void loadLeads()}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex min-h-36 items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-slate-50">
                    <Loader2 className="h-5 w-5 animate-spin text-[#4AB1F4]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Loading Leads...</span>
                </div>
            ) : leads.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">No Leads Captured Yet</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Captured</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Name</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Email</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Phone</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Query</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Source</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {leads.map((lead) => (
                                <tr key={lead.id}>
                                    <td className="max-w-[180px] px-4 py-3 text-xs font-medium text-slate-700">{formatLeadDate(lead.createdAt)}</td>
                                    <td className="max-w-[160px] px-4 py-3 text-xs font-medium text-slate-700">{lead.name || '-'}</td>
                                    <td className="max-w-[220px] px-4 py-3 text-xs font-medium text-slate-700">{lead.email || '-'}</td>
                                    <td className="max-w-[160px] px-4 py-3 text-xs font-medium text-slate-700">{lead.phone || '-'}</td>
                                    <td className="max-w-[320px] truncate px-4 py-3 text-xs font-medium text-slate-700" title={lead.flavorQuery || ''}>{lead.flavorQuery || '-'}</td>
                                    <td className="max-w-[120px] px-4 py-3 text-xs font-medium text-slate-700">{lead.source}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
