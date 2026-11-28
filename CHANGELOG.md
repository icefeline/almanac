# Release notes

What changed in slow garden, newest first.

Written for the person using the app, not the person who wrote it — an entry
here should mean something to someone who has never opened the repo. Anything
purely internal is left out.

Everything below 1.3.1 was written retrospectively, from the commit history.
They were real releases; they just did not get notes at the time.

---

## slow garden 1.3.1

Unreleased

### Bug fixes

- If you opened a past card from the year view and then tried to put it away, sometimes it would not go. The drawer now closes when you pull down anywhere on it, not only on the small bar at the top — and on a phone with the app saved to the home screen, where there is no browser to escape to, that turned out to matter rather a lot.
- The tear only came away if you pulled it straight down. Thumbs do not move in straight lines. It now tears whichever way you pull it, barring upward, which would be pushing it back onto the pad.
- The line confirming your writing was saved sat below the share button, where it looked like it was confirming the share. It has moved up to sit with the log it is actually about, and it no longer nudges the share button down the page when it appears.
- On the reading page, the date sat oddly far from the card's name and the whole page opened a long way beneath the nav. Both closed up. The date is also the size of the today/year buttons now, rather than a size of its own.

### What's new

- The pictures in the about page's player now pulse in time with every song it comes with.
- A new song in the about page's player: the word II, by Shigeo Sekito.
- The first message after onboarding now sits straight on the sky, without the pale panel behind it.
- sphinx and anima joined the about desktop, with their own icons, and the questions folder has five new answers.
- The privacy policy and terms now cover sphinx and anima.

- Readings are no longer capped at seven. The first day past seven now shows a one-time thank-you, with a link straight through to that day's reading — no code, nothing to unlock, and no wall after it.
- The share control is a highlighted row on a VCR menu, lime on cobalt, in the same set-up-screen language as the sheet it opens. It was a dotted line before, and quiet enough to miss.

---

## slow garden 1.3.0

28 August 2026

### What's new

- **Share your reading.** A card built to be shared rather than screenshotted: 1080×1920, story-shaped, in four treatments. A full-bleed one with the artwork edge to edge; two typographic plates, dark and light; and a stamp, perforations and paper tooth included.
- Picking one is its own small thing — a menu borrowed from a DVD player, deep navy with pixel type and transport arrows, the templates on a rail you swipe rather than a list you read.
- Exports arrive named for the day and the card: `2026-08-28_the-world.png`.

Every share card carries the card's own reading and nothing else. No personalised insight, no transit line, and never a word of what you wrote. It knows the card; it does not know you. Nothing leaves your device unless you send it — the card is drawn in your own browser from data the app already had.

### Bug fixes

- Reversed draws were quietly sharing the upright reading. They now share the one you actually drew.
- The plates say which way up the card came, instead of truncating the question at the foot of the card.
- Court cards stopped printing a roman numeral they never had. The Fool keeps its nought, which it has earned.
- Cards beginning with "the" keep it on the stamp.
- The image treatments were doing precisely nothing on iOS, so the colours came out wrong on exactly the device most people share from.

---

## slow garden 1.2.0

21 August 2026

The launch release.

### What's new

- **The app answers to slow garden throughout.** It used to be slow hour.
- **Seven free readings** instead of three.
- **Supporters unlock the app for good.** A gift on Buy Me a Coffee returns a code that works forever, with no account and no database sitting behind it.
- A warning before a social-media in-app browser swallows your garden. Those browsers throw away everything you have written the moment they close, and there was no way to know that before it happened.
- Terms of use, and a privacy policy that reads like a document rather than like the app.
- Error tracking, with everything about the reader stripped out before anything is sent.

### Bug fixes

- Location permission was broken in production by a security header meant to protect it.
- Error reports were being dropped before they left the browser, so a week of them went into the void.
- A run of onboarding bugs that only ever appeared on real phones: the keyboard shoving the layout around, steps opening halfway down, the page dragging off its own canvas.
- Readings no longer wait on a slow network. Rate limiting and location lookups now have a clock on them and step aside if they take too long.
- The city field types in capitals, like the name field above it.

---

## slow garden 1.1.0

16 August 2026

### What's new

- **Every card has a scent.** A perfumer's accord in three tiers — what you meet first, the body of it, what is still there hours later — printed in full on the reading page. Fifteen of the recipes were revised while we were in there.
- The card holds its place through the tear-away, rather than moving as the page comes off.

### Bug fixes

- The year drawer fades its top edge instead of slicing content in half along a hard line.
- The reading fits its space, and the date develops in with the page.

---

## slow garden 1.0.0

15 August 2026

The first one. A card a day, a place to write, and a year to look back on.
