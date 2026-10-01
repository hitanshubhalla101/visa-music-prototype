import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_ACCESS, DEFAULT_SWEEPS, flowForType, type CampaignConfig, type FlowKey } from '../config/campaign';
import { ACCESS_FLOW } from '../flows/access/steps';
import { SWEEPS_FLOW } from '../flows/sweeps/steps';
import type { FlowDef } from '../flows/types';
import { newAccessCode, newEntryRef } from '../lib/demo';
import { screenTransition } from '../motion/beat';

export const FLOWS: Record<FlowKey, FlowDef> = { access: ACCESS_FLOW, sweeps: SWEEPS_FLOW };

export interface Entrant {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  postal: string;
  country: string;
  language: string;
}

export const DEMO_ENTRANT: Entrant = {
  firstName: 'Jordan',
  lastName: 'Lee',
  email: 'jordan.lee@example.com',
  phone: '(555) 010-2847',
  address1: '1200 Example Avenue',
  address2: 'Apt 4B',
  city: 'Austin',
  region: 'TX',
  postal: '78701',
  country: 'United States',
  language: 'English',
};
export const EMPTY_ENTRANT: Entrant = {
  firstName: '', lastName: '', email: '', phone: '', address1: '', address2: '', city: '', region: '', postal: '',
  country: 'United States', language: '',
};

export type DecisionStatus = 'open' | 'confirmed' | 'changed';
export interface DecisionNote { status: DecisionStatus; note: string }

interface DemoState {
  campaigns: Record<FlowKey, CampaignConfig>;
  updateCampaign: (flow: FlowKey, patch: Partial<CampaignConfig>) => void;
  loadCampaign: (c: CampaignConfig) => FlowKey;
  resetCampaign: (flow: FlowKey) => void;

  steps: Record<FlowKey, string>;
  go: (flow: FlowKey, step: string) => void;

  presenter: boolean;
  setPresenter: (v: boolean) => void;
  configOpen: boolean;
  setConfigOpen: (v: boolean) => void;
  language: string;
  setLanguage: (v: string) => void;

  /** Access journey data. */
  code: string;
  issued: number;
  issueCode: () => void;
  /** Register-to-Win journey data. */
  entrant: Entrant;
  setEntrant: (e: Entrant) => void;
  marketingOptIn: boolean;
  setMarketingOptIn: (v: boolean) => void;
  entryRef: string;
  newEntry: () => void;

  decisions: Record<string, DecisionNote>;
  setDecision: (key: string, d: Partial<DecisionNote>) => void;
  clearDecisions: () => void;
}

const Ctx = createContext<DemoState | null>(null);

const NOTES_KEY = 'vmx-decision-notes-v1';
function readNotes(): Record<string, DecisionNote> {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
  } catch {
    return {};
  }
}

/** Codes already issued to other fans before the demo starts: 5,000 → 4,997 after yours. */
const ISSUED_BEFORE = 2;

export function DemoProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Record<FlowKey, CampaignConfig>>({ access: DEFAULT_ACCESS, sweeps: DEFAULT_SWEEPS });
  const [steps, setSteps] = useState<Record<FlowKey, string>>({ access: 'coming-soon', sweeps: 'landing' });
  const [presenter, setPresenter] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [code, setCode] = useState(() => newAccessCode());
  const [issued, setIssued] = useState(ISSUED_BEFORE);
  const [issuedFor, setIssuedFor] = useState<string | null>(null);
  const [entrant, setEntrant] = useState<Entrant>(EMPTY_ENTRANT);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [entryRef, setEntryRef] = useState('MUSIC-029184');
  const [decisions, setDecisions] = useState<Record<string, DecisionNote>>(readNotes);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(decisions));
    } catch {
      /* private mode: notes stay in memory */
    }
  }, [decisions]);

  const go = useCallback((flow: FlowKey, step: string) => {
    // Every screen change opens out of the pulse (a view transition), on the beat.
    screenTransition(() => {
      setSteps((s) => ({ ...s, [flow]: step }));
      // A fresh journey gets a fresh code and entry; a presenter jump straight to the end still has one.
      if (flow === 'access' && (step === 'landing' || step === 'coming-soon')) setCode(newAccessCode());
      if (flow === 'sweeps' && step === 'landing') setMarketingOptIn(false);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
    });
  }, []);

  const updateCampaign = useCallback((flow: FlowKey, patch: Partial<CampaignConfig>) => {
    setCampaigns((c) => ({ ...c, [flow]: { ...c[flow], ...patch } }));
    if (patch.codeInventory != null) setIssued(ISSUED_BEFORE);
  }, []);

  const loadCampaign = useCallback((cfg: CampaignConfig) => {
    const flow = flowForType(cfg.campaignType);
    setCampaigns((c) => ({ ...c, [flow]: { ...cfg } }));
    setSteps((s) => ({ ...s, [flow]: flow === 'access' ? 'landing' : 'landing' }));
    setIssued(ISSUED_BEFORE);
    return flow;
  }, []);

  const resetCampaign = useCallback((flow: FlowKey) => {
    setCampaigns((c) => ({ ...c, [flow]: flow === 'access' ? DEFAULT_ACCESS : DEFAULT_SWEEPS }));
    setIssued(ISSUED_BEFORE);
  }, []);

  // Each code decrements the inventory once, however the presenter arrives at the code screen.
  const issueCode = useCallback(() => {
    if (issuedFor === code) return;
    setIssuedFor(code);
    setIssued((x) => x + 1);
  }, [issuedFor, code]);
  const newEntry = useCallback(() => setEntryRef(newEntryRef()), []);

  const setDecision = useCallback((key: string, d: Partial<DecisionNote>) => {
    setDecisions((all) => ({ ...all, [key]: { ...(all[key] ?? { status: 'open', note: '' }), ...d } }));
  }, []);
  const clearDecisions = useCallback(() => setDecisions({}), []);

  const value = useMemo<DemoState>(
    () => ({
      campaigns, updateCampaign, loadCampaign, resetCampaign,
      steps, go,
      presenter, setPresenter, configOpen, setConfigOpen, language, setLanguage,
      code, issued, issueCode,
      entrant, setEntrant, marketingOptIn, setMarketingOptIn, entryRef, newEntry,
      decisions, setDecision, clearDecisions,
    }),
    [campaigns, updateCampaign, loadCampaign, resetCampaign, steps, go, presenter, configOpen, language, code, issued,
      issueCode, entrant, marketingOptIn, entryRef, newEntry, decisions, setDecision, clearDecisions],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDemo must be used inside <DemoProvider>');
  return v;
}

/** Everything a flow page needs, bound to one flow. */
export function useFlow(flow: FlowKey) {
  const d = useDemo();
  const def = FLOWS[flow];
  const step = d.steps[flow];
  const campaign = d.campaigns[flow];
  const go = useCallback((s: string) => d.go(flow, s), [d, flow]);
  const remaining = Math.max(0, campaign.codeInventory - d.issued);
  return { ...d, def, step, campaign, go, remaining };
}
