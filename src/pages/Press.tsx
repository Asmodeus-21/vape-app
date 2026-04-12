import PageLayout from './PageLayout';

export default function Press() {
    return (
        <PageLayout
            eyebrow="About"
            title="Press"
            subtitle="For media requests, product interviews, and brand collaboration opportunities, contact the Banana Leaf press desk."
            ctaLabel="Contact Team"
            ctaTo="/support/contact"
        >
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-6 py-5">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-white">Press Contact</p>
                <p className="mt-2 text-sm font-semibold text-slate-300">press@banana-leaf.store</p>
                <p className="mt-1 text-sm font-semibold text-slate-300">Mon-Fri, 9AM-6PM PT</p>
            </div>
            <p className="text-sm font-semibold leading-7 text-slate-300">
                Please include your publication, timeline, and specific request details so we can respond with accurate assets and spokesperson availability.
            </p>
        </PageLayout>
    );
}
