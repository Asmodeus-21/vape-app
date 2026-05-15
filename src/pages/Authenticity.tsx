import PageLayout from './PageLayout';

const CHECKS = [
    'Authorized distributor sourcing',
    'Batch-level product verification',
    'Counterfeit screening before listing',
    'Inventory and lot traceability',
];

export default function Authenticity() {
    return (
        <PageLayout
            eyebrow="About"
            title="Authenticity"
            subtitle="Every SKU on Banana Leaf passes a documented authenticity workflow before it appears in the marketplace."
        >
            <ul className="grid gap-4 md:grid-cols-2">
                {CHECKS.map((item) => (
                    <li key={item} className="rounded-2xl border border-slate-700 bg-slate-900/60 px-5 py-4 text-sm font-semibold text-slate-200">
                        {item}
                    </li>
                ))}
            </ul>
            <p className="text-sm font-semibold leading-7 text-slate-300">
                If a product fails verification or arrives with quality concerns, we remove it from active inventory immediately and provide rapid customer remediation.
            </p>
        </PageLayout>
    );
}
