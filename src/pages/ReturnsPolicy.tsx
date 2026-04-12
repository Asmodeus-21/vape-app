import PageLayout from './PageLayout';

export default function ReturnsPolicy() {
    return (
        <PageLayout
            eyebrow="Support"
            title="Returns Policy"
            subtitle="We keep returns straightforward: clear eligibility, quick review, and fast resolution."
        >
            <ul className="space-y-3 text-sm font-semibold leading-7 text-slate-300">
                <li>Unopened products are eligible for return within 7 days of delivery.</li>
                <li>Defective or incorrect items are prioritized for replacement or refund.</li>
                <li>Items must include original packaging and order reference details.</li>
                <li>Return status updates are sent by email throughout review and processing.</li>
            </ul>
        </PageLayout>
    );
}
