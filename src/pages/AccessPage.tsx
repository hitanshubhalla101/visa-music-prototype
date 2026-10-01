import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArenaFilm, StepBeat } from '../film/ArenaFilm';
import { CodeScreen, EligibleAccess, PartnerPage } from '../components/Access';
import { CampaignStatus, EventInfo, TypeBadge, opensAt } from '../components/Campaign';
import { IconArrow, IconLock, IconShield, IconStar, IconTicket } from '../components/Icons';
import { JourneyShell, StatusScreen } from '../components/Journey';
import { BenefitStrip, Faq, Footer, HowItWorks, InfoGrid, Section } from '../components/Landing';
import { CardVerify, Checking, HumanCheck, QueueScreen } from '../components/Verification';
import type { CardOutcome } from '../lib/demo';
import { eventDateLong, eventTimeLabel, instantParts, n } from '../lib/format';
import { useFlow } from '../state/DemoContext';
import { useStepParam } from './useStepParam';
import { screenTransition } from '../motion/beat';
import { Pulse } from '../motion/Pulse';
import { BeatWords } from '../motion/Text';

const NEXT: Record<CardOutcome, string> = { eligible: 'eligible', ineligible: 'ineligible', used: 'already-used', unavailable: 'vces-down' };

export function AccessPage() {
  const f = useFlow('access');
  const { campaign: c, step, go, presenter, code, remaining } = f;
  const nav = useNavigate();
  const [outcome, setOutcome] = useState<CardOutcome>('eligible');
  useStepParam('access');

  const preferred = c.campaignType === 'preferred';
  const product = 'Visa Music Access';
  const openWord = preferred ? 'Preferred access' : 'Presale';
  const start = () => go(remaining <= 0 ? 'exhausted' : c.queueEnabled ? 'queue' : 'human');
  const toLanding = () => go('landing');
  const explore = () => screenTransition(() => nav('/'));

  const { issueCode } = f;
  useEffect(() => {
    if (step === 'code') issueCode();
  }, [step, issueCode]);

  if (step === 'coming-soon' || step === 'landing') {
    const scheduled = step === 'coming-soon';
    return (
      <main>
        <ArenaFilm variant="access" partner={c.ticketPartner} label={`${product}: how it works`}>
          <header className="beat b-hero">
            <div className="beat-box w-full max-w-[36rem]">
              <div className="flex flex-wrap items-center gap-3">
                <Pulse size="sm" vt />
                <span className="eyebrow text-white">Visa Music Access</span>
                <TypeBadge c={c} />
              </div>
              <h1 className="display mt-4 text-[40px] sm:text-[60px] lg:text-[68px]">
                <BeatWords parts={[`Get ${preferred ? 'preferred' : 'early'} access to see`, { text: c.artistName, className: 'bg-gradient-to-r from-white to-[#9fb6ff] bg-clip-text pb-1 text-transparent' }, 'live']} />
              </h1>
              <p className="mt-4 max-w-md text-[16.5px] leading-relaxed text-white/85 sm:text-[18px]">
                {preferred
                  ? 'Eligible Visa cardholders can access reserved seating during the general on-sale.'
                  : 'Eligible Visa cardholders can get access to tickets before the general public.'}
              </p>
              <EventInfo c={c} className="mt-5" />
              <CampaignStatus
                c={c}
                scheduled={scheduled}
                cta="Get Access to Tickets"
                onStart={start}
                onOpen={toLanding}
                presenter={presenter}
                openWord={openWord}
                disclaimer={<>Access does not guarantee ticket availability. <a href="#terms" className="underline underline-offset-2 hover:text-white">Terms and eligibility apply.</a></>}
              />
            </div>
          </header>
          <StepBeat n="01" eyebrow="Join the queue" title="Demand is high. Your place is held.">
            When {openWord.toLowerCase()} opens, fans join one line and are let through in batches, so card verification stays quick for everyone.
          </StepBeat>
          <StepBeat n="02" eyebrow="Verify your Visa card" title="Only eligible cards get through.">
            Eligibility is confirmed securely before an access code is issued. A card that doesn’t qualify doesn’t receive one.
          </StepBeat>
          <StepBeat n="03" eyebrow="Receive your unique code" title="One code. One eligible card.">
            Your code appears on screen the moment your card is confirmed. It’s yours alone.
          </StepBeat>
          <StepBeat
            n="04"
            eyebrow={`Continue to ${c.ticketPartner}`}
            title="Then the show is yours to book."
            cta={
              <button type="button" className="btn btn-primary" disabled={scheduled} onClick={start}>
                {scheduled ? `${openWord} opens ${instantParts(new Date(opensAt(c)).toISOString(), c.timezone).date}` : 'Get Access to Tickets'}
                {!scheduled && <IconArrow size={18} />}
              </button>
            }
          >
            Use your code on {c.ticketPartner} to see eligible tickets. Access does not guarantee availability.
          </StepBeat>
        </ArenaFilm>

        <BenefitStrip
          items={[
            { icon: <IconTicket size={22} />, title: 'Presale access', body: 'Get access to tickets up to 48 hours before the general public.' },
            { icon: <IconStar size={22} />, title: 'Preferred seating', body: 'Access reserved seating during general on-sale for eligible Visa cardholders.' },
            { icon: <IconShield size={22} />, title: 'Only for eligible Visa cardholders', body: 'Eligibility is confirmed securely before an access code is issued.' },
            { icon: <IconLock size={22} />, title: 'Secure experience', body: 'Standard Visa eligibility and campaign protections apply.' },
          ]}
        />

        <Section id="how" eyebrow="How it works" title="Four steps from here to the show.">
          <HowItWorks
            steps={[
              { title: 'Join the Queue', body: 'When access opens, you’ll join a short virtual line.' },
              { title: 'Verify Your Visa Card', body: 'We confirm your card is eligible for this offer.' },
              { title: 'Receive Your Unique Code', body: 'One code per eligible card, shown right away.' },
              { title: `Continue to ${c.ticketPartner}`, body: 'Enter your code to see eligible tickets.' },
            ]}
          />
        </Section>

        <Section id="info" eyebrow="Before you start" title="Important information" className="pt-0 sm:pt-0">
          <InfoGrid
            blocks={[
              {
                id: 'important',
                title: 'Important information',
                body: (
                  <>
                    <p>{openWord} runs {instantParts(new Date(opensAt(c)).toISOString(), c.timezone).date} at {instantParts(new Date(opensAt(c)).toISOString(), c.timezone).time} until {instantParts(c.campaignCloseDateTime, c.timezone).date} at {instantParts(c.campaignCloseDateTime, c.timezone).time}, or while codes last.</p>
                    <p>Access codes are limited ({n(c.codeInventory)} for this event). Receiving a code does not guarantee ticket availability.</p>
                    <p>Tickets are sold by {c.ticketPartner}. Prices, fees and ticket limits are set by the ticketing partner.</p>
                  </>
                ),
              },
              {
                id: 'eligibility',
                title: 'Eligibility',
                body: (
                  <>
                    <p>Open to holders of {c.eligibilityType}.</p>
                    <p>One access code per eligible card for this offer. Other restrictions may apply.</p>
                  </>
                ),
              },
              {
                id: 'terms',
                title: 'Terms',
                body: (
                  <>
                    <p>Offer valid for {c.eventName} at {c.venue}, {c.city}, on {eventDateLong(c)} at {eventTimeLabel(c)}.</p>
                    <p>Codes are non-transferable and may not be resold. Visa may end or change this offer at any time. <a className="text-[var(--accent)] underline underline-offset-2" href={c.campaignRulesUrl}>Full terms</a>.</p>
                  </>
                ),
              },
              {
                id: 'privacy',
                title: 'Privacy',
                body: (
                  <>
                    <p>Your card number is used only to confirm eligibility and is not stored or shared with the ticketing partner.</p>
                    <p>See the <a className="text-[var(--accent)] underline underline-offset-2" href={c.privacyUrl}>Visa Privacy Notice</a>.</p>
                  </>
                ),
              },
            ]}
          />
        </Section>

        <Section id="faq" eyebrow="FAQs" title="Questions, answered." className="pt-0 sm:pt-0">
          <Faq
            items={[
              ['What is Visa Music Access?', `A way for eligible Visa cardholders to get access to tickets for ${c.artistName} before the general public, or to reserved seating during the general on-sale.`],
              ['Does an access code guarantee tickets?', 'No. A code gives you access to eligible tickets while they last. Availability is managed by the ticketing partner.'],
              ['Which cards are eligible?', `This offer is open to ${c.eligibilityType}. The eligibility check happens before a code is issued.`],
              ['Can I get more than one code?', 'Each eligible card can receive one code for this offer.'],
              [`When does ${openWord.toLowerCase()} start?`, `${openWord} opens ${instantParts(new Date(opensAt(c)).toISOString(), c.timezone).date} at ${instantParts(new Date(opensAt(c)).toISOString(), c.timezone).time} and runs while codes last.`],
              ['Is my card information stored?', 'Your card number is used to check eligibility and is not stored or shared with the ticketing partner.'],
            ]}
          />
        </Section>
        <Footer />
      </main>
    );
  }

  if (step === 'partner' || step === 'unlocked') {
    return <PartnerPage c={c} code={code} unlocked={step === 'unlocked'} onApply={() => go('unlocked')} onBack={toLanding} presenter={presenter} />;
  }

  const close = instantParts(c.campaignCloseDateTime, c.timezone);
  let screen: JSX.Element;
  switch (step) {
    case 'queue':
      screen = <QueueScreen product={product} presenter={presenter} onAdmit={() => go('human')} />;
      break;
    case 'human':
      screen = <HumanCheck presenter={presenter} onPass={() => go('card')} onFail={() => go('human-failed')} />;
      break;
    case 'card':
      screen = (
        <CardVerify flow="access" stepLabel="Step 2 · Visa card" lead="Enter your eligible Visa card to confirm access to this offer."
          presenter={presenter} onSubmit={(o) => { setOutcome(o); go('checking'); }} />
      );
      break;
    case 'checking':
      screen = <Checking onDone={() => go(NEXT[outcome])} />;
      break;
    case 'eligible':
      screen = <EligibleAccess presenter={presenter} onDone={() => go(remaining <= 0 ? 'exhausted' : 'code')} onAllocationError={() => go('allocation-error')} />;
      break;
    case 'code':
      screen = <CodeScreen c={c} code={code} remaining={remaining} onContinue={() => go('partner')} />;
      break;
    case 'exhausted':
      screen = (
        <StatusScreen tone="info" eyebrow={product} title="All available access codes have been distributed."
          actions={<><button type="button" className="btn btn-primary" onClick={explore}>Explore more Visa Music Experiences</button><button type="button" className="btn btn-ghost" onClick={toLanding}>View event details</button></>}>
          Thank you for your interest in {c.artistName}. Every Visa access code for this event has now been claimed. General on-sale details will be available from {c.ticketPartner}.
        </StatusScreen>
      );
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
        <StatusScreen tone="error" title="This card is not eligible for this offer."
          actions={<><button type="button" className="btn btn-primary" onClick={() => go('card')}>Try Another Card</button><button type="button" className="btn btn-ghost" onClick={toLanding}>Review eligibility</button></>}>
          Please review the eligibility requirements or try another eligible Visa card.
          <span className="mt-2 block text-[13px] text-mute">This offer is for {c.eligibilityType}.</span>
        </StatusScreen>
      );
      break;
    case 'already-used':
      screen = (
        <StatusScreen tone="info" title="This card has already received an access code for this offer."
          actions={<><button type="button" className="btn btn-primary" onClick={toLanding}>View Offer Details</button><button type="button" className="btn btn-ghost" onClick={() => go('card')}>Try another card</button></>}>
          Each eligible card can receive one code for this offer. Use the code you received earlier on {c.ticketPartner}.
        </StatusScreen>
      );
      break;
    case 'vces-down':
      screen = (
        <StatusScreen tone="warn" title="Card verification is temporarily unavailable."
          actions={<button type="button" className="btn btn-primary" onClick={() => go('card')}>Try again</button>}>
          We couldn’t confirm your card just now. Your place is saved. Please try again in a moment.
        </StatusScreen>
      );
      break;
    case 'allocation-error':
      screen = (
        <StatusScreen tone="warn" title="We couldn’t issue your code just now."
          actions={<button type="button" className="btn btn-primary" onClick={() => go('eligible')}>Try again</button>}>
          Your card is eligible. Please try again. You’ll never receive more than one code for this offer.
        </StatusScreen>
      );
      break;
    case 'closed':
      screen = (
        <StatusScreen tone="info" eyebrow={product} title={`This ${preferred ? 'offer' : 'presale'} has ended.`}
          actions={<button type="button" className="btn btn-primary" onClick={explore}>Explore more Visa Music Experiences</button>}>
          The Visa {openWord.toLowerCase()} for {c.artistName} closed on {close.date} at {close.time}. Thank you for your interest.
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
