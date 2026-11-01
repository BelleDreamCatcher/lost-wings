# Lost Wings

A gentle companion app for the *Lost Wings* book: routines by room, wing checks, social energy, Chaos Bunny reports and more. You can add it to your phone's Home Screen and use it like an app.

It's a **Progressive Web App**: plain HTML, CSS and JavaScript, with no build step and no server code. Everything people enter is stored **only on their own device** (in the browser's local storage). Nothing is sent anywhere.

## What's in it

| Tab | Tools |
| --- | --- |
| **Today** | Wing check, next routine (switches to the gentle version on low-wing days), leave-the-house shortcuts, social energy, people nudges, prep-tonight list, tomorrow's outfit, "Chaos happened" button, permission slip |
| **Routines** | Morning/evening/custom routines by room, "Group by room", step-by-step run mode, season switch, low-wing versions, *Future You: prepare tonight*, **Can I leave the house?** checklists |
| **Energy** | Yellow social-energy week, sip/gulp/drain costs, love-it vs obligated, your energy rules with gentle heads-ups, rest suggestions, people and connection admin with feeling log, nudges and important dates |
| **Toolkit** | **Chaos Audit**, Chaos Bunny incident log and patterns, capsule wardrobe, permission slip, wings over time, shame journey (off by default, with content note and pause sheet), compliments jar |
| **Me** | Sparkles (no streaks), Queen/King of Devotion certificate, settings, back up and restore |

The Doctor's BFF folder from the concept mockups is deliberately not included.

## Personalising

Nearly everything can be edited inside the app:

- your name, accent colour, text size, reduce motion, and **Chaos mode** (cheekier copy)
- which tools are switched on, and which cards appear on Today and in what order
- wing state names, colours, messages and which ones count as "low wings", plus your own check-in tags
- routines, steps, rooms (and their order), season names, low-wing steps, the prep list
- leave-the-house checklists (add as many as you like)
- Chaos Audit life areas and which tool each points to
- energy rules (wording, on/off, limits, your own rules), weekly battery size, hidden-energy days
- kinds of chaos and the "what might help" advice for each
- wardrobe styles, outfits, colours and materials
- permission slip wording, mantras, shame-journey task titles, support people and crisis contacts
- the certificate title, plus "give myself a sparkle" for anything

First launch offers a choice of starting with Belle's examples (to edit) or with blank lists.

## Running it locally

Any static web server works, for example:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publishing it (GitHub Pages)

1. In the repository on GitHub, go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, pick the branch and the `/ (root)` folder, and save.
3. After a minute the app is live at `https://<your-username>.github.io/lost-wings/`.

## Adding it to an iPhone

Open the app's address in **Safari**, tap **Share**, then **Add to Home Screen**. It gets the bunny icon, opens full screen, and works offline.

## Backing up

**Me → My data → Back up now.** On iPhone this opens the Share sheet: choose **Save to Files** and pick any iCloud Drive folder. **Restore from a backup** opens Files so you can pick the backup from iCloud Drive.

## Updating

When you change any file, bump `VERSION` in `sw.js` (e.g. `lost-wings-v2`) so installed copies pick up the new version. If you add a new file, add it to the `FILES` list in `sw.js` too.

## Files

```
index.html            app shell
css/app.css           styles (the book's pastel palette)
js/core.js            helpers, default data, storage, sheets, sparkles
js/today.js           Today, wing check, permission slip
js/routines.js        routines, run mode, prep list, leave-the-house checklists
js/energy.js          social energy week, rules, people
js/toolkit.js         toolkit, Chaos Audit, Chaos Bunny log, wardrobe
js/shame.js           shame journey, compliments jar, pause sheet
js/me.js              sparkles, certificate, settings, data, onboarding
js/app.js             router and start-up
sw.js                 offline support
manifest.webmanifest  Home Screen app details
icons/                app icons
```

## A note on the shame journey

The concept mockups recommend having a mental health professional review the shame journey wording and pause sheet before releasing it publicly. It's switched off by default. Crisis numbers aren't built in, because they vary by country; people add their own local contacts in the pause sheet.

## Licence

© 2026 Belle DreamCatcher. All rights reserved. The app is free to use, but the code and content may not be copied or reused without permission. See [LICENSE](LICENSE).
