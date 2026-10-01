/**
 * Campaign configuration.
 *
 * Every consumer-facing string that varies by artist, event, market or offer is read from a
 * CampaignConfig. The two journeys (Access and Register-to-Win) are templates; a campaign is data.
 * All values here are fictional demo data.
 */

export type CampaignType = 'presale' | 'preferred' | 'sweepstakes';
export type FlowKey = 'access' | 'sweeps';

/** Built-in abstract artwork presets (no photography), or any image URL. */
export const ART_PRESETS = ['aurora', 'ember', 'tide', 'neon', 'dusk'] as const;
export type ArtPreset = (typeof ART_PRESETS)[number];

export interface CampaignConfig {
  id: string;
  artistName: string;
  tourName: string;
  /** An ART_PRESETS key, or an image URL. */
  heroImage: string;
  eventName: string;
  venue: string;
  city: string;
  state: string;
  /** YYYY-MM-DD, local to `timezone`. */
  eventDate: string;
  /** HH:mm, local to `timezone`. */
  eventTime: string;
  /** IANA zone, e.g. America/Los_Angeles. */
  timezone: string;
  campaignType: CampaignType;
  /** ISO 8601 instant. */
  campaignOpenDateTime: string;
  /** ISO 8601 instant. */
  campaignCloseDateTime: string;
  market: string;
  language: string;
  ticketPartner: string;
  ticketPartnerUrl: string;
  /** Human-readable eligibility rule (a VCES rule reference in production). */
  eligibilityType: string;
  codeInventory: number;
  campaignRulesUrl: string;
  privacyUrl: string;
  marketingOptInEnabled: boolean;
  queueEnabled: boolean;
  /** Register-to-Win only. */
  prizeDescription?: string;
  /** Register-to-Win only. ISO date of the random drawing. */
  drawingDate?: string;
}

export function flowForType(t: CampaignType): FlowKey {
  return t === 'sweepstakes' ? 'sweeps' : 'access';
}

// The presale opens 2h 17m 43s after the prototype loads, so the countdown always starts at
// 02:17:43 and the "opens on" date beneath it agrees with it.
const LOAD = Date.now();
const OPEN_IN_MS = (2 * 3600 + 17 * 60 + 43) * 1000;
const iso = (ms: number) => new Date(Math.round(ms / 1000) * 1000).toISOString();

export const DEFAULT_ACCESS: CampaignConfig = {
  id: 'VMX-0001',
  artistName: 'Nova Vale',
  tourName: 'The Afterglow Tour',
  heroImage: 'aurora',
  eventName: 'Nova Vale — The Afterglow Tour',
  venue: 'Harbor Point Arena',
  city: 'Los Angeles',
  state: 'CA',
  eventDate: '2026-11-14',
  eventTime: '20:00',
  timezone: 'America/Los_Angeles',
  campaignType: 'presale',
  campaignOpenDateTime: iso(LOAD + OPEN_IN_MS),
  campaignCloseDateTime: iso(LOAD + OPEN_IN_MS + 48 * 3600 * 1000),
  market: 'United States',
  language: 'en-US',
  ticketPartner: 'Ticketmaster',
  ticketPartnerUrl: 'https://www.ticketmaster.com',
  eligibilityType: 'U.S.-issued Visa consumer credit cards',
  codeInventory: 5000,
  campaignRulesUrl: '#terms',
  privacyUrl: '#privacy',
  marketingOptInEnabled: true,
  queueEnabled: true,
};

export const DEFAULT_SWEEPS: CampaignConfig = {
  id: 'VMX-0002',
  artistName: 'Luna Reyes',
  tourName: 'Solar Nights Tour',
  heroImage: 'ember',
  eventName: 'Luna Reyes — Solar Nights Live',
  venue: 'Meridian Amphitheater',
  city: 'Austin',
  state: 'TX',
  eventDate: '2026-11-21',
  eventTime: '19:30',
  timezone: 'America/Chicago',
  campaignType: 'sweepstakes',
  campaignOpenDateTime: '2026-09-22T14:00:00.000Z',
  campaignCloseDateTime: '2026-10-20T04:59:00.000Z',
  market: 'United States',
  language: 'en-US',
  ticketPartner: 'Live Nation',
  ticketPartnerUrl: 'https://www.livenation.com',
  eligibilityType: 'U.S.-issued Visa consumer credit and debit cards',
  codeInventory: 0,
  campaignRulesUrl: '#rules',
  privacyUrl: '#privacy',
  marketingOptInEnabled: true,
  queueEnabled: false,
  prizeDescription: 'Two tickets, one night hotel stay and a pre-show soundcheck visit',
  drawingDate: '2026-10-23',
};

// ── A demo catalog of 150 configured campaigns ─────────────────────────────────────────
// Fictional artists and venues, generated deterministically, to show the operating model:
// one platform, two standardized journeys, ~150 configured campaigns.

const ARTISTS = [
  'Nova Vale', 'Luna Reyes', 'The Midnight Arcs', 'Kairo', '静 Shizuka', 'Ada Monroe', 'Velvet Static',
  'Orion Hale', 'Sol & Sierra', 'Maren Lux', 'Blue Harbor', 'Tavi', 'Neon Orchard', 'Ezra Quill',
  'Coral Kings', 'Mira Sol', 'Paper Planets', 'Jonah Wilde', 'Aria Beck', 'The Lanterns', 'Zadie Rue',
  'Echo Park Radio', 'Ines Mora', 'Solstice', 'Kofi Blake',
];
const TOURS = ['World Tour', 'Live', 'Arena Tour', 'Stadium Tour', 'Sessions', 'Homecoming', 'Nights'];
const PLACES: Array<[string, string, string, string, string]> = [
  // venue, city, state/region, market, timezone
  ['Harbor Point Arena', 'Los Angeles', 'CA', 'United States', 'America/Los_Angeles'],
  ['Meridian Amphitheater', 'Austin', 'TX', 'United States', 'America/Chicago'],
  ['Lakeshore Hall', 'Chicago', 'IL', 'United States', 'America/Chicago'],
  ['Atlantic Yards Arena', 'New York', 'NY', 'United States', 'America/New_York'],
  ['Northbank Arena', 'London', 'England', 'United Kingdom', 'Europe/London'],
  ['Estádio Aurora', 'São Paulo', 'SP', 'Brazil', 'America/Sao_Paulo'],
  ['Arena Sol', 'Mexico City', 'CDMX', 'Mexico', 'America/Mexico_City'],
  ['Bayfront Dome', 'Sydney', 'NSW', 'Australia', 'Australia/Sydney'],
  ['Kōen Hall', 'Tokyo', 'Tokyo', 'Japan', 'Asia/Tokyo'],
  ['Rhein Arena', 'Berlin', 'Berlin', 'Germany', 'Europe/Berlin'],
  ['Palais Lumière', 'Paris', 'Île-de-France', 'France', 'Europe/Paris'],
  ['Maple Garden', 'Toronto', 'ON', 'Canada', 'America/Toronto'],
];
const LANG: Record<string, string> = {
  'United States': 'en-US', 'United Kingdom': 'en-GB', Brazil: 'pt-BR', Mexico: 'es-MX', Australia: 'en-AU',
  Japan: 'ja-JP', Germany: 'de-DE', France: 'fr-FR', Canada: 'en-CA',
};
const PARTNERS = ['Ticketmaster', 'Live Nation', 'AXS'];
const TYPES: CampaignType[] = ['presale', 'preferred', 'sweepstakes'];

function seeded(n: number) {
  let s = n * 2654435761 >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export const CATALOG: CampaignConfig[] = (() => {
  const out: CampaignConfig[] = [DEFAULT_ACCESS, DEFAULT_SWEEPS];
  const rnd = seeded(7);
  for (let i = 2; i < 150; i++) {
    const artist = ARTISTS[i % ARTISTS.length];
    const [venue, city, state, market, timezone] = PLACES[Math.floor(rnd() * PLACES.length)];
    const type = TYPES[Math.floor(rnd() * TYPES.length)];
    const tour = `${['The', 'Electric', 'Golden', 'Afterhours', 'Horizon', 'Wildflower'][Math.floor(rnd() * 6)]} ${TOURS[Math.floor(rnd() * TOURS.length)]}`;
    const day = 1 + Math.floor(rnd() * 180);
    const ev = new Date(Date.UTC(2026, 9, 1) + day * 86400000);
    const open = new Date(ev.getTime() - (20 + Math.floor(rnd() * 30)) * 86400000);
    const sweeps = type === 'sweepstakes';
    out.push({
      id: `VMX-${String(i + 1).padStart(4, '0')}`,
      artistName: artist,
      tourName: tour,
      heroImage: ART_PRESETS[i % ART_PRESETS.length],
      eventName: `${artist} — ${tour}`,
      venue, city, state, market, timezone,
      eventDate: ev.toISOString().slice(0, 10),
      eventTime: ['19:00', '19:30', '20:00', '20:30'][Math.floor(rnd() * 4)],
      campaignType: type,
      campaignOpenDateTime: open.toISOString(),
      campaignCloseDateTime: new Date(open.getTime() + (sweeps ? 21 : 2) * 86400000).toISOString(),
      language: LANG[market] ?? 'en-US',
      ticketPartner: PARTNERS[Math.floor(rnd() * PARTNERS.length)],
      ticketPartnerUrl: 'https://example.com/tickets',
      eligibilityType: sweeps ? `${market} Visa consumer credit and debit cards` : `${market}-issued Visa consumer credit cards`,
      codeInventory: sweeps ? 0 : [1500, 2500, 5000, 10000][Math.floor(rnd() * 4)],
      campaignRulesUrl: '#rules',
      privacyUrl: '#privacy',
      marketingOptInEnabled: market !== 'Germany',
      queueEnabled: !sweeps && rnd() > 0.25,
      prizeDescription: sweeps ? 'Two tickets and a meet-and-greet' : undefined,
      drawingDate: sweeps ? new Date(open.getTime() + 24 * 86400000).toISOString().slice(0, 10) : undefined,
    });
  }
  return out;
})();
