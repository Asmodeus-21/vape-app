import PageLayout from './PageLayout';

const FAQS = [
    {
        q: 'How fast does shipping take?',
        a: 'Standard shipping typically arrives in 3-5 business days, while express shipping arrives in 1-2 business days.',
    },
    {
        q: 'Do I need an account to purchase?',
        a: 'No. Guest checkout is available. You can optionally verify email to save your details for next time.',
    },
    {
        q: 'How do returns work?',
        a: 'Unopened items can be returned within the policy window. Defective items are reviewed for replacement or refund.',
    },
    {
        q: 'How is age compliance handled?',
        a: 'The checkout flow includes mandatory 21+ confirmation and additional compliance checks where required.',
    },
];

export default function HelpCenter() {
    return (
        <PageLayout
            eyebrow="Support"
            title="Help Center"
            subtitle="Find quick answers for shipping, account access, checkout, and compliance questions."
        >
            <div className="space-y-4">
                {FAQS.map((faq) => (
                    <article key={faq.q} className="rounded-2xl border border-slate-700 bg-slate-900/60 px-6 py-5">
                        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-white">{faq.q}</h2>
                        <p className="mt-2 text-sm font-semibold leading-7 text-slate-300">{faq.a}</p>
                    </article>
                ))}
            </div>
        </PageLayout>
    );
}
