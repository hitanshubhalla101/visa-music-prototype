import { useEffect, useRef, useState } from 'react';
import type { CampaignConfig } from '../config/campaign';
import { eventDateLong, eventTimeLabel, instantParts, n } from '../lib/format';
import { useLatest } from '../lib/useLatest';
import { Art } from './Art';
import { IconArrow, IconCheck, IconCopy, IconInfo, IconLock, IconTicket } from './Icons';
import { PresenterRow, Spinner, SuccessCheck } from './Journey';
import { BEAT } from '../motion/beat';
import { Pulse, usePulse } from '../motion/Pulse';
import { BeatWords, Roll } from '../motion/Text';

/** Eligible, then the duplicate / entitlement check, then on to the code. */
export function EligibleAccess({ onDone, presenter, onAllocationError }: { onDone: () => void; presenter: boolean; onAllocationError: () => void }) {
  const [phase, setPhase] = useState<'eligible' | 'confirming'>('eligible');
  usePulse(phase === 'eligible' ? 'dot' : 'bars');
  const done = useLatest(onDone);
  useEffect(() => {
    const a = setTimeout(() => setPhase('confirming'), 1400);
    const b = setTimeout(() => done.current(), 3200);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [done]);
  return (
    <div className="py-4 text-center">
      <SuccessCheck />
      <h1 className="display mt-5 text-[28px] sm:text-[32px]"><BeatWords parts="Your Visa card is eligible." /></h1>
      <div className="mt-6 flex h-10 items-center justify-center gap-3 text-[15px] text-dim">
        {phase === 'confirming' ? (
          <span className="anim-fade inline-flex items-center gap-3"><Spinner size={22} /> Confirming access…</span>
        ) : (
          <span className="text-mute">One moment…</span>
        )}
      </div>
      <PresenterRow show={presenter}>
        <button type="button" className="presenter-chip" onClick={onAllocationError}>Simulate code allocation failure</button>
      </PresenterRow>
    </div>
  );
}

function useCountTo(target: number) {
  const [v, setV] = useState(target + 1);
  useEffect(() => {
    const t = setTimeout(() => setV(target), 900);
    return () => clearTimeout(t);
  }, [target]);
  return v;
}

export function CodeScreen({ c, code, remaining, onContinue }: { c: CampaignConfig; code: string; remaining: number; onContinue: () => void }) {
  const [copied, setCopied] = useState(false);
  const shown = useCountTo(remaining);
  // the celebration: the pulse bursts into an equalizer, then settles while the code lands
  usePulse('burst');
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); } catch { /* clipboard blocked: the code is still selectable */ }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2200);
  };
  const close = instantParts(c.campaignCloseDateTime, c.timezone);
  return (
    <div className="text-center">
      <SuccessCheck size={84} />
      <h1 className="display mt-5 text-[30px] sm:text-[36px]"><BeatWords parts="Your access code is ready" start={BEAT} /></h1>
      <p className="mx-auto mt-2 max-w-sm text-[15.5px] leading-relaxed text-dim">
        Use this code on {c.ticketPartner} to access eligible tickets.
      </p>

      <div className="relative mx-auto mt-7 overflow-hidden rounded-2xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-5 sm:p-5 shadow-[0_0_60px_-20px_var(--accent-glow)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Your unique access code</div>
        <div className="mt-2 flex items-center justify-center gap-2 sm:gap-3">
          <output className="anim-code select-all whitespace-nowrap font-mono text-[24px] font-semibold tracking-[0.08em] min-[400px]:text-[28px] sm:text-[38px]" aria-label={`Access code ${code.split('').join(' ')}`}>
            {code}
          </output>
          <button type="button" onClick={copy} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/85 hover:border-white/50 hover:text-white" aria-label="Copy code">
            {copied ? <IconCheck size={18} className="text-ok" /> : <IconCopy size={18} />}
          </button>
        </div>
        <div className="mt-1 h-5 text-[12.5px] text-ok" aria-live="polite">{copied ? 'Copied to clipboard' : ''}</div>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-left text-[13.5px] leading-snug text-white/85">
        <IconInfo size={18} className="mt-0.5 shrink-0 text-warn" />
        <span><strong className="font-semibold">Important:</strong> Receiving an access code does not guarantee ticket availability.</span>
      </div>

      <button type="button" className="btn btn-primary btn-block mt-6" onClick={onContinue}>
        Continue to {c.ticketPartner} <IconArrow size={18} />
      </button>

      <div className="mt-5 grid grid-cols-2 gap-3 text-left">
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11.5px] text-mute">Codes remaining</div>
          <div className="mt-0.5 font-mono text-[18px] font-semibold tabular-nums"><Roll value={n(shown)} /></div>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11.5px] text-mute">Offer ends</div>
          <div className="mt-0.5 text-[13.5px] font-medium leading-tight">{close.date}<br /><span className="text-mute">{close.time}</span></div>
        </div>
      </div>
      <p className="mt-4 text-[12.5px] text-mute">One code per eligible card. Keep this code: you’ll need it at checkout.</p>
    </div>
  );
}

// ── Simulated ticketing partner page (not an iframe, not the partner's branding) ──
const SECTIONS = [
  { id: 'A', name: 'Section A · Floor', price: '$189 – $249', left: 'Limited' },
  { id: 'B', name: 'Section B · Lower Bowl', price: '$129 – $179', left: 'Available' },
  { id: 'C', name: 'Section C · Upper Bowl', price: '$69 – $99', left: 'Available' },
];

export function PartnerPage({
  c, code, unlocked, onApply, onBack, presenter,
}: {
  c: CampaignConfig; code: string; unlocked: boolean; onApply: () => void; onBack: () => void; presenter: boolean;
}) {
  const [value, setValue] = useState(code);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const apply = useLatest(onApply);
  useEffect(() => setValue(code), [code]);
  const submit = () => {
    if (value.trim().toUpperCase() !== code) { setErr('This code isn’t valid for this event.'); return; }
    setErr(''); setBusy(true);
    setTimeout(() => { setBusy(false); apply.current(); }, 1100);
  };
  return (
    <main className="min-h-svh bg-[#f4f5f8] pt-16 text-[#111827]">
      <div className="bg-[#1b1d2a] px-4 py-2 text-center text-[12.5px] text-white/85">
        <Pulse shape="rest" size="sm" vt className="mr-2 [--accent:#5b82ff]" /><strong className="font-semibold">Simulated partner page · prototype only.</strong> In production this is {c.ticketPartner}’s own site.
        {presenter && <span className="ml-2 text-[#d9c8ff]">(Presenter: handoff from Visa ends at the link)</span>}
      </div>
      <div className="border-b border-black/10 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-display text-[18px] font-bold tracking-tight">
            <IconTicket size={20} /> {c.ticketPartner}
            <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black/50">Mock</span>
          </div>
          <button type="button" onClick={onBack} className="text-[13px] font-medium text-black/60 hover:text-black">← Back to Visa Music</button>
        </div>
      </div>

      <div className="relative h-48 overflow-hidden sm:h-60">
        <Art image={c.heroImage} crowd />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-4 pb-5 text-white sm:px-6">
          <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/75">{c.tourName}</div>
          <h1 className="font-display text-[30px] font-bold tracking-tight sm:text-[40px]">{c.artistName}</h1>
          <div className="text-[14px] text-white/85">{eventDateLong(c)} · {eventTimeLabel(c)} · {c.venue}, {c.city}{c.state ? `, ${c.state}` : ''}</div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
        <section>
          {!unlocked ? (
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="text-[20px] font-bold tracking-tight">Visa Presale</h2>
              <p className="mt-1 text-[14.5px] text-black/65">Enter your offer code to unlock tickets reserved for eligible Visa cardholders.</p>
              <label className="mt-5 block text-[13px] font-semibold text-black/70" htmlFor="offer">Offer code</label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <input id="offer" value={value} onChange={(e) => setValue(e.target.value)}
                  className="h-12 flex-1 rounded-xl border border-black/15 px-4 font-mono text-[16px] uppercase tracking-[0.08em] focus:border-[#1434cb] focus:outline-none focus:ring-4 focus:ring-[#1434cb]/15" />
                <button type="button" onClick={submit} disabled={busy}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#111827] px-6 text-[15px] font-semibold text-white hover:bg-black disabled:opacity-60">
                  {busy ? 'Applying…' : 'Apply Code'}
                </button>
              </div>
              {err && <p className="mt-2 text-[13px] font-medium text-[#b42318]">{err}</p>}
            </div>
          ) : (
            <div className="anim-rise">
              <div className="flex items-center gap-3 rounded-2xl border border-[#12b76a]/30 bg-[#ecfdf3] p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#12b76a] text-white"><IconLock size={18} /></span>
                <div>
                  <div className="text-[15.5px] font-bold text-[#05603a]">Eligible Visa ticket inventory unlocked</div>
                  <div className="font-mono text-[12.5px] text-[#05603a]/80">Code {code} applied</div>
                </div>
              </div>
              <ul className="mt-5 grid gap-3">
                {SECTIONS.map((s, i) => (
                  <li key={s.id} className={`anim-rise d${i + 1} flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-5 shadow-sm`}>
                    <div>
                      <div className="text-[16px] font-bold">{s.name}</div>
                      <div className="mt-0.5 text-[13.5px] text-black/60">{s.price} · {s.left}</div>
                    </div>
                    <button type="button" disabled title="Checkout is handled by the ticketing partner (not part of this prototype)"
                      className="h-10 cursor-not-allowed rounded-xl border border-black/15 px-4 text-[13.5px] font-semibold text-black/40">
                      Select
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-5 flex items-start gap-2 text-[13px] text-black/60">
            <IconInfo size={16} className="mt-0.5 shrink-0" />
            Ticket availability and purchase are managed by the ticketing partner. Prices shown are illustrative.
          </p>
        </section>
        <aside className="h-fit rounded-2xl border border-black/10 bg-white p-5 text-[14px] shadow-sm">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-black/45">Event</div>
          <div className="mt-1 font-bold">{c.eventName}</div>
          <dl className="mt-3 grid gap-2 text-black/70">
            <div><dt className="inline font-medium text-black/50">Venue · </dt><dd className="inline">{c.venue}</dd></div>
            <div><dt className="inline font-medium text-black/50">City · </dt><dd className="inline">{c.city}{c.state ? `, ${c.state}` : ''}</dd></div>
            <div><dt className="inline font-medium text-black/50">Date · </dt><dd className="inline">{eventDateLong(c)}</dd></div>
            <div><dt className="inline font-medium text-black/50">Time · </dt><dd className="inline">{eventTimeLabel(c)}</dd></div>
          </dl>
        </aside>
      </div>
    </main>
  );
}

