import PageLayout from './PageLayout';

export default function OurStory() {
    return (
        <PageLayout
            eyebrow="About"
            title="Our Story"
            subtitle="Banana Leaf Store was built for adult customers who want premium devices, transparent sourcing, and a checkout flow that feels fast, clear, and trustworthy."
            ctaLabel="Shop Collection"
            ctaTo="/products"
        >
            <p className="text-sm font-semibold leading-7 text-slate-300">
                We curate products from trusted distributors, prioritize flavor consistency, and design every touchpoint around confidence.
                Our team focuses on clean inventory data, compliant age-gating, and modern customer support that respects your time.
            </p>
            <p className="text-sm font-semibold leading-7 text-slate-300">
                From first browse to delivery updates, Banana Leaf blends premium storefront aesthetics with reliable backend operations.
                The result is a store that feels elevated while staying practical for repeat orders.
            </p>
        </PageLayout>
    );
}
