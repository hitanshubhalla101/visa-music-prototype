# Visa Music Experiences — interactive prototype

A front-end-only prototype of the two standardized Visa Music consumer journeys, built for live
walkthroughs with Visa stakeholders:

- **Flow A · Presale / Preferred Access** (`/access`): queue → security check → Visa card verification → duplicate check → unique access code → ticketing-partner handoff
- **Flow B · Register-to-Win** (`/sweepstakes`): security check → Visa card verification → entry form → rules & consent → confirmation → DJA administration

It also includes **Presenter Mode**, which adds stakeholder notes, lets you jump to any state and captures Visa's answers, and a **Campaign Configuration** drawer with a demo catalog of 150 campaigns.

> **Prototype only.** No backend, no network calls, no real payment or card APIs. Card verification (VCES),
> queues, codes, inventory and the DJA transfer are all simulated in the browser. Only the listed test
> card numbers are accepted, and card details are never stored. All artists, venues and people are fictional.

---

## Run locally

Requires **Node.js 18.18+ (20 or 22 LTS recommended)**. Get it from <https://nodejs.org>.

```bash
npm install
```

```bash
npm run dev
```

Open the URL Vite prints (usually <http://localhost:5173>).

Production build (output in `dist/`):

```bash
npm run build
```

```bash
npm run preview
```

---

## Deploy and get a shareable URL

The app is a static single-page app. `vercel.json` and `public/_redirects` already route every path
(`/access`, `/sweepstakes`) to `index.html`, so deep links work on refresh.

### Vercel, from the command line (quickest)

```bash
npx vercel
```

The first run asks you to log in and confirm the project settings. Accept the detected defaults
(framework **Vite**, build `npm run build`, output `dist`). You get a preview URL. To publish a
production URL:

```bash
npx vercel --prod
```

### Vercel, from GitHub

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New → Project**, then import the repository.
3. Keep the detected settings (Vite · `npm run build` · `dist`) and click **Deploy**.
4. Share the `https://<project>.vercel.app` URL. Every later push redeploys it.

### GitHub Pages (already set up for this repo)

`.github/workflows/pages.yml` builds and publishes on every push to `main`. Pages has no rewrite rules, so
that build uses hash URLs: `https://<user>.github.io/visa-music-prototype/#/access` and `#/sweepstakes`
(set by `VITE_HASH_ROUTER=1` and `VITE_BASE=./`). Deep links work as `#/access?step=code`. A Pages site
on a free GitHub account is public.

### Netlify (drag and drop)

1. Run `npm run build`.
2. Drag the `dist/` folder onto <https://app.netlify.com/drop>.

> The page sets `noindex`. If you want the link private, turn on Vercel's **Deployment Protection** or
> Netlify's password protection.

---

## Presenting

| Action | How |
|---|---|
| Toggle Presenter Mode | Header switch, or press **P** |
| Next / previous step | Panel buttons, or **→ / ←** (while Presenter Mode is on) |
| Jump to any state or exception | The chips in the presenter panel |
| Record Visa's answer | Mark each *Decision to confirm* as Open, Confirmed or Changed, and type a note |
| Export all answers | **Export notes** in the panel (copies Markdown and downloads `visa-music-decisions.md`) |
| Edit the campaign live | **Configure** (header, in Presenter Mode) |
| Deep link to a state | `/access?step=code`, `/sweepstakes?step=dja`, and so on (IDs are in `src/flows/*/steps.ts`) |

Presenter-only controls also appear inside the consumer screens as dashed purple chips, for example
*Simulate campaign opening*, *Advance Queue*, *Skip check* and *Simulate code allocation failure*.

Decision notes are saved to this browser's `localStorage` only.

### Suggested script

1. **`/`** — "There are essentially two standardized experiences."
2. **`/access`** — scroll the hero story (queue → verify → code → partner). Turn on Presenter Mode. Click
   *Simulate campaign opening*, then **Get Access to Tickets** → *Advance Queue* → **Verify & Continue** →
   **Use Eligible Test Card** → **Verify card** → (eligible → confirming access, automatic) → code → **Continue to Ticketmaster** → **Apply Code**.
3. Replay the card step with the ineligible and previously-used test cards, then show *Codes exhausted*,
   *Validation service unavailable* and *Code allocation failure* from the panel.
4. **`/sweepstakes`** — **Enter Now** → security check → eligible card → *Fill with demo entrant* →
   rules & consent (the marketing box is optional and unticked) → **Submit Entry** → **Next Step** to show the DJA handoff pipeline.
5. Open **Configure**, change the artist, and watch the landing page update. Then load any of the 150 catalog campaigns.

### Test cards (demo only)

| Card | Number | Expiry | CVV | Result |
|---|---|---|---|---|
| Eligible | 4000 0012 3456 7899 | 12/29 | 123 | Eligible |
| Ineligible | 4000 0098 7654 3210 | 08/28 | 456 | Not eligible |
| Previously used / registered | 4000 0055 5555 5559 | 03/30 | 789 | Already used (A) / already entered (B) |
| Service unavailable (presenter) | 4000 0000 0000 0119 | 01/31 | 000 | Verification unavailable |

The buttons under the card form fill these values in. Any other number is refused before "verification" runs.

---

## Campaign configuration

Every campaign is data. See `src/config/campaign.ts`:

- `CampaignConfig` holds `artistName`, `tourName`, `heroImage`, `eventName`, `venue`, `city`, `state`,
  `eventDate`, `eventTime`, `timezone`, `campaignType`, `campaignOpenDateTime`, `campaignCloseDateTime`,
  `market`, `language`, `ticketPartner`, `ticketPartnerUrl`, `eligibilityType`, `codeInventory`,
  `campaignRulesUrl`, `privacyUrl`, `marketingOptInEnabled` and `queueEnabled` (plus `prizeDescription`
  and `drawingDate` for sweepstakes).
- `DEFAULT_ACCESS` and `DEFAULT_SWEEPS` are the two demo campaigns.
- `CATALOG` is 150 generated, fictional campaigns across markets and languages.

`heroImage` accepts a built-in abstract artwork preset (`aurora`, `ember`, `tide`, `neon`, `dusk`) or
any image URL, so real artist creative can be swapped in by configuration.

The demo presale always opens **2 h 17 m 43 s after the page loads**, so the countdown starts at
`02:17:43` for every rehearsal.

---

## The hero scroll story

Each landing page opens with a scroll-driven WebGL2 scene (`src/film/`): an arena on show night,
inside and out, with no images or libraries. It follows one visual rule:

> **Blue means you're in.** A fan's wristband and the gate reader light Visa blue when their card is
> approved, and only then do they walk through the gate. Amber means the card isn't eligible: the gate
> stays shut and the fan steps aside. Gold (Register-to-Win only) marks entrants picked in the random drawing.

- **Access:** opens on the live show → dollies back out through the doors to the queue outside → at the gate, one fan's card is declined (amber) and the next is approved (blue) → the gate opens → the camera follows them inside as the floor fills with blue.
- **Register-to-Win:** opens on the show → verification at the gate → entries light up across the plaza → a gold spotlight picks winners at random → inside, the winners stand in gold follow-spots at the front of the stage.

- `world.ts` holds the shader, camera shots and shared positions; `engine.ts` handles the scroll → spring camera, clocks, callouts, calibration, sound and fallbacks.
- `?debug` exposes `__cine` for frame-by-frame checks: `__cine.manual(); __cine.park(2); __cine.tick(33, 120); __cine.gpu()`.
- `?debug&nogl` forces the no-WebGL fallback (a painted CSS backdrop; all copy stays live HTML).
- With `prefers-reduced-motion`, the scene shows static frames and UI animation is turned off.
- Sound is opt-in (the **Sound** button), synthesised, and off on every visit.

---

## Motion layer (120 BPM)

`src/motion/` adds a kinetic layer without changing content or flows:

- **The pulse** (`Pulse.tsx`) is one accent-coloured sound pulse. It sits in the landing hero and on the edge of every journey card, and morphs between shapes: dot (emits a ring every beat), wave (queue), equalizer (checking), progress (card form, entry form, consent) and burst (code issued, entry confirmed), which settles back to a dot after four beats. Edge states use a still dot.
- **Beat grid** (`beat.ts`): loops are phase-locked to one 500 ms clock. Headline words and form fields enter one per eighth note (250 ms, half a beat); change `STEP` to `BEAT` for a full beat per word or field.
- **Springs**: every move uses spring easing (`--spring*` tokens in `motion.css`).
- **Screen changes** are view transitions: the next screen opens as a circle from where you tapped (or from the pulse), and the pulse morphs between positions. Browsers without the View Transitions API switch instantly.
- **Numbers** (dates, countdown, queue, codes remaining, entry reference) roll like an odometer. Primary buttons swell once per bar when idle and drop on press.
- **Reduced motion** shows a static, fully usable version. Legal, eligibility and consent copy is never animated. No new audio: the existing opt-in Sound toggle is unchanged.

## Project structure

```
src/
  config/campaign.ts        Campaign type, demo campaigns, 150-campaign catalog
  flows/access/steps.ts     Flow A states + presenter notes (consumer sees / platform does / decisions)
  flows/sweeps/steps.ts     Flow B states + presenter notes
  state/DemoContext.tsx     Shared demo state (steps, presenter, config, code, entrant, notes)
  pages/                    Home, AccessPage, SweepsPage
  components/
    Header, Campaign (event info, countdown, status), Journey (shell, rail, status screens)
    Verification (queue, human check, VCES card form, checking)
    Access (eligible → confirming, code, partner page), Entry (form, consent, confirmation, DJA)
    Landing (benefits, how it works, info, FAQ, footer), PresenterPanel, ConfigDrawer, Art
  film/                     Scroll-story engine + arena world
  lib/                      Formatting (time zones), simulated services, helpers
```

To change consumer copy or presenter questions, edit `src/flows/*/steps.ts` and the page files.
To add a state, add it to the flow's `steps` (and to `walk` if it is on the main path), then render it in the page's `switch`.
