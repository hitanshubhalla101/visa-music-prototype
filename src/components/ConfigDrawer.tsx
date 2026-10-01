import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ART_PRESETS, CATALOG, flowForType, type CampaignConfig, type CampaignType, type FlowKey } from '../config/campaign';
import { fromLocalInput, toLocalInput, typeLabel } from '../lib/format';
import { FLOWS, useDemo } from '../state/DemoContext';
import { Art } from './Art';
import { IconX } from './Icons';

/**
 * Not an admin product: a live demonstration that every campaign is configuration.
 * Edits apply immediately to the landing page behind the drawer.
 */
export function ConfigDrawer({ flow }: { flow: FlowKey | null }) {
  const d = useDemo();
  const nav = useNavigate();
  const [tab, setTab] = useState<'edit' | 'catalog'>('edit');
  const [which, setWhich] = useState<FlowKey>(flow ?? 'access');
  useEffect(() => { if (flow) setWhich(flow); }, [flow]);
  useEffect(() => {
    if (!d.configOpen) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') d.setConfigOpen(false); };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [d]);
  if (!d.configOpen) return null;

  const c = d.campaigns[which];
  const set = (patch: Partial<CampaignConfig>) => d.updateCampaign(which, patch);
  const openFlow = (f: FlowKey) => {
    nav(FLOWS[f].path);
    const st = f === 'access' ? d.steps.access : d.steps.sweeps;
    if (!['landing', 'coming-soon'].includes(st)) d.go(f, 'landing');
  };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Campaign configuration">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-label="Close" onClick={() => d.setConfigOpen(false)} />
      <div className="anim-fade absolute inset-y-0 left-0 flex w-full max-w-[520px] flex-col border-r border-white/10 bg-[#080c1a] shadow-2xl">
        <div className="shrink-0 border-b border-white/10 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-note">Campaign configuration</div>
              <h2 className="mt-1 font-display text-[20px] font-semibold tracking-tight">One platform, two standardized journeys, ~150 configured campaigns.</h2>
            </div>
            <button type="button" onClick={() => d.setConfigOpen(false)} className="rounded-full p-2 text-white/70 hover:bg-white/10" aria-label="Close configuration"><IconX size={18} /></button>
          </div>
          <div className="mt-4 flex gap-1 rounded-full bg-white/5 p-1 text-[13px]">
            {([['edit', 'Edit campaign'], ['catalog', `Catalog (${CATALOG.length})`]] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setTab(v)} className={`flex-1 rounded-full py-1.5 font-medium ${tab === v ? 'bg-white text-night' : 'text-white/70 hover:text-white'}`}>{l}</button>
            ))}
          </div>
        </div>

        {tab === 'edit' ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="mb-5 grid grid-cols-2 gap-2">
              {(['access', 'sweeps'] as FlowKey[]).map((f) => (
                <button key={f} type="button" onClick={() => setWhich(f)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-[13px] ${which === f ? 'border-note bg-note/10' : 'border-white/10 hover:border-white/25'}`}>
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-mute">Template {f === 'access' ? 'A' : 'B'}</div>
                  <div className="font-semibold">{FLOWS[f].title}</div>
                </button>
              ))}
            </div>

            <Group title="Artist & event">
              <Text label="Artist" v={c.artistName} on={(v) => set({ artistName: v, eventName: `${v} — ${c.tourName}` })} />
              <Text label="Tour" v={c.tourName} on={(v) => set({ tourName: v, eventName: `${c.artistName} — ${v}` })} />
              <Text label="Event" v={c.eventName} on={(v) => set({ eventName: v })} />
              <Text label="Venue" v={c.venue} on={(v) => set({ venue: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Text label="City" v={c.city} on={(v) => set({ city: v })} />
                <Text label="State / region" v={c.state} on={(v) => set({ state: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Text label="Event date" type="date" v={c.eventDate} on={(v) => set({ eventDate: v })} />
                <Text label="Event time" type="time" v={c.eventTime} on={(v) => set({ eventTime: v })} />
              </div>
              <Text label="Time zone (IANA)" v={c.timezone} on={(v) => set({ timezone: v })} />
            </Group>

            <Group title="Experience">
              <Row label="Experience type">
                <div className="input flex items-center text-[14px] text-dim">{which === 'access' ? 'Access code (Template A)' : 'Register-to-Win (Template B)'}</div>
              </Row>
              <Row label="Presale / Preferred / Sweepstakes">
                <select className="input" value={c.campaignType}
                  onChange={(e) => set({ campaignType: e.target.value as CampaignType })}>
                  {(which === 'access' ? ['presale', 'preferred'] : ['sweepstakes']).map((t) => <option key={t} value={t} className="bg-panel">{typeLabel(t as CampaignType)}</option>)}
                </select>
              </Row>
              <div className="grid grid-cols-2 gap-3">
                <Text label="Market" v={c.market} on={(v) => set({ market: v })} />
                <Text label="Language" v={c.language} on={(v) => set({ language: v })} />
              </div>
              <Text label="Campaign start" type="datetime-local" v={toLocalInput(c.campaignOpenDateTime)} on={(v) => set({ campaignOpenDateTime: fromLocalInput(v) })} />
              <Text label="Campaign end" type="datetime-local" v={toLocalInput(c.campaignCloseDateTime)} on={(v) => set({ campaignCloseDateTime: fromLocalInput(v) })} />
              <Text label="Eligibility rule" v={c.eligibilityType} on={(v) => set({ eligibilityType: v })} />
              {which === 'access' && (
                <>
                  <Toggle label="Queue enabled" v={c.queueEnabled} on={(v) => set({ queueEnabled: v })} />
                  <Text label="Code inventory" type="number" v={String(c.codeInventory)} on={(v) => set({ codeInventory: Math.max(0, Number(v) || 0) })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Text label="Ticket partner" v={c.ticketPartner} on={(v) => set({ ticketPartner: v })} />
                    <Text label="Ticket partner URL" v={c.ticketPartnerUrl} on={(v) => set({ ticketPartnerUrl: v })} />
                  </div>
                </>
              )}
              {which === 'sweeps' && (
                <>
                  <Text label="Prize" v={c.prizeDescription ?? ''} on={(v) => set({ prizeDescription: v })} />
                  <Text label="Drawing date" type="date" v={c.drawingDate ?? ''} on={(v) => set({ drawingDate: v })} />
                </>
              )}
              <Toggle label="Marketing opt-in enabled" v={c.marketingOptInEnabled} on={(v) => set({ marketingOptInEnabled: v })} />
            </Group>

            <Group title="Legal & creative">
              <Text label="Official Rules URL" v={c.campaignRulesUrl} on={(v) => set({ campaignRulesUrl: v })} />
              <Text label="Privacy URL" v={c.privacyUrl} on={(v) => set({ privacyUrl: v })} />
              <Row label="Creative asset">
                <div className="grid grid-cols-5 gap-2">
                  {ART_PRESETS.map((p) => (
                    <button key={p} type="button" onClick={() => set({ heroImage: p })} aria-pressed={c.heroImage === p}
                      className={`aspect-[4/3] overflow-hidden rounded-lg border-2 ${c.heroImage === p ? 'border-note' : 'border-transparent opacity-70 hover:opacity-100'}`} title={p}>
                      <Art image={p} crowd={false} />
                    </button>
                  ))}
                </div>
                <input className="input mt-2 text-[14px]" placeholder="…or paste an image URL" value={ART_PRESETS.includes(c.heroImage as never) ? '' : c.heroImage}
                  onChange={(e) => set({ heroImage: e.target.value || 'aurora' })} />
              </Row>
            </Group>

            <div className="sticky bottom-0 -mx-5 mt-6 flex gap-2 border-t border-white/10 bg-[#080c1a] px-5 py-4">
              <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={() => d.resetCampaign(which)}>Reset to demo default</button>
              <button type="button" className="btn btn-sm flex-1 bg-note text-[#170b33]" onClick={() => { openFlow(which); d.setConfigOpen(false); }}>View landing page</button>
            </div>
          </div>
        ) : (
          <Catalog onLoad={(cfg) => { const f = d.loadCampaign(cfg); setWhich(f); nav(FLOWS[f].path); setTab('edit'); }} active={[d.campaigns.access.id, d.campaigns.sweeps.id]} />
        )}
      </div>
    </div>
  );
}

function Catalog({ onLoad, active }: { onLoad: (c: CampaignConfig) => void; active: string[] }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | CampaignType>('all');
  const rows = useMemo(() => CATALOG.filter((c) =>
    (type === 'all' || c.campaignType === type) &&
    `${c.id} ${c.artistName} ${c.city} ${c.market} ${c.venue}`.toLowerCase().includes(q.toLowerCase())), [q, type]);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-2 px-5 pt-4">
        <input className="input text-[14px]" placeholder="Search artist, city, market…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex gap-1.5 text-[12px]">
          {(['all', 'presale', 'preferred', 'sweepstakes'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`rounded-full border px-2.5 py-1 ${type === t ? 'border-note bg-note/15 text-white' : 'border-white/15 text-white/70'}`}>
              {t === 'all' ? 'All' : typeLabel(t)}
            </button>
          ))}
        </div>
        <p className="pb-2 text-[12px] text-mute">{rows.length} campaigns · fictional demo data · same two templates. Load one to see it on its landing page.</p>
      </div>
      <ul className="min-h-0 flex-1 divide-y divide-white/[0.06] overflow-y-auto border-t border-white/10">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-5 py-3">
            <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md"><Art image={c.heroImage} crowd={false} /></div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-medium">{c.artistName} <span className="text-mute">· {c.city}</span></div>
              <div className="truncate text-[12px] text-mute">{c.id} · {typeLabel(c.campaignType)} · {c.market} · {c.language}</div>
            </div>
            {active.includes(c.id) ? (
              <span className="text-[12px] font-medium text-ok">Live</span>
            ) : (
              <button type="button" className="rounded-full border border-white/15 px-3 py-1 text-[12px] hover:border-white/40" onClick={() => onLoad(c)}>
                Load → {flowForType(c.campaignType) === 'access' ? 'A' : 'B'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mb-6 space-y-3">
      <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">{title}</legend>
      {children}
    </fieldset>
  );
}
function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="field"><span>{label}</span>{children}</div>;
}
function Text({ label, v, on, type = 'text' }: { label: string; v: string; on: (v: string) => void; type?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input min-h-[44px] text-[14.5px]" type={type} value={v} onChange={(e) => on(e.target.value)} />
    </label>
  );
}
function Toggle({ label, v, on }: { label: string; v: boolean; on: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={v} onClick={() => on(!v)} className="flex w-full items-center justify-between rounded-xl border border-white/10 px-3.5 py-3 text-[14px]">
      {label}
      <span className={`relative h-6 w-10 rounded-full transition-colors ${v ? 'bg-note' : 'bg-white/20'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${v ? 'left-5' : 'left-1'}`} />
      </span>
    </button>
  );
}
