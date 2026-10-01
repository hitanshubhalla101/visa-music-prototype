import { useEffect } from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { FlowKey } from './config/campaign';
import { ConfigDrawer } from './components/ConfigDrawer';
import { Header } from './components/Header';
import { PresenterPanel } from './components/PresenterPanel';
import { AccessPage } from './pages/AccessPage';
import { Home } from './pages/Home';
import { SweepsPage } from './pages/SweepsPage';
import { DemoProvider, FLOWS, useDemo } from './state/DemoContext';

function flowFromPath(p: string): FlowKey | null {
  if (p.startsWith('/access')) return 'access';
  if (p.startsWith('/sweepstakes')) return 'sweeps';
  return null;
}

function Shell() {
  const { pathname } = useLocation();
  const flow = flowFromPath(pathname);
  const d = useDemo();

  // P toggles Presenter Mode; ← / → walk the journey while it is on.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (e.metaKey || e.ctrlKey || e.altKey || (t instanceof Element && t.closest('input, textarea, select, [contenteditable]'))) return;
      if (e.key === 'p' || e.key === 'P') { d.setPresenter(!d.presenter); return; }
      if (!d.presenter || !flow) return;
      const def = FLOWS[flow], i = def.walk.indexOf(d.steps[flow]);
      if (e.key === 'ArrowRight') d.go(flow, def.walk[Math.min(def.walk.length - 1, i + 1)]);
      if (e.key === 'ArrowLeft') d.go(flow, def.walk[Math.max(0, (i < 0 ? 1 : i) - 1)]);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [d, flow]);

  useEffect(() => {
    const c = flow ? d.campaigns[flow] : null;
    document.title = c ? `${c.artistName} · Visa Music ${flow === 'access' ? 'Access' : 'Experiences'}` : 'Visa Music Experiences · Prototype';
  }, [flow, d.campaigns]);

  return (
    <div data-flow={flow ?? 'access'} className={`min-h-svh transition-[padding] duration-300 ${d.presenter ? 'pb-[72px] lg:pb-0 lg:pr-[400px]' : ''}`}>
      <Header rulesHref={flow === 'sweeps' ? '#rules' : '#terms'} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/access" element={<AccessPage />} />
        <Route path="/sweepstakes" element={<SweepsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PresenterPanel flow={flow} />
      <ConfigDrawer flow={flow} />
    </div>
  );
}

// Static hosts without rewrite rules (GitHub Pages) can't serve /access on refresh, so that build
// uses hash URLs (#/access). Vercel and Netlify keep clean paths.
const Router = import.meta.env.VITE_HASH_ROUTER === '1' ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <DemoProvider>
        <Shell />
      </DemoProvider>
    </Router>
  );
}
