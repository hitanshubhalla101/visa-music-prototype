import type { ReactNode } from 'react';
import type { CampaignConfig } from '../config/campaign';
import type { FlowDef } from '../flows/types';
import { stepById } from '../flows/types';
import { eventDateLong, eventTimeLabel } from '../lib/format';
import { Art } from './Art';
import { IconAlert, IconBack, IconInfo, IconX } from './Icons';
import { PulseBadge, PulseProvider, usePulse } from '../motion/Pulse';
import { BeatWords } from '../motion/Text';

/** Backdrop, event summary, progress rail and the card every journey screen sits in. */
export function JourneyShell({
  flow, step, c, presenter, onExit, children, wide = false,
}: {
  flow: FlowDef; step: string; c: CampaignConfig; presenter: boolean; onExit: () => void; children: ReactNode; wide?: boolean;
}) {
  const s = stepById(flow, step);
  return (
    <main className="relative min-h-svh pt-16">
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <Art image={c.heroImage} band={flow.key === 'sweeps' ? '#f7b600' : '#5b82ff'} className="scale-110 opacity-70 blur-[2px]" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_30%,rgba(4,6,13,.55),rgba(4,6,13,.94))]" />
      </div>
      <div className={`relative z-10 mx-auto px-4 pb-16 pt-6 sm:px-6 sm:pt-10 ${wide ? 'max-w-3xl' : 'max-w-[34rem]'}`}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <button type="button" onClick={onExit} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full py-1 pr-2 text-[13px] text-white/70 hover:text-white">
            <IconBack size={16} /> Event page
          </button>
          <div className="min-w-0 text-right">
            <div className="truncate font-display text-[15px] font-semibold tracking-tight">{c.artistName}</div>
            <div className="truncate text-[12px] text-mute">
              {eventDateLong(c)} · {eventTimeLabel(c)} · {c.venue}
            </div>
          </div>
        </div>
        <Rail flow={flow} step={step} />
        {presenter && (
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-note">
            <span className="h-1.5 w-1.5 rounded-full bg-note" /> Consumer sees · {s.label}
          </div>
        )}
        <div className="relative mt-5">
          {/* the pulse lives on the card's edge and persists while the screens change beneath it */}
          <PulseProvider render={(p) => <PulseBadge {...p} />}>
            <section
              key={step}
              className={`glass anim-rise rounded-[28px] px-6 pb-6 pt-10 sm:px-9 sm:pb-9 sm:pt-12 ${presenter ? 'outline outline-1 outline-dashed outline-note/50 outline-offset-4' : ''}`}
              aria-live="polite"
            >
              {children}
            </section>
          </PulseProvider>
        </div>
        <p className="mt-6 text-center text-[12px] text-mute">
          Prototype · demo data only · no real card data is collected or stored
        </p>
      </div>
    </main>
  );
}

function Rail({ flow, step }: { flow: FlowDef; step: string }) {
  const idx = flow.rail.findIndex((r) => r.steps.includes(step));
  return (
    <ol className="mb-6 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${flow.rail.length}, minmax(0, 1fr))` }} aria-label="Progress">
      {flow.rail.map((r, i) => {
        const state = idx < 0 ? 'todo' : i < idx ? 'done' : i === idx ? 'now' : 'todo';
        return (
          <li key={r.label} aria-current={state === 'now' ? 'step' : undefined}>
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-700 ease-out"
                style={{ width: state === 'done' ? '100%' : state === 'now' ? '55%' : '0%' }}
              />
            </div>
            <div className={`mt-1.5 truncate text-[11px] font-medium ${state === 'todo' ? 'text-white/40' : 'text-white/85'}`}>{r.label}</div>
          </li>
        );
      })}
    </ol>
  );
}

export function Spinner({ size = 56 }: { size?: number }) {
  return (
    <span className="relative inline-block" style={{ width: size, height: size }} aria-hidden="true">
      <span className="absolute inset-0 rounded-full border-2 border-white/10" />
      <span className="anim-spin absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent)] border-r-[var(--accent)]" />
    </span>
  );
}

/** The confirmation check: ring then tick, drawn once. */
export function SuccessCheck({ size = 76 }: { size?: number }) {
  return (
    <span className="anim-pop relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full bg-ok/15" />
      <span className="absolute inset-0 rounded-full bg-ok/25" style={{ animation: 'pulse-ring 1.6s ease-out 0.5s 2 both' }} />
      <svg viewBox="0 0 56 56" width={size} height={size} className="relative" aria-hidden="true">
        <circle className="check-ring" cx="28" cy="28" r="25" fill="none" stroke="var(--color-ok)" strokeWidth="2.5" />
        <path className="check-path" d="M17 29l7.5 7.5L40 21" fill="none" stroke="var(--color-ok)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

const TONES = {
  warn: { ring: 'bg-warn/15 text-warn', icon: <IconAlert size={30} /> },
  error: { ring: 'bg-err/15 text-err', icon: <IconX size={30} /> },
  info: { ring: 'bg-white/10 text-white', icon: <IconInfo size={30} /> },
};

/** A consumer-facing edge state: icon, headline, one or two sentences, actions. */
export function StatusScreen({
  tone = 'info', icon, eyebrow, title, children, actions,
}: {
  tone?: keyof typeof TONES; icon?: ReactNode; eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode;
}) {
  const t = TONES[tone];
  usePulse('rest');
  return (
    <div className="text-center">
      <span className={`anim-pop mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full ${t.ring}`}>{icon ?? t.icon}</span>
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <h1 className="display text-[28px] sm:text-[34px]"><BeatWords parts={title} /></h1>
      {children && <div className="mx-auto mt-3 max-w-sm text-[15.5px] leading-relaxed text-dim">{children}</div>}
      {actions && <div className="mt-7 flex flex-col gap-3">{actions}</div>}
    </div>
  );
}

export function ScreenTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6">
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <h1 className="display text-[28px] sm:text-[34px]"><BeatWords parts={title} /></h1>
      {children && <p className="mt-2.5 text-[15.5px] leading-relaxed text-dim">{children}</p>}
    </div>
  );
}

export function PresenterRow({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-dashed border-note/30 pt-4">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-note">Presenter</span>
      {children}
    </div>
  );
}
