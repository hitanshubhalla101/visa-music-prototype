import { Link } from 'react-router-dom';
import { useDemo } from '../state/DemoContext';
import { IconGlobe, IconSliders } from './Icons';

/** Wordmark placeholder: the real Visa logo asset replaces this in production. */
export function VisaMark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display text-[22px] font-black italic tracking-[-0.02em] leading-none ${className}`} aria-label="Visa">
      VISA
    </span>
  );
}

const LANGS = [
  ['en', 'English'],
  ['es', 'Español'],
  ['pt', 'Português'],
  ['fr', 'Français'],
  ['ja', '日本語'],
];

export function Header({ rulesHref = '#terms' }: { rulesHref?: string }) {
  const { presenter, setPresenter, setConfigOpen, language, setLanguage } = useDemo();
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-night/70 backdrop-blur-xl" style={{ viewTransitionName: 'vm-header' }}>
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3 rounded-lg" aria-label="Visa Music Experiences home">
          <VisaMark />
          <span className="h-6 w-px bg-white/20" aria-hidden="true" />
          <span className="flex flex-col text-[11px] font-semibold uppercase leading-[1.15] tracking-[0.18em] text-white/90">
            <span>Music</span>
            <span className="text-white/60">Experiences</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <label className="relative hidden items-center sm:flex">
            <span className="sr-only">Language</span>
            <IconGlobe size={16} className="pointer-events-none absolute left-2.5 text-white/60" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-9 cursor-pointer appearance-none rounded-full border border-white/12 bg-transparent pl-8 pr-3 text-[13px] text-white/80 hover:border-white/30"
            >
              {LANGS.map(([v, l]) => (
                <option key={v} value={v} className="bg-panel">
                  {l}
                </option>
              ))}
            </select>
          </label>
          <a href={rulesHref} className="hidden h-9 items-center rounded-full px-3 text-[13px] text-white/75 hover:text-white md:inline-flex">
            Terms / Rules
          </a>
          {presenter && (
            <button
              type="button"
              onClick={() => setConfigOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-note/50 px-3 text-[13px] font-medium text-[#e3d6ff] hover:bg-note/10"
            >
              <IconSliders size={16} />
              <span className="hidden sm:inline">Configure</span>
            </button>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={presenter}
            onClick={() => setPresenter(!presenter)}
            title="Presenter Mode (P)"
            className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[13px] font-medium transition-colors ${
              presenter ? 'border-note bg-note/15 text-white' : 'border-white/15 text-white/75 hover:border-white/35'
            }`}
          >
            <span className={`relative h-4 w-7 rounded-full transition-colors ${presenter ? 'bg-note' : 'bg-white/20'}`} aria-hidden="true">
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${presenter ? 'left-3.5' : 'left-0.5'}`} />
            </span>
            <span className="hidden sm:inline">Presenter</span>
            <span className="sm:hidden">P</span>
          </button>
        </div>
      </div>
      {language !== 'en' && (
        <div className="border-t border-white/5 bg-panel/90 px-4 py-1.5 text-center text-[12px] text-dim">
          Prototype copy is shown in English. In production, translated copy loads from the campaign’s language pack.
        </div>
      )}
    </header>
  );
}
