import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArenaFilm, StepBeat } from '../film/ArenaFilm';
import { CampaignStatus, EventInfo, TypeBadge } from '../components/Campaign';
import { Confirmation, ConsentBlock, DjaHandoff, EligibleSweeps, EntryForm } from '../components/Entry';
import { IconArrow, IconCalendar, IconShield, IconStar, IconUsers } from '../components/Icons';
import { JourneyShell, StatusScreen } from '../components/Journey';
import { BenefitStrip, Faq, Footer, HowItWorks, InfoGrid, Section } from '../components/Landing';
import { CardVerify, Checking, HumanCheck } from '../components/Verification';
import type { CardOutcome } from '../lib/demo';
import { dateLong, entryPeriod, instantParts } from '../lib/format';
import { DEMO_ENTRANT, useFlow } from '../state/DemoContext';
import { useStepParam } from './useStepParam';
import { screenTransition } from '../motion/beat';
import { Pulse } from '../motion/Pulse';
import { BeatWords } from '../motion/Text';

const NEXT: Record<CardOutcome, string> = { eligible: 'eligible', ineligible: 'ineligible', used: 'duplicate', unavailable: 'vces-down' };

export function SweepsPage() {
  const f = useFlow('sweeps');
  const { campaign: c, step, go, presenter, entrant, setEntrant, marketingOptIn, setMarketingOptIn, entryRef, newEntry } = f;
  const nav = useNavigate();
  const [outcome, setOutcome] = useState<CardOutcome>('eligible');
  useStepParam('sweeps');

  const start = () => go('human');
  const toLanding = () => go('landing');
  const explore = () => screenTransition(() => nav('/'));
  // A presenter jump straight to the end still shows a complete entrant.
  const who = entrant.email ? entrant : DEMO_ENTRANT;

  if (step === 'landing' || step === 'coming-soon') {
    const scheduled = step === 'coming-soon';
    const cta = (
      <button type="button" className="btn btn-primary" disabled={scheduled} onClick={start}>
        Enter Now {!scheduled && <IconArrow size={18} />}
      </button>
    );
    return (
      <main>
        <ArenaFilm variant="sweeps" partner={c.ticketPartner} label="Register-to-Win: how it works">
          <header className="beat b-hero">
            <div className="beat-box w-full max-w-[36rem]">
              <div className="flex flex-wrap items-center gap-3">
                <Pulse size="sm" vt />
                <span className="eyebrow text-white">Visa Music Experiences</span>
                <TypeBadge c={c} />
              </div>
              <h1 className="display mt-4 text-[40px] sm:text-[60px] lg:text-[68px]">
                <BeatWords parts={['Enter for a chance to see', { text: c.artistName, className: 'bg-gradient-to-r from-white to-[#ffd76a] bg-clip-text pb-1 text-transparent' }, 'live']} />
              </h1>
              <p className="mt-4 max-w-md text-[16.5px] leading-relaxed text-white/85 sm:text-[18px]">
                Eligible Visa cardholders can register for a chance to win tickets to an unforgettable live music experience.
              </p>
              <EventInfo c={c} showTour={false} className="mt-5" />
              <div className="mt-2 flex items-center gap-2.5 text-[14.5px] text-white/85">
                <IconCalendar size={16} className="text-[var(--accent)]" />
                Entry period: {entryPeriod(c)}
              </div>
              <CampaignStatus
                c={c}
                scheduled={scheduled}
                cta="Enter Now"
                onStart={start}
                onOpen={toLanding}
                presenter={presenter}
                openWord="Entries"
                disclaimer={<>No purchase necessary. Eligibility restrictions apply. See <a href="#rules" className="underline underline-offset-2 hover:text-white">Official Rules</a>.</>}
              />
            </div>
          </header>
          <StepBeat n="01" eyebrow="Verify your Visa card" title="Eligibility comes first.">
            Verify an eligible Visa card before you fill in any details. It takes a few seconds.
          </StepBeat>
          <StepBeat n="02" eyebrow="Complete your entry" title="Every eligible entry counts the same.">
            Add your details and agree to the Official Rules. Entering early doesn’t change your chances.
          </StepBeat>
          <StepBeat n="03" eyebrow="Winners drawn at random" title="Chosen by chance, not by speed.">
            After entries close, Don Jagoda Associates runs a random drawing and contacts the selected winners.
          </StepBeat>
          <StepBeat n="04" eyebrow="You’re in the running" title="No further action needed." cta={cta}>
            If you’re selected, you’ll be contacted according to the Official Rules.
          </StepBeat>
        </ArenaFilm>

        <BenefitStrip
          items={[
            { icon: <IconStar size={22} />, title: 'A chance to win', body: 'Selected eligible entrants will have an opportunity to receive tickets.' },
            { icon: <IconShield size={22} />, title: 'Visa cardholder eligibility', body: 'Verify your Visa card before completing the entry form.' },
            { icon: <IconArrow size={22} />, title: 'Quick & secure', body: 'Eligibility, registration and confirmation in one guided experience.' },
            { icon: <IconUsers size={22} />, title: 'DJA administered', body: 'Don Jagoda administers the drawing and winner process.' },
          ]}
        />

        <Section id="how" eyebrow="How to enter" title="Five steps. One fair drawing.">
          <HowItWorks
            steps={[
              { title: 'Verify Your Visa Card', body: 'Confirm your card is eligible for this sweepstakes.' },
              { title: 'Complete Entry Form', body: 'Tell us where to reach you if you’re selected.' },
              { title: 'Review Rules & Consent', body: 'Agree to the Official Rules. Marketing emails are optional.' },
              { title: 'Receive Entry Confirmation', body: 'You’ll get an entry reference on screen.' },
              { title: 'Winner Selection by DJA', body: 'A random drawing after entries close.' },
            ]}
          />
        </Section>

        <Section id="info" eyebrow="The details" title="Prize, dates and rules" className="pt-0 sm:pt-0">
          <InfoGrid
            blocks={[
              { id: 'prize', title: 'The prize', body: <><p>{c.prizeDescription ?? 'Two tickets'} for {c.eventName} at {c.venue}, {c.city}.</p><p>Number of winners and approximate retail value are set out in the Official Rules.</p></> },
              { id: 'dates', title: 'Entry period & drawing', body: <><p>Entries accepted {entryPeriod(c)} ({instantParts(c.campaignCloseDateTime, c.timezone).time} close).</p><p>Random drawing on or about {dateLong(c.drawingDate)}. Winners are contacted by Don Jagoda Associates.</p></> },
              { id: 'eligibility', title: 'Eligibility', body: <><p>Open to legal residents of the {c.market} who hold {c.eligibilityType}. Age and other restrictions apply.</p><p>One entry per eligible card.</p></> },
              { id: 'rules', title: 'Official Rules', body: <><p>No purchase necessary. A purchase will not increase your chances of winning. Void where prohibited.</p><p>Administered by Don Jagoda Associates, Inc. <a className="text-[var(--accent)] underline underline-offset-2" href={c.campaignRulesUrl}>Read the Official Rules</a>.</p></> },
              { id: 'privacy', title: 'Privacy', body: <><p>Your entry details are shared with the sweepstakes administrator only to run the drawing and contact winners. Your card number is never shared.</p><p>See the <a className="text-[var(--accent)] underline underline-offset-2" href={c.privacyUrl}>Visa Privacy Notice</a>.</p></> },
              { id: 'terms', title: 'Terms', body: <><p>Prize is non-transferable. Visa and Don Jagoda Associates may verify eligibility before awarding any prize.</p></> },
            ]}
          />
        </Section>

        <Section id="faq" eyebrow="FAQs" title="Questions, answered." className="pt-0 sm:pt-0">
          <Faq
            items={[
              ['Do I need to buy anything to enter?', 'No purchase is necessary. See the Official Rules for full details.'],
              ['Does entering early improve my chances?', 'No. Winners are chosen by random drawing after the entry period closes.'],
              ['How many times can I enter?', 'One entry per eligible card.'],
              ['How will I know if I’ve won?', 'Selected winners are contacted by Don Jagoda Associates according to the Official Rules.'],
              ['Do I have to sign up for marketing emails?', 'No. Marketing emails from Visa are optional and do not affect your entry.'],
            ]}
          />
        </Section>
        <Footer />
      </main>
    );
  }

  let screen: JSX.Element;
  switch (step) {
    case 'human':
      screen = <HumanCheck presenter={presenter} onPass={() => go('card')} onFail={() => go('human-failed')} />;
      break;
    case 'card':
      screen = (
        <CardVerify flow="sweeps" stepLabel="Step 2 · Visa card" lead="Enter your eligible Visa card to confirm you can enter."
          presenter={presenter} onSubmit={(o) => { setOutcome(o); go('checking'); }} />
      );
      break;
    case 'checking':
      screen = <Checking onDone={() => go(NEXT[outcome])} />;
      break;
    case 'eligible':
      screen = <EligibleSweeps onContinue={() => go('form')} />;
      break;
    case 'form':
      screen = <EntryForm initial={entrant} presenter={presenter} onSubmit={(e) => { setEntrant(e); go('consent'); }} />;
      break;
    case 'consent':
      screen = (
        <ConsentBlock c={c} entrant={who} marketing={marketingOptIn} setMarketing={setMarketingOptIn} presenter={presenter}
          onEdit={() => go('form')} onSubmit={() => { newEntry(); go('confirmation'); }} />
      );
      break;
    case 'confirmation':
      screen = <Confirmation c={c} entryRef={entryRef} email={who.email} onExplore={explore} />;
      break;
    case 'dja':
    case 'transfer-pending':
      screen = <DjaHandoff c={c} entryRef={entryRef} email={who.email} pending={step === 'transfer-pending'} presenter={presenter} onExplore={explore} />;
      break;
    case 'human-failed':
      screen = (
        <StatusScreen tone="warn" title="We couldn’t complete the security check."
          actions={<button type="button" className="btn btn-primary" onClick={() => go('human')}>Try again</button>}>
          Please try again. If this keeps happening, refresh your browser or try another device.
        </StatusScreen>
      );
      break;
    case 'ineligible':
      screen = (
        <StatusScreen tone="error" title="This card is not eligible for this sweepstakes."
          actions={<><button type="button" className="btn btn-primary" onClick={() => go('card')}>Try Another Card</button><button type="button" className="btn btn-ghost" onClick={toLanding}>View Official Rules</button></>}>
          Please review the eligibility requirements or try another eligible Visa card.
          <span className="mt-2 block text-[13px] text-mute">See the Official Rules for full eligibility details.</span>
        </StatusScreen>
      );
      break;
    case 'duplicate':
      screen = (
        <StatusScreen tone="info" title="You’ve already entered with this card."
          actions={<><button type="button" className="btn btn-primary" onClick={explore}>Explore more Visa Music Experiences</button><button type="button" className="btn btn-ghost" onClick={toLanding}>View Official Rules</button></>}>
          Only one entry is allowed per eligible card. Your original entry is already in the drawing.
        </StatusScreen>
      );
      break;
    case 'vces-down':
      screen = (
        <StatusScreen tone="warn" title="Card verification is temporarily unavailable."
          actions={<button type="button" className="btn btn-primary" onClick={() => go('card')}>Try again</button>}>
          We couldn’t confirm your card just now. Nothing has been submitted. Please try again in a moment.
        </StatusScreen>
      );
      break;
    case 'closed':
      screen = (
        <StatusScreen tone="info" eyebrow="Visa Music Experiences" title="Entries are now closed."
          actions={<button type="button" className="btn btn-primary" onClick={explore}>Explore more Visa Music Experiences</button>}>
          The entry period for {c.artistName} ended {instantParts(c.campaignCloseDateTime, c.timezone).date}. The drawing takes place on or about {dateLong(c.drawingDate)}. Selected winners will be contacted according to the Official Rules.
        </StatusScreen>
      );
      break;
    default:
      screen = <StatusScreen title="Unknown state" actions={<button type="button" className="btn btn-primary" onClick={toLanding}>Back</button>} />;
  }

  return (
    <JourneyShell flow={f.def} step={step} c={c} presenter={presenter} onExit={toLanding}>
      {screen}
    </JourneyShell>
  );
}
