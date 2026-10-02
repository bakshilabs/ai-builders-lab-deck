# AI Builders Lab · Engagement, co-design and deployment deck

An animated, interactive HTML deck for ComputerXplorers: how we suggest building the AI Builders Lab **together**, around the loop

**LISTEN → CO-DESIGN → BUILD → TRAIN → PILOT → LEARN → IMPROVE → SCALE → LISTEN**

Children learn maths and science by building with AI: prompting step by step, predicting, testing, seeing cause and effect, and deciding. A unit is **six one-hour sessions**; each child works in a build that matches their interest (space, sport, music, the planet), climbs the prompt ladder, and finishes with a product to share.

No framework, no CDN, no backend. Fonts, three.js and every asset are local, so it runs offline and behind school firewalls.

---

## Run it

```bash
cd engagement-deck
npm run dev          # http://localhost:8790/engagement-deck/  (opens your browser)
```

- `npm run dev` starts a tiny zero-dependency Node server (`server.mjs`) that serves the **parent** folder, so slide 9 can embed the **live prototype** from `../ai-builders-lab/`. Use `node server.mjs --no-open` to skip opening a browser, or `PORT=9000 npm run dev` for another port.
- **Double-clicking `index.html` also works.** The live Lab then can't be verified from `file://`, so slide 9 shows the screenshot with a "Try the live Lab" button.
- `npm run build` copies the deck and the prototype side by side into `dist/` for static hosting (the live embed keeps working).
- Best in current Chrome, Edge, Safari or Firefox. Designed on a fixed 1920 × 1080 stage that scales to any window (letterboxed), so nothing reflows or overlaps on laptops, projectors or tablets in landscape.

## Controls

| Key / control | Does |
|---|---|
| → ↓ Space PageDown | Next build step, then next slide |
| ← ↑ Shift+Space PageUp | Back |
| Home / End | First / last slide |
| O or G | Overview of all slides (click or arrow keys + Enter to jump) |
| N | Presenter notes (talk track for every slide) |
| M | Sound on / off (also the speaker button) |
| R | Reduce motion (also the button; the OS setting is honoured too) |
| F | Full screen |
| H | Hide the controls |
| Section pills (top), progress bar (bottom) | Click to jump |
| Trackpad / mouse wheel, touch swipe | Next / previous |

URLs are per slide and per build step: `#/11` or `#/12/3`.

A clicker that sends PageUp/PageDown keeps working even while the live Lab has focus.

## Demo path (about 15 minutes)

1. **Slide 1:** the 3D Lab with the four interest worlds in orbit inside the eight-stage ring. "Build it. Test it. Question it." Not a game-playing club: children build something they care about by learning to work with AI.
2. **Slide 2:** click the thumbnails to look around the prototype. It's a starting point, built to be changed.
3. **Slides 3–4:** pedagogy leads. The four labels (know / built / need to learn / will test) keep fact and plan apart.
4. **Slides 5–7:** click the stakeholder groups; drag or play the 20-minute interview clock; press → to sort perspectives into the four (empty) piles.
5. **Slide 8:** open each part of the workshop running order.
6. **Slide 9: live prototype.** In Planet Builder type "Make a planet", spot the AI's guess (Earth-like gravity), add details ("a small red planet like Mars"), then numbers ("half of Earth's gravity…"): ask the room to predict, then test (0.5 m → 1.0 m). Switch builds with the Space / Sport / Music / Planet chips. Click outside the Lab or use the arrow buttons to move on.
7. **Slide 10:** press → through Idea → Prompt → Predict → Test → Decide → Explain; watch Prompt to Decide loop into new versions.
8. **Slide 11:** pick a world, press → to climb its prompts. Kick Lab shows the 70° misconception and the 30°/40°/50° table; Beat Lab plays the beat (sound on); Power Town blacks out at night until wind and a battery are added.
9. **Slide 12:** press → through sessions S1 to S6: ingredients 1 → 6, AI guesses 4 → 0, passive user → independent creator, then the four shareable products.
10. **Slide 13:** the signature moment. Press → to bring in example feedback, again to watch it fly into the product as particles, again for "Updated AI Lab", again to sort the priorities.
11. **Slides 14–18:** training, the pilot scorecard (tabs), the deployment network (press → twice, click any node), the monthly cycle, the orbit loop.
12. **Slides 19–25:** the network, what each side gives, the five gates, the partnership loop (click any stage), the outcome, and the next steps.

## Slides

| # | Slide | Motion and interaction |
|---|---|---|
| 1 | Build it. Test it. Question it. | 3D Lab ("Bit") with orbiting worlds and the glowing eight-stage ring, pointer parallax, ambient sound, ticker |
| 2 | We have a prototype | Counting numbers, clickable screen gallery, stamp |
| 3 | We want to build it with you | Strengths fly in and stream into the centre |
| 4 | Honest about where we are | Four labelled columns deal in |
| 5 | Start by listening | Interview bubbles pop in on connecting paths; click a group |
| 6 | The questions we want to answer | 20-minute clock: click, drag or play |
| 7 | From many perspectives to shared principles | Perspectives converge into four piles (build) |
| 8 | Then we get in a room | Running order accordion, sticky notes, question ticker |
| 9 | Don't just talk about the curriculum. Build it. | **Live embedded prototype** with build chips and fallback |
| 10 | See the learning model | Six steps with the repeating loop and versions (6 builds) |
| 11 | Same skills, different worlds | **3D worlds** for each build, prompt ladder, Beat Lab sound (3 builds) |
| 12 | Six sessions, one build that grows | 3D tower grows S1 → S6, ability meters, products (6 builds) |
| 13 | Then we build | **Feedback becomes product**: particles, live UI changes, priorities re-sort (5 builds) |
| 14 | Train the people who will deliver it | Sessions slide in, strike-through |
| 15 | Put it in front of real children | Scorecard tabs (no targets invented) |
| 16 | Test the real world | **Deployment network**: connections draw, test → verify → deploy → feedback pulses (3 builds) |
| 17 | Learn from every class | Feedback tokens flow through review, backlog, release, share (5 builds) |
| 18 | Then do it again | Continuous orbit loop with a counting cycle |
| 19 | From one class to a network | Network grows ring by ring (6 builds) |
| 20 | What ComputerXplorers gets | Floating cards |
| 21 | What we need from ComputerXplorers | Asks and commitments link up |
| 22 | Five gates, decided together | Gates open one by one; commercial path marked INDICATIVE / TO CONFIRM |
| 23 | The partnership | The loop with gates; click any stage; "We are here" |
| 24 | The outcome | Five beats, then the headline and the four products (6 builds) |
| 25 | Let's build the first version together | Next steps, ticker |

## Update it after each stage (no layout changes needed)

Everything that changes lives in **`js/content.js`**. Empty lists show clearly labelled placeholders.

| After… | Edit | Shows on |
|---|---|---|
| Agreeing interviewees | `participants: [{ name, role, group, date }]` | Slide 5 |
| The interviews | `findings.consensus / openQuestions / differences / implications` (`{ text, heardFrom }`), `findings.principles`, `findings.interviewsDone` | Slide 7 |
| Interview themes | `workshop.heard`, `workshop.date` | Slide 8 |
| The workshop | `scorecard.targets` (e.g. `{ "Engagement": "…" }`) | Slide 15 |
| Each gate | `gates[n].status` (`upcoming` / `now` / `passed`) and `decision` | Slides 22–23 |
| Moving round the loop | `progress.stage`, `progress.status` | Slide 23 ("We are here") |
| Each monthly release | `releases: [{ month, changed, why }]` | Slide 17 |
| Builds or prompts change | `builds`, `ladder`, `unit` (keep the ladder words identical to the prototype) | Slides 10–12 |

Rules: never add quotes, findings, results or targets before they exist; say where each finding came from; keep copy short, warm, UK English, no em dashes.

## Prototype screens

Captures live in `assets/screens/`. Until a file exists the deck shows a labelled frame naming the file to drop in:

`build-lab.jpg` (interest picker), `build-planet.jpg`, `build-kick.jpg`, `build-beat.jpg`, `build-power.jpg`, `prompt-ladder.jpg`, `teach.jpg` (session plan). The deck also accepts `student.jpg`, `curriculum.jpg`, `circle.jpg` and `landing.jpg` if you want to use them. Use 16:10 captures (e.g. 1440 × 900).

## Photography

Photo frames show art-directed placeholders (a line drawing and the intended shot) and swap in `assets/img/<id>.jpg` automatically once it exists. To generate them with the OpenAI Images API (your key is read from the environment only, never written to disk):

```bash
cd engagement-deck
node tools/generate-images.mjs --list                      # the shot list
OPENAI_API_KEY=sk-... node tools/generate-images.mjs        # all missing images
OPENAI_API_KEY=sk-... node tools/generate-images.mjs planet ladder   # regenerate these
```

Options: `OPENAI_IMAGE_MODEL` (default `gpt-image-1`), `QUALITY` (default `high`), `FORCE=1`, `CONCURRENCY`. Art direction: documentary photography, UK primary or after-school club, children aged 10–11 building with AI, instructors in plain navy polos, lime/teal/pink accents, no text, logos, game controllers, circuit boards or race cars. **Review every image** (hands, stray text, anything brand-like) and regenerate by id. You can also drop in real photos with the same file names.

## Sound, 3D and motion

- **Sound** is synthesised with Web Audio (no files): a soft whoosh on slide changes, ticks on buttons, pops on build steps, chimes on success moments, a quiet pad on slide 1, and Beat Lab's beat. It starts only after the first click or key press, never blocks content, and the mute choice is remembered.
- **3D** uses three.js r186, vendored as one classic script in `js/vendor/three.js` (so it works from `file://`). Only the active slide renders; pixel ratio is capped at 2 and scaled to the stage. Without WebGL the designed fallbacks show. To update three.js: `npm install && npm run vendor`.
- **Reduced motion** (OS setting or R): slide moves become fades, loops stop, 3D renders one still frame, numbers appear without counting.

## Files

```
index.html           all slides (copy lives here) + chrome
css/tokens.css       design tokens copied from the AI Builders Lab
css/deck.css         stage, transitions, chrome, shared components (CURVE, DOT, NODE, CARD, NUMBER, ARROW, PATH, TAG)
css/slides.css       slide layouts
js/content.js        EDITABLE content (findings, participants, gates, builds, sessions…)
js/ui.js             icons and the "Bit" characters (from the AI Builders Lab)
js/images.js         photo placeholders and screen fallbacks
js/sound.js          Web Audio sound design
js/scenes.js         three.js scenes (hero, worlds, particles)
js/deck.js           engine: scaling, navigation, builds, ribbon, overview, notes
js/slides.js         per-slide controllers and interactions
js/vendor/three.js   three.js (MIT), vendored
server.mjs           zero-dependency dev server (port 8790)
tools/               generate-images.mjs · vendor-three.mjs · build.mjs
assets/              fonts (OFL) · screens · img
```

## Known limitations

- Photos and new prototype captures are placeholders until generated or dropped in (see above).
- Slide 9 needs `npm run dev` to verify and show the live Lab; from `file://` it offers a best-effort "Try the live Lab".
- The live Lab captures keyboard input while you use it: click outside it (or use the arrow buttons or a clicker) to continue.
- The session progression, scorecard and gates describe the **design**, to be tested in the pilot. Nothing in the deck is a result.
