import type { FlowDef } from '../types';

/**
 * Flow A — Presale / Preferred Access.
 * The platform confirms eligibility and issues a unique access code; the ticketing partner sells.
 * "Platform does" lines describe the proposed behaviour and are there to be corrected.
 */
export const ACCESS_FLOW: FlowDef = {
  key: 'access',
  title: 'Presale / Preferred Access',
  path: '/access',
  walk: ['coming-soon', 'landing', 'queue', 'human', 'card', 'checking', 'eligible', 'code', 'partner', 'unlocked'],
  rail: [
    { label: 'Queue', steps: ['queue', 'exhausted'] },
    { label: 'Security', steps: ['human', 'human-failed'] },
    { label: 'Card', steps: ['card', 'checking', 'ineligible', 'already-used', 'vces-down'] },
    { label: 'Code', steps: ['eligible', 'code', 'allocation-error'] },
    { label: 'Tickets', steps: ['partner', 'unlocked'] },
  ],
  steps: [
    {
      id: 'coming-soon',
      label: 'Campaign not open yet',
      group: 'journey',
      consumer: 'The artist page with a live countdown to the presale. The CTA is disabled and the opening date and time are shown in the event’s time zone.',
      platform: [
        'Serves the campaign page from configuration (artist, event, window, partner).',
        'Countdown is driven by campaignOpenDateTime; the CTA unlocks automatically at open time.',
        'Page is cacheable at the edge, so pre-open traffic does not touch the verification services.',
      ],
      decisions: [
        'Are Presale and Preferred separate campaigns or states of the same campaign?',
        'Should the page be live (with countdown) before open, and from how far in advance?',
        'Can fans sign up for a reminder before the presale opens? If so, who sends it?',
      ],
    },
    {
      id: 'landing',
      label: 'Campaign open',
      group: 'journey',
      consumer: 'The artist page with “Get Access to Tickets” enabled, the benefit strip, how it works, FAQs and terms.',
      platform: [
        'Campaign state is OPEN; codes remaining is above zero.',
        'Clicking the CTA starts a session and, if queueEnabled, places the visitor in the waiting room.',
      ],
      decisions: [
        'Exactly which Visa cards qualify for Presale?',
        'Exactly which Visa cards qualify for Preferred?',
        'What eligibility and disclaimer copy must appear on the landing page, per market?',
      ],
    },
    {
      id: 'queue',
      label: 'Queue active',
      group: 'journey',
      consumer: '“You’re in line”, a queue position, an estimated wait and a progress bar. Advised not to refresh.',
      platform: [
        'Waiting room admits visitors in batches at a configured rate to protect card verification.',
        'Position and estimated wait are recalculated every few seconds.',
        'An admitted visitor gets a short-lived session token required for the next steps.',
      ],
      decisions: [
        'Should queueing always be enabled for scheduled drops?',
        'What traffic threshold triggers the queue?',
        'Is queue order randomised for visitors who arrive before open, or first come, first served?',
        'Which waiting-room provider is used, and who operates it on drop day?',
      ],
    },
    {
      id: 'human',
      label: 'Human verification',
      group: 'journey',
      consumer: '“Quick security check” with a single “Verify & Continue” action.',
      platform: [
        'Bot / abuse check before any card data is requested (simulated here, no real CAPTCHA).',
        'Failed or suspicious sessions can be challenged again or blocked.',
      ],
      decisions: [
        'Is the check always shown, or only when risk signals trigger it?',
        'Which bot-protection provider does Visa require or approve?',
      ],
    },
    {
      id: 'card',
      label: 'Visa card verification',
      group: 'journey',
      consumer: '“Verify your Visa card” with card number, expiry and CVV. Clearly marked as demo only.',
      platform: [
        'Card details are sent over TLS to VCES for an eligibility decision against the campaign rule.',
        'The card number is never stored; only a tokenised card reference and the result are kept, for de-duplication.',
      ],
      decisions: [
        'Does VCES need the full card number, expiry and CVV, or only the BIN / first digits?',
        'Exactly which card products and issuing countries qualify for this offer?',
        'How many attempts before a session is locked?',
      ],
    },
    {
      id: 'checking',
      label: 'Checking eligibility',
      group: 'journey',
      consumer: '“Checking eligibility…” with a short progress animation.',
      platform: [
        'VCES eligibility call in flight; a timeout falls back to “temporarily unavailable”.',
      ],
      decisions: [
        'What is the VCES response-time SLA, and what timeout should the experience use?',
      ],
    },
    {
      id: 'eligible',
      label: 'Eligible → duplicate check',
      group: 'journey',
      consumer: '“Your Visa card is eligible.” then “Confirming access…”.',
      platform: [
        'VCES returned ELIGIBLE.',
        'Entitlement check: has this tokenised card already received a code for this offer?',
        'If not, one code is reserved from this campaign’s inventory in the same transaction.',
      ],
      decisions: [
        'Is uniqueness one code per card, per event, per artist, or per tour?',
        'Is it one code per card or one per person (a person with several eligible cards)?',
      ],
    },
    {
      id: 'code',
      label: 'Code issued',
      group: 'journey',
      consumer: '“Your access code is ready”, the code with a copy action, the partner CTA and the “no guarantee” notice.',
      platform: [
        'Code is marked as issued to the tokenised card and the inventory counter decremented.',
        'The issued code is logged for reconciliation with the ticketing partner.',
      ],
      decisions: [
        'Can a code be reissued (e.g. the fan closes the page)?',
        'Should codes expire?',
        'Should codes also be sent via email? (That would require collecting an email address.)',
        'Are codes single-use at the partner, or usable for several transactions / tickets?',
      ],
    },
    {
      id: 'partner',
      label: 'Ticketing partner handoff',
      group: 'journey',
      consumer: 'A simulated partner event page with the offer code prefilled.',
      platform: [
        'Deep link to the partner event page (ticketPartnerUrl); the code may be passed in the link if the partner supports it.',
        'From here the partner owns inventory, pricing and checkout.',
      ],
      decisions: [
        'Can the code be prefilled via the link, or does the fan paste it?',
        'What happens if codes remain but Ticketmaster inventory is gone?',
      ],
    },
    {
      id: 'unlocked',
      label: 'Partner inventory unlocked',
      group: 'journey',
      consumer: '“Eligible Visa ticket inventory unlocked” with sections A, B and C. Purchase happens at the partner.',
      platform: [
        'Partner validates the code against the Visa offer and shows the reserved inventory.',
      ],
      decisions: [
        'Do we receive code redemption confirmation from Ticketmaster?',
        'Which redemption data (if any) is reported back to Visa, and how often?',
      ],
    },

    // ── exceptions ─────────────────────────────────────────────────────────────
    {
      id: 'exhausted',
      label: 'Codes exhausted',
      group: 'exception',
      consumer: '“All available access codes have been distributed.” with event details and a link to other experiences.',
      platform: [
        'Inventory counter reached zero; the queue stops admitting and new sessions land here.',
      ],
      decisions: [
        'What should fans see when codes run out: a waitlist, other events, or general on-sale info?',
        'Can inventory be topped up mid-campaign, and who approves it?',
      ],
    },
    {
      id: 'human-failed',
      label: 'Verification failed',
      group: 'exception',
      consumer: '“We couldn’t complete the security check.” with a retry.',
      platform: ['Bot check failed or expired; no card step is offered until it passes.'],
      decisions: ['After how many failed checks do we block the session, and for how long?'],
    },
    {
      id: 'ineligible',
      label: 'Ineligible card',
      group: 'exception',
      consumer: '“This card is not eligible for this offer.” with “Try Another Card”.',
      platform: ['VCES returned NOT ELIGIBLE. No code is reserved. The attempt is counted against the session.'],
      decisions: [
        'Should we explain why (e.g. debit vs credit, issuing country), or keep it generic?',
        'How many different cards may one session try?',
      ],
    },
    {
      id: 'already-used',
      label: 'Card already used',
      group: 'exception',
      consumer: '“This card has already received an access code for this offer.” No new code is issued.',
      platform: ['Entitlement check found an existing code for this tokenised card and offer.'],
      decisions: [
        'Should we show the previously issued code again, or only point to offer details?',
        'Does “already used” apply across Presale and Preferred, or per offer?',
      ],
    },
    {
      id: 'vces-down',
      label: 'Validation service unavailable',
      group: 'exception',
      consumer: '“Card verification is temporarily unavailable.” with a retry. The fan keeps their place.',
      platform: ['VCES timed out or returned an error. The session is held; the fan can retry without re-queuing.'],
      decisions: [
        'Retry policy and fan messaging when VCES is unavailable during a drop.',
        'Who is paged, and what is the escalation path on drop day?',
      ],
    },
    {
      id: 'allocation-error',
      label: 'Code allocation failure',
      group: 'exception',
      consumer: '“We couldn’t issue your code just now.” with a retry. Eligibility is kept.',
      platform: ['Card is eligible but a code could not be reserved (inventory lock or service error). Nothing is issued twice.'],
      decisions: [
        'Is the card’s entitlement released if allocation fails, so the fan can retry?',
        'Should support be able to issue a code manually?',
      ],
    },
    {
      id: 'closed',
      label: 'Campaign closed',
      group: 'exception',
      consumer: '“This presale has ended.” with event details and a link to other experiences.',
      platform: ['campaignCloseDateTime has passed; all journey entry points are closed.'],
      decisions: [
        'After close, should the page redirect, show general on-sale info, or other Visa experiences?',
        'Do codes issued during the window still work after close?',
      ],
    },
  ],
};
