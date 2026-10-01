import { Link, useNavigate } from 'react-router-dom';
import { Art } from '../components/Art';
import { IconArrow, IconSliders } from '../components/Icons';
import { Footer } from '../components/Landing';
import { CATALOG } from '../config/campaign';
import { eventDateLong, typeLabel } from '../lib/format';
import { useDemo } from '../state/DemoContext';
import { STEP, screenTransition } from '../motion/beat';
import { Pulse } from '../motion/Pulse';
import { BeatWords } from '../motion/Text';

export function Home() {
  const { campaigns, setConfigOpen, setPresenter } = useDemo();
  const nav = useNavigate();
  const a = campaigns.access, s = campaigns.sweeps;
  const counts = CATALOG.reduce<Record<string, number>>((m, c) => ((m[c.campaignType] = (m[c.campaignType] || 0) + 1), m), {});

  const cards = [
    {
      to: '/access', flow: 'access', c: a, band: '#5b82ff', label: 'A · Presale / Preferred Access',
      title: 'Presale / Preferred Access',
      body: 'Verify your Visa card and receive a unique ticket access code.',
      steps: ['Queue', 'Security check', 'Card verification', 'Access code', 'Ticketing partner'],
    },
    {
      to: '/sweepstakes', flow: 'sweeps', c: s, band: '#f7b600', label: 'B · Register-to-Win',
      title: 'Register-to-Win',
      body: 'Verify your Visa card, register for the event, and enter the drawing.',
      steps: ['Security check', 'Card verification', 'Entry form', 'Rules & consent', 'DJA drawing'],
    },
  ];

  return (
    <main className="relative overflow-hidden pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(60%_60%_at_30%_0%,rgba(20,52,203,.35),transparent_70%),radial-gradient(40%_50%_at_85%_10%,rgba(247,182,0,.12),transparent_70%)]" aria-hidden="true" />
      <section className="relative mx-auto max-w-[1200px] px-5 pb-10 pt-14 sm:px-6 sm:pt-20">
        <div className="eyebrow anim-rise flex items-center gap-3"><Pulse size="sm" vt /> Visa Music Experiences · Prototype</div>
        <h1 className="display mt-4 max-w-4xl text-[44px] sm:text-[72px]">
          <BeatWords parts="Two standardized journeys." />
          <span className="block text-white/55"><BeatWords parts="Every campaign, one platform." start={STEP * 3} /></span>
        </h1>
        <p className="anim-rise d2 mt-6 max-w-xl text-[17px] leading-relaxed text-dim">
          Choose an experience to walk through the consumer journey step by step. Turn on Presenter Mode at any point to see what the platform does and the decisions we need Visa to confirm.
        </p>
      </section>

      <section className="relative mx-auto grid max-w-[1200px] gap-5 px-5 pb-16 sm:px-6 md:grid-cols-2">
        {cards.map((k, i) => (
          <Link key={k.to} to={k.to} data-flow={k.flow}
            onClick={(e) => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); screenTransition(() => nav(k.to)); }}
            className={`anim-rise d${i + 3} group relative flex min-h-[520px] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-panel transition-all duration-500 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_40px_100px_-30px_var(--accent-glow)]`}>
            <div className="absolute inset-0">
              <Art image={k.c.heroImage} band={k.band} className="transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-gradient-to-t from-night via-night/75 to-night/10" />
            </div>
            <div className="relative mt-auto p-7 sm:p-9">
              <div className="chip chip-accent mb-5 uppercase tracking-[0.14em] text-[11px]">{k.label}</div>
              <h2 className="display text-[36px] sm:text-[44px]">{k.title}</h2>
              <p className="mt-3 max-w-md text-[16.5px] leading-relaxed text-white/85">{k.body}</p>
              <ol className="mt-6 flex flex-wrap gap-x-2 gap-y-1.5 text-[12.5px] text-white/65">
                {k.steps.map((st, j) => (
                  <li key={st} className="flex items-center gap-2">
                    {j > 0 && <span className="text-white/25" aria-hidden="true">→</span>}{st}
                  </li>
                ))}
              </ol>
              <div className="mt-7 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                <div className="min-w-0 text-[13px]">
                  <div className="text-mute">Demo campaign</div>
                  <div className="truncate font-medium">{k.c.artistName} · {eventDateLong(k.c)}</div>
                </div>
                <span className="btn btn-primary shrink-0">Open <IconArrow size={18} /></span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="relative mx-auto max-w-[1200px] px-5 pb-24 sm:px-6">
        <div className="flex flex-col gap-6 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <div className="eyebrow">Operating model</div>
            <p className="display mt-2 text-[26px] sm:text-[32px]">One platform, two standardized journeys, ~150 configured campaigns.</p>
            <p className="mt-2 text-[14px] text-mute">
              Demo catalog: {counts.presale ?? 0} {typeLabel('presale')} · {counts.preferred ?? 0} {typeLabel('preferred')} · {counts.sweepstakes ?? 0} {typeLabel('sweepstakes')}
            </p>
          </div>
          <button type="button" className="btn btn-ghost shrink-0" onClick={() => { setPresenter(true); setConfigOpen(true); }}>
            <IconSliders size={18} /> Campaign configuration
          </button>
        </div>
        <p className="mt-6 text-center text-[13px] text-mute">
          Tip: press <kbd className="rounded border border-white/20 px-1.5 py-0.5 font-mono text-[11px]">P</kbd> for Presenter Mode, then <kbd className="rounded border border-white/20 px-1.5 py-0.5 font-mono text-[11px]">←</kbd> <kbd className="rounded border border-white/20 px-1.5 py-0.5 font-mono text-[11px]">→</kbd> to step through a journey.
        </p>
      </section>
      <Footer />
    </main>
  );
}
