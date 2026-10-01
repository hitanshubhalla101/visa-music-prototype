import type { FlowDef } from '../types';

/**
 * Flow B — Register-to-Win / Sweepstakes.
 * Eligibility first (VCES), then entrant details and consent, then transfer to the administrator
 * (Don Jagoda Associates) who runs the random drawing. Not first come, first served.
 */
export const SWEEPS_FLOW: FlowDef = {
  key: 'sweeps',
  title: 'Register-to-Win',
  path: '/sweepstakes',
  walk: ['landing', 'human', 'card', 'checking', 'eligible', 'form', 'consent', 'confirmation', 'dja'],
  rail: [
    { label: 'Security', steps: ['human', 'human-failed'] },
    { label: 'Card', steps: ['card', 'checking', 'eligible', 'ineligible', 'duplicate', 'vces-down'] },
    { label: 'Details', steps: ['form'] },
    { label: 'Consent', steps: ['consent'] },
    { label: 'Entered', steps: ['confirmation', 'dja', 'transfer-pending'] },
  ],
  steps: [
    {
      id: 'landing',
      label: 'Entry page',
      group: 'journey',
      consumer: 'The artist page with “Enter Now”, the entry period, the benefit strip, how to enter, FAQs and Official Rules.',
      platform: [
        'Serves the campaign page from configuration; entry period from campaignOpen/CloseDateTime.',
        'No queue by default: entry is not first come, first served.',
      ],
      decisions: [
        'Which card portfolios qualify?',
        'Is a queue ever needed for sweepstakes (e.g. a very large artist announcement)?',
      ],
    },
    {
      id: 'human',
      label: 'Human verification',
      group: 'journey',
      consumer: '“Quick security check” with “Verify & Continue”.',
      platform: ['Bot / abuse check before card entry (simulated).'],
      decisions: ['Is the security check required for every sweepstakes, or only high-demand ones?'],
    },
    {
      id: 'card',
      label: 'Visa card verification',
      group: 'journey',
      consumer: '“Verify your Visa card” with card number, expiry and CVV. Demo only.',
      platform: [
        'VCES eligibility call against the campaign rule.',
        'Tokenised card reference kept for the one-entry rule; the card number is never stored or sent to DJA.',
      ],
      decisions: [
        'Which card portfolios qualify?',
        'Does the card-verification step apply in every market, given “no purchase necessary” rules?',
        'Is there an alternate method of entry (AMOE) that bypasses card verification?',
      ],
    },
    {
      id: 'checking',
      label: 'Checking eligibility',
      group: 'journey',
      consumer: '“Checking eligibility…”.',
      platform: ['VCES call in flight; timeout falls back to “temporarily unavailable”.'],
      decisions: ['Same VCES SLA and timeout as Access, or different?'],
    },
    {
      id: 'eligible',
      label: 'Eligible to enter',
      group: 'journey',
      consumer: '“You’re eligible to enter.” with “Continue”.',
      platform: ['VCES returned ELIGIBLE; entry check found no existing entry for this card.'],
      decisions: ['One entry per card, person, household or email?'],
    },
    {
      id: 'form',
      label: 'Registration form',
      group: 'journey',
      consumer: 'Entrant details: name, email, phone, address, country and optional preferred language.',
      platform: [
        'Field-level validation; the field set comes from the market configuration.',
        'No data is sent anywhere until the entry is submitted.',
      ],
      decisions: [
        'What fields are required across every sweepstakes?',
        'Which fields vary by market?',
        'Is date of birth / age confirmation required?',
      ],
    },
    {
      id: 'consent',
      label: 'Rules & consent',
      group: 'journey',
      consumer: 'Required: Official Rules and privacy acknowledgement. Optional, separate and unticked: Visa marketing consent.',
      platform: [
        'Records the exact consent text and version, a timestamp and the choice for each box.',
        'Entry is accepted without marketing consent.',
      ],
      decisions: [
        'What is Visa’s required marketing opt-in language?',
        'Does Visa require confirmed/double opt-in?',
        'Which privacy acknowledgement text is required per market?',
      ],
    },
    {
      id: 'confirmation',
      label: 'Entry confirmation',
      group: 'journey',
      consumer: '“You’re entered.” with an entry reference and the confirmation email address.',
      platform: [
        'Entry stored securely with its consent record and entry reference.',
        'Confirmation email queued (sender to be confirmed).',
      ],
      decisions: [
        'Who sends entry confirmation?',
        'Is the entry reference shown to the fan, emailed, or both?',
      ],
    },
    {
      id: 'dja',
      label: 'DJA handoff',
      group: 'journey',
      consumer: '“No further action is required. If selected, you will be contacted according to the Official Rules.”',
      platform: [
        'Entry securely stored → scheduled secure transfer → Don Jagoda Associates.',
        'DJA validates entrants, runs the random drawing and handles winner outreach / alternates.',
      ],
      decisions: [
        'Does DJA receive entrants in real time or through daily batch transfer?',
        'Who sends winner communication?',
        'What data does DJA return to Visa / Trantor after cleaning?',
      ],
    },

    // ── exceptions ─────────────────────────────────────────────────────────────
    {
      id: 'coming-soon',
      label: 'Campaign not open',
      group: 'exception',
      consumer: '“Entries open soon” with the entry period. The CTA is disabled.',
      platform: ['Campaign state is SCHEDULED.'],
      decisions: ['Should the entry page be published before entries open?'],
    },
    {
      id: 'human-failed',
      label: 'Verification failed',
      group: 'exception',
      consumer: '“We couldn’t complete the security check.” with a retry.',
      platform: ['Bot check failed or expired.'],
      decisions: ['Lockout rules after repeated failures?'],
    },
    {
      id: 'ineligible',
      label: 'Ineligible card',
      group: 'exception',
      consumer: '“This card is not eligible for this sweepstakes.” with “Try Another Card”.',
      platform: ['VCES returned NOT ELIGIBLE. Nothing is stored beyond the attempt count.'],
      decisions: ['Must the ineligible screen mention the alternate method of entry?'],
    },
    {
      id: 'duplicate',
      label: 'Registration duplicate',
      group: 'exception',
      consumer: '“You’ve already entered with this card.” No second entry is created.',
      platform: ['An entry already exists for this tokenised card (and/or email) for this campaign.'],
      decisions: [
        'One entry per card, person, household or email?',
        'Are bonus / additional entries ever allowed?',
      ],
    },
    {
      id: 'vces-down',
      label: 'Validation service unavailable',
      group: 'exception',
      consumer: '“Card verification is temporarily unavailable.” with a retry.',
      platform: ['VCES timeout or error; nothing is stored.'],
      decisions: ['Retry and messaging policy when VCES is down during an entry period.'],
    },
    {
      id: 'transfer-pending',
      label: 'Transfer pending',
      group: 'exception',
      consumer: 'Same confirmation as a normal entry; the fan is not told about transfer timing.',
      platform: ['Entry stored and waiting for the next scheduled transfer to DJA; retries on failure and alerts operations.'],
      decisions: [
        'What is the transfer schedule, and the alert if a batch fails?',
        'Who reconciles entry counts between the platform and DJA?',
      ],
    },
    {
      id: 'closed',
      label: 'Campaign closed',
      group: 'exception',
      consumer: '“Entries are now closed.” with the drawing date and other experiences.',
      platform: ['campaignCloseDateTime has passed; no new entries accepted. Final transfer to DJA runs.'],
      decisions: ['Should the page show winner announcements after the drawing, or nothing?'],
    },
  ],
};
