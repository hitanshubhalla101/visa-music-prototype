import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { VisaMark } from './Header';
import { IconChevron } from './Icons';

export interface Benefit { icon: ReactNode; title: string; body: string }

export function BenefitStrip({ items }: { items: Benefit[] }) {
  return (
    <section aria-label="Benefits" className="relative border-y border-white/[0.07] bg-deep">
      <div className="mx-auto grid max-w-[1200px] gap-px bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
        {items.map((b) => (
          <div key={b.title} className="bg-deep px-6 py-8 sm:px-7">
            <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">{b.icon}</span>
            <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.16em]">{b.title}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-dim">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Section({ id, eyebrow, title, children, className = '' }: { id?: string; eyebrow?: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-20 mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-24 ${className}`}>
      {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
      <h2 className="display max-w-2xl text-[34px] sm:text-[46px]">{title}</h2>
      <div className="mt-10">{children}</div>
    </section>
  );
}

export function HowItWorks({ steps }: { steps: Array<{ title: string; body: string }> }) {
  return (
    <ol className={`grid gap-4 sm:grid-cols-2 ${steps.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
      {steps.map((s, i) => (
        <li key={s.title} className="group relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6">
          <span className="font-mono text-[13px] font-semibold text-[var(--accent)]">0{i + 1}</span>
          <h3 className="mt-5 font-display text-[21px] font-semibold leading-tight tracking-tight">{s.title}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-dim">{s.body}</p>
          {i < steps.length - 1 && <span className="absolute -right-2.5 top-1/2 hidden h-px w-5 bg-white/20 lg:block" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

export function Faq({ items }: { items: Array<[string, ReactNode]> }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-white/10 border-y border-white/10">
      {items.map(([q, a], i) => (
        <div key={q}>
          <h3>
            <button type="button" className="flex w-full items-center justify-between gap-6 py-5 text-left text-[16.5px] font-medium" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              {q}
              <IconChevron size={20} className={`shrink-0 text-white/60 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`} />
            </button>
          </h3>
          <div className={`grid transition-all duration-300 ease-out ${open === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="max-w-3xl pb-6 text-[15px] leading-relaxed text-dim">{a}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function InfoGrid({ blocks }: { blocks: Array<{ id: string; title: string; body: ReactNode }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {blocks.map((b) => (
        <article key={b.id} id={b.id} className="scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-7">
          <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.16em] text-white">{b.title}</h3>
          <div className="mt-3 space-y-2.5 text-[14.5px] leading-relaxed text-dim">{b.body}</div>
        </article>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-deep">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <VisaMark />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Music Experiences</span>
          </div>
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-mute">
            Interactive prototype for discussion. All artists, venues, events, codes and card numbers are fictional demo data.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 text-[13.5px] text-white/70 sm:grid-cols-3">
          <a href="#terms" className="hover:text-white">Terms</a>
          <a href="#rules" className="hover:text-white">Official Rules</a>
          <a href="#privacy" className="hover:text-white">Privacy</a>
          <a href="#eligibility" className="hover:text-white">Eligibility</a>
          <a href="#faq" className="hover:text-white">FAQs</a>
          <Link to="/" className="hover:text-white">All experiences</Link>
        </nav>
      </div>
      <div className="border-t border-white/[0.06] py-5 text-center text-[12px] text-mute">© 2026 Visa · Prototype build · Not for public use</div>
    </footer>
  );
}
