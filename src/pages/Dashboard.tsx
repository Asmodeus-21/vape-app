import { Link } from 'react-router-dom';

interface DashboardProps {
    userName: string;
    email: string;
}

export default function Dashboard({ userName, email }: DashboardProps) {
    return (
        <section className="mx-4 mt-6 rounded-[2rem] border border-slate-800 bg-[#0f172a] px-6 py-12 text-white shadow-[0_28px_70px_rgba(2,6,23,0.55)] md:px-12 md:py-16">
            <div className="mx-auto max-w-4xl space-y-8">
                <header className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#4AB1F4]">Dashboard</p>
                    <h1 className="text-3xl font-black uppercase tracking-tight md:text-4xl">My Account</h1>
                    <p className="text-sm font-semibold text-slate-300">Signed in as {userName} ({email}).</p>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                    <article className="rounded-2xl border border-slate-700 bg-slate-900/60 px-6 py-5">
                        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Order Status</h2>
                        <p className="mt-2 text-sm font-semibold leading-7 text-slate-300">Track recent purchases and delivery updates in one place.</p>
                    </article>
                    <article className="rounded-2xl border border-slate-700 bg-slate-900/60 px-6 py-5">
                        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Saved Items</h2>
                        <p className="mt-2 text-sm font-semibold leading-7 text-slate-300">Maintain a shortlist of products you want to revisit later.</p>
                    </article>
                </div>

                <Link
                    to="/products"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#4AB1F4] px-6 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#2f9ce5]"
                >
                    Return To Marketplace
                </Link>
            </div>
        </section>
    );
}
