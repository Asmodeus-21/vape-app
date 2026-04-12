import PageLayout from './PageLayout';

export default function Contact() {
    return (
        <PageLayout
            eyebrow="Support"
            title="Contact"
            subtitle="Need help with your order or account? Reach our support team and we will respond as quickly as possible."
            ctaLabel="Email Support"
            ctaTo="mailto:support@banana-leaf.store"
        >
            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-6 py-5">
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-white">Support</p>
                    <p className="mt-2 text-sm font-semibold text-slate-300">support@banana-leaf.store</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-6 py-5">
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-white">Hours</p>
                    <p className="mt-2 text-sm font-semibold text-slate-300">Mon-Fri, 9AM-6PM PT</p>
                </div>
            </div>
        </PageLayout>
    );
}
