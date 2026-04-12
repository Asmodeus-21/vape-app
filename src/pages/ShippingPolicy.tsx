import PageLayout from './PageLayout';

export default function ShippingPolicy() {
    return (
        <PageLayout
            eyebrow="Support"
            title="Shipping Policy"
            subtitle="Our logistics promise is speed with reliability, including transparent status updates from dispatch to delivery."
        >
            <ul className="space-y-3 text-sm font-semibold leading-7 text-slate-300">
                <li>Standard shipping: 3-5 business days.</li>
                <li>Express shipping: 1-2 business days.</li>
                <li>Orders placed before cutoff are processed same day when inventory is available.</li>
                <li>Tracking links are sent to your email as soon as your order ships.</li>
            </ul>
        </PageLayout>
    );
}
