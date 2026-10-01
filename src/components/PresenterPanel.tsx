import { useState } from 'react';
import type { FlowKey } from '../config/campaign';
import type { StepDef } from '../flows/types';
import { stepById } from '../flows/types';
import { FLOWS, useDemo, type DecisionStatus } from '../state/DemoContext';
import { DjaPipeline } from './Entry';
import { IconBack, IconChevron, IconCopy, IconSliders, IconX, IconArrow } from './Icons';

const HOME: StepDef = {
  id: 'home',
  label: 'Campaign selector',
  group: 'journey',
  consumer: 'An overview with the two standardized experiences. In production, fans arrive on a campaign page directly from Visa marketing, not here.',
  platform: [
    'One codebase and two journey templates: Access (Presale / Preferred) and Register-to-Win.',
    'Each campaign is configuration: artist, event, window, market, language, eligibility rule, inventory, partner, rules.',
    'Shared services: Visa card verification (VCES), bot protection, queue, consent capture, reporting.',
  ],
  decisions: [
    'Who owns campaign set-up: Tevnt operations, Visa, or an agency?',
    'What lead time does Visa need to launch a configured campaign?',
    'Is the same VCES integration used for both journeys?',
    'Which markets and languages are in scope for the first release?',
  ],
};

const STATUS: Array<[DecisionStatus, string]> = [['open', 'Open'], ['confirmed', 'Confirmed'], ['changed', 'Changed']];

export function PresenterPanel({ flow }: { flow: FlowKey | null }) {
  const d = useDemo();
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!d.presenter) return null;

  const def = flow ? FLOWS[flow] : null;
  const step = flow ? d.steps[flow] : 'home';
  const s = def ? stepById(def, step) : HOME;
  const walkIdx = def ? def.walk.indexOf(step) : -1;
  const prev = () => def && d.go(def.key, def.walk[Math.max(0, (walkIdx < 0 ? 1 : walkIdx) - 1)]);
  const next = () => def && d.go(def.key, def.walk[Math.min(def.walk.length - 1, walkIdx + 1)]);
  const keyFor = (q: string) => `${flow ?? 'home'}:${s.id}:${q}`;

  const exportNotes = async () => {
    const lines = ['# Visa Music Experiences — decisions to confirm', '', `Exported ${new Date().toLocaleString()}`, ''];
    const sections: Array<[string, StepDef[], string]> = [['Overview', [HOME], 'home'], ['Flow A · Presale / Preferred Access', FLOWS.access.steps, 'access'], ['Flow B · Register-to-Win', FLOWS.sweeps.steps, 'sweeps']];
    for (const [title, steps, fk] of sections) {
      lines.push(`## ${title}`, '');
      for (const st of steps) {
        lines.push(`### ${st.label}`);
        for (const q of st.decisions) {
          const n = d.decisions[`${fk}:${st.id}:${q}`];
          lines.push(`- [${n?.status === 'confirmed' ? 'x' : ' '}] ${q}${n && n.status !== 'open' ? ` — **${n.status}**` : ''}${n?.note ? `\n  - Note: ${n.note}` : ''}`);
        }
        lines.push('');
      }
    }
    const md = lines.join('\n');
    try { await navigator.clipboard.writeText(md); } catch { /* fall through to download */ }
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'visa-music-decisions.md'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const answered = s.decisions.filter((q) => d.decisions[keyFor(q)]?.status && d.decisions[keyFor(q)].status !== 'open').length;

  return (
    <aside
      aria-label="Presenter notes"
      className={`presenter-panel fixed inset-x-0 bottom-0 z-50 flex flex-col border-t border-note/40 bg-[#0d0a1c]/95 shadow-[0_-30px_80px_-20px_rgba(0,0,0,.8)] backdrop-blur-xl
        lg:inset-x-auto lg:bottom-0 lg:right-0 lg:top-16 lg:w-[400px] lg:border-l lg:border-t-0 ${collapsed ? 'max-h-[72px] lg:max-h-none' : 'max-h-[62svh] lg:max-h-none'}`}
      style={{ ['--accent' as string]: '#c4a5ff', viewTransitionName: 'vm-presenter' }}
    >
      {/* controls */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-note">Presenter Mode · {def ? def.title : 'Overview'}</div>
            <div className="truncate text-[15px] font-semibold">{s.label}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => setCollapsed(!collapsed)} className="rounded-full p-2 text-white/70 hover:bg-white/10 lg:hidden" aria-label={collapsed ? 'Expand notes' : 'Collapse notes'}>
              <IconChevron size={18} className={collapsed ? 'rotate-180' : ''} />
            </button>
            <button type="button" onClick={() => d.setPresenter(false)} className="rounded-full p-2 text-white/70 hover:bg-white/10" aria-label="Close Presenter Mode">
              <IconX size={18} />
            </button>
          </div>
        </div>
        {def && (
          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={prev} disabled={walkIdx === 0} className="btn btn-ghost btn-sm flex-1 disabled:opacity-40"><IconBack size={16} /> Previous Step</button>
            <button type="button" onClick={next} disabled={walkIdx === def.walk.length - 1} className="btn btn-sm flex-1 bg-note text-[#170b33] hover:brightness-110 disabled:opacity-40">Next Step <IconArrow size={16} /></button>
          </div>
        )}
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 ${collapsed ? 'hidden lg:block' : ''}`}>
        {def && (
          <div className="mb-5">
            <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-mute">Journey</div>
            <div className="flex flex-wrap gap-1.5">
              {def.steps.filter((x) => x.group === 'journey').map((x) => (
                <StateChip key={x.id} active={x.id === step} onClick={() => d.go(def.key, x.id)} n={def.walk.indexOf(x.id) + 1}>{x.label}</StateChip>
              ))}
            </div>
            <div className="mb-2 mt-4 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-mute">Simulate exception</div>
            <div className="flex flex-wrap gap-1.5">
              {def.steps.filter((x) => x.group === 'exception').map((x) => (
                <StateChip key={x.id} warn active={x.id === step} onClick={() => d.go(def.key, x.id)}>{x.label}</StateChip>
              ))}
            </div>
          </div>
        )}

        <Block title="Consumer sees" tone="text-[#9fe3ff]">
          <p>{s.consumer}</p>
        </Block>
        <Block title="Platform does" hint="proposed" tone="text-[#a6f0c6]">
          <ul className="list-disc space-y-1.5 pl-4 marker:text-white/30">
            {s.platform.map((p) => <li key={p}>{p}</li>)}
          </ul>
          {flow === 'sweeps' && (step === 'dja' || step === 'transfer-pending' || step === 'confirmation') && (
            <div className="mt-4 rounded-xl border border-note/30 bg-black/20 p-3.5"><DjaPipeline pending={step === 'transfer-pending'} compact /></div>
          )}
        </Block>
        <Block title="Decisions to confirm" hint={`${answered}/${s.decisions.length} answered`} tone="text-[#ffd48a]">
          <ol className="space-y-3">
            {s.decisions.map((q, i) => {
              const k = keyFor(q), note = d.decisions[k] ?? { status: 'open', note: '' };
              return (
                <li key={q} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex gap-2 text-[13.5px] leading-snug text-white">
                    <span className="font-mono text-[11px] text-[#ffd48a]">Q{i + 1}</span>
                    <span>{q}</span>
                  </div>
                  <div className="mt-2.5 flex gap-1" role="radiogroup" aria-label="Status">
                    {STATUS.map(([v, l]) => (
                      <button key={v} type="button" role="radio" aria-checked={note.status === v} onClick={() => d.setDecision(k, { status: v })}
                        className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                          note.status === v ? (v === 'confirmed' ? 'bg-ok/25 text-ok' : v === 'changed' ? 'bg-warn/25 text-warn' : 'bg-white/15 text-white') : 'text-white/50 hover:bg-white/10'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={note.note}
                    onChange={(e) => d.setDecision(k, { note: e.target.value })}
                    placeholder="Visa’s answer / follow-up…"
                    rows={note.note ? 2 : 1}
                    className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 text-[13px] text-white placeholder:text-white/30 focus:border-note focus:outline-none"
                  />
                </li>
              );
            })}
          </ol>
        </Block>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={exportNotes}><IconCopy size={15} /> {copied ? 'Exported' : 'Export notes'}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => d.setConfigOpen(true)}><IconSliders size={15} /> Configure</button>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-mute">
          Notes stay in this browser only. Keys: <b>P</b> toggle · <b>←/→</b> step.
        </p>
      </div>
    </aside>
  );
}

function StateChip({ active, onClick, children, n, warn }: { active: boolean; onClick: () => void; children: React.ReactNode; n?: number; warn?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors ${
        active ? 'border-note bg-note text-[#170b33]' : warn ? 'border-warn/30 text-[#ffd9a0] hover:bg-warn/10' : 'border-white/15 text-white/80 hover:bg-white/10'}`}>
      {n != null && n > 0 && <span className="font-mono text-[10.5px] opacity-70">{n}</span>}
      {children}
    </button>
  );
}

function Block({ title, hint, tone, children }: { title: string; hint?: string; tone: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className={`text-[11px] font-bold uppercase tracking-[0.18em] ${tone}`}>{title}</h3>
        {hint && <span className="text-[11px] text-mute">{hint}</span>}
      </div>
      <div className="text-[13.5px] leading-relaxed text-white/85">{children}</div>
    </section>
  );
}
