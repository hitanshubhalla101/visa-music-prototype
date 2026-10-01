import { useEffect, useRef, useState } from 'react';
import type { CampaignConfig } from '../config/campaign';
import { eventDateLong, eventTimeLabel, instantParts, typeLabel } from '../lib/format';
import { IconArrow, IconCalendar, IconPin, IconTicket } from './Icons';
import { Roll } from '../motion/Text';

/** Artist, tour, date/time, venue, city — as compact chips. */
export function EventInfo({ c, showTour = true, className = '' }: { c: CampaignConfig; showTour?: boolean; className?: string }) {
  const items = [
    showTour && { icon: <IconTicket size={16} />, text: c.tourName },
    { icon: <IconCalendar size={16} />, text: `${eventDateLong(c)} · ${eventTimeLabel(c)}` },
    { icon: <IconPin size={16} />, text: `${c.venue}, ${c.city}${c.state ? `, ${c.state}` : ''}` },
  ].filter(Boolean) as Array<{ icon: JSX.Element; text: string }>;
  return (
    <ul className={`flex flex-col gap-2 text-[14.5px] text-white/85 ${className}`}>
      {items.map((it) => (
        <li key={it.text} className="flex items-center gap-2.5">
          <span className="text-[var(--accent)]">{it.icon}</span>
          <Roll value={it.text} />
        </li>
      ))}
    </ul>
  );
}

export function TypeBadge({ c }: { c: CampaignConfig }) {
  return (
    <span className="chip chip-accent uppercase tracking-[0.14em] text-[11px]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" aria-hidden="true" />
      {typeLabel(c.campaignType)}
    </span>
  );
}

// Demo clock: a not-yet-open campaign whose configured open time has already passed still
// counts down from 02:17:43, so the scheduled state is always demoable.
const DEMO_OPEN = Date.now() + (2 * 3600 + 17 * 60 + 43) * 1000;
export function opensAt(c: CampaignConfig) {
  const t = Date.parse(c.campaignOpenDateTime);
  return isNaN(t) || t < Date.now() ? DEMO_OPEN : t;
}

function useNow(active = true) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function Digit({ v, label }: { v: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="relative block overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] px-3 py-2 font-mono text-[34px] font-semibold tabular-nums leading-none tracking-tight sm:text-[44px]">
        <span className="block"><Roll value={v} /></span>
      </span>
      <span className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-mute">{label}</span>
    </div>
  );
}

/** HH : MM : SS to an instant; calls onZero once when it arrives. */
export function Countdown({ target, onZero }: { target: number; onZero?: () => void }) {
  const now = useNow();
  const left = Math.max(0, Math.floor((target - now) / 1000));
  const fired = useRef(false);
  useEffect(() => {
    if (left === 0 && !fired.current) { fired.current = true; onZero?.(); }
  }, [left, onZero]);
  const d = Math.floor(left / 86400), h = Math.floor((left % 86400) / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
  const p = (x: number) => String(x).padStart(2, '0');
  return (
    <div className="flex items-start gap-2 sm:gap-3" role="timer" aria-label={`${d ? `${d} days ` : ''}${h} hours ${m} minutes ${s} seconds`}>
      {d > 0 && <><Digit v={String(d)} label="Days" /><Colon /></>}
      <Digit v={p(h)} label="Hours" />
      <Colon />
      <Digit v={p(m)} label="Min" />
      <Colon />
      <Digit v={p(s)} label="Sec" />
    </div>
  );
}
const Colon = () => <span className="pt-3 font-mono text-2xl text-white/35 sm:pt-4 sm:text-3xl" aria-hidden="true">:</span>;

/**
 * The hero's call to action, which depends on campaign state:
 * scheduled (countdown, CTA disabled) or open (CTA live).
 */
export function CampaignStatus({
  c, scheduled, cta, onStart, onOpen, presenter, disclaimer, openWord,
}: {
  c: CampaignConfig;
  scheduled: boolean;
  cta: string;
  onStart: () => void;
  onOpen: () => void;
  presenter: boolean;
  disclaimer: React.ReactNode;
  /** "Presale", "Preferred access", "Entries". */
  openWord: string;
}) {
  const at = opensAt(c);
  const when = instantParts(new Date(at).toISOString(), c.timezone);
  return (
    <div className="mt-7">
      {scheduled && (
        <div className="mb-6 anim-fade">
          <div className="eyebrow mb-3">{openWord} opens in</div>
          <Countdown target={at} onZero={onOpen} />
          <p className="mt-3 text-[14px] text-dim">
            {openWord} opens {when.date} at {when.time}.
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary min-w-[240px] text-[16px]" disabled={scheduled} onClick={onStart}>
          {cta}
          {!scheduled && <IconArrow size={18} />}
        </button>
        {scheduled && presenter && (
          <button type="button" className="presenter-chip" onClick={onOpen}>
            Simulate campaign opening
          </button>
        )}
      </div>
      <p className="mt-3 max-w-md text-[12.5px] leading-relaxed text-mute">{disclaimer}</p>
    </div>
  );
}
