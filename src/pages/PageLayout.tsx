import { Link } from 'react-router-dom';

interface PageLayoutProps {
    eyebrow: string;
    title: string;
    subtitle: string;
    children: React.ReactNode;
    ctaLabel?: string;
    ctaTo?: string;
}

export default function PageLayout({ eyebrow, title, subtitle, children, ctaLabel, ctaTo }: PageLayoutProps) {
    return (
        <section className="mx-4 mt-6 rounded-[2rem] border border-slate-800 bg-[#0f172a] px-6 py-12 text-white shadow-[0_28px_70px_rgba(2,6,23,0.55)] md:px-12 md:py-16">
            <div className="mx-auto max-w-4xl space-y-10">
                <header className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#4AB1F4]">{eyebrow}</p>
                    <h1 className="text-3xl font-black uppercase tracking-tight md:text-4xl">{title}</h1>
                    <p className="max-w-3xl text-sm font-semibold leading-7 text-slate-300 md:text-base">{subtitle}</p>
                    {ctaLabel && ctaTo && (
                        <Link
                            to={ctaTo}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#4AB1F4] px-6 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#2f9ce5]"
                        >
                            {ctaLabel}
                        </Link>
                    )}
                </header>

                <div className="space-y-6">{children}</div>
            </div>
        </section>
    );
}
