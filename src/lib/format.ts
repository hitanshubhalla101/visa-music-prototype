import type { CampaignConfig } from '../config/campaign';

function safeTz(tz: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

/** Short zone name (e.g. PST) for a zone, on or near a given instant. */
export function zoneAbbr(tz: string, at: Date) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: safeTz(tz), timeZoneName: 'short' }).formatToParts(at);
  return p.find((x) => x.type === 'timeZoneName')?.value ?? '';
}

function atNoon(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1, 12));
}

/** "Sat, Nov 14, 2026" — the event date as printed on a ticket. */
export function eventDateLong(c: CampaignConfig) {
  return atNoon(c.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** "8:00 PM PST" — the event's local start time. */
export function eventTimeLabel(c: CampaignConfig) {
  const [h, m] = c.eventTime.split(':').map(Number);
  const hh = ((h || 0) + 11) % 12 + 1;
  return `${hh}:${String(m || 0).padStart(2, '0')} ${(h || 0) < 12 ? 'AM' : 'PM'} ${zoneAbbr(c.timezone, atNoon(c.eventDate))}`;
}

/** "Wed, Sep 30" and "3:02 PM PDT" for an instant, in the campaign's zone. */
export function instantParts(iso: string, tz: string) {
  const d = new Date(iso);
  if (isNaN(+d)) return { date: '—', time: '' };
  const z = safeTz(tz);
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: z }),
    time: `${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: z })} ${zoneAbbr(z, d)}`,
  };
}

/** "Sep 22 – Oct 19, 2026" */
export function entryPeriod(c: CampaignConfig) {
  const z = safeTz(c.timezone);
  const f = (iso: string, year: boolean) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}), timeZone: z });
  return `${f(c.campaignOpenDateTime, false)} – ${f(c.campaignCloseDateTime, true)}`;
}

export function dateLong(date?: string) {
  if (!date) return '—';
  return atNoon(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export const n = (x: number) => x.toLocaleString('en-US');

export function typeLabel(t: CampaignConfig['campaignType']) {
  return t === 'presale' ? 'Presale' : t === 'preferred' ? 'Preferred' : 'Register-to-Win';
}

/** ISO instant → value for <input type="datetime-local"> (in the browser's zone). */
export function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (isNaN(+d)) return '';
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function fromLocalInput(v: string) {
  const d = new Date(v);
  return isNaN(+d) ? new Date().toISOString() : d.toISOString();
}
