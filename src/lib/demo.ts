/**
 * Simulated services. Nothing here leaves the browser: no card API, no network, no storage of
 * card details. The card number only ever lives in the card form's local state.
 */

export type CardOutcome = 'eligible' | 'ineligible' | 'used' | 'unavailable';

export interface TestCard {
  outcome: CardOutcome;
  number: string;
  expiry: string;
  cvv: string;
}

/** Obvious test numbers. Anything else is refused before "verification" runs. */
export const TEST_CARDS: Record<CardOutcome, TestCard> = {
  eligible: { outcome: 'eligible', number: '4000 0012 3456 7899', expiry: '12/29', cvv: '123' },
  ineligible: { outcome: 'ineligible', number: '4000 0098 7654 3210', expiry: '08/28', cvv: '456' },
  used: { outcome: 'used', number: '4000 0055 5555 5559', expiry: '03/30', cvv: '789' },
  unavailable: { outcome: 'unavailable', number: '4000 0000 0000 0119', expiry: '01/31', cvv: '000' },
};

export const digits = (s: string) => s.replace(/\D/g, '');

export function outcomeFor(number: string): CardOutcome | null {
  const d = digits(number);
  const hit = Object.values(TEST_CARDS).find((c) => digits(c.number) === d);
  return hit ? hit.outcome : null;
}

export function formatCardNumber(v: string) {
  return digits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}
export function formatExpiry(v: string) {
  const d = digits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const D = '23456789';
const pick = (s: string) => s[Math.floor(Math.random() * s.length)];

/** VISA-AB12CD */
export function newAccessCode() {
  return `VISA-${pick(L)}${pick(L)}${pick(D)}${pick(D)}${pick(L)}${pick(L)}`;
}

/** MUSIC-029184 */
export function newEntryRef() {
  return `MUSIC-0${String(Math.floor(10000 + Math.random() * 89999))}`;
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const reducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
