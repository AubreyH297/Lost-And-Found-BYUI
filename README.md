Here's the files for our website. Update them and commit to this repository as you complete tasks. # Lost-And-Found-BYUI

## Branch `foundit-redesign`: a preview of a full redesign

This branch is a design preview for the team. It is not merged into `main`.

### What's new

- **New look:** dark "search" hero with radar rings and floating items, light and dark themes, smooth page transitions, cards that tilt toward the mouse.
- **Live board:** reads the lost-item Google Sheet and shows every real report as a card. While the board is nearly empty, clearly marked **Sample** items show how it looks when busy.
- **Browse:** filters for What / Where / When, categories, Lost or Found, sorting. Filters live in the URL, so a filtered view can be shared. Each item opens a details window with its photo, "Show on map" and "Copy link".
- **Campus map:** each report lands on its BYU-Idaho building (building names and coordinates from OpenStreetMap).
- **Report:** choose "I lost something" or "I found something" and the matching Google Form opens right on the page.
- **New pages:** How to claim (step timeline), FAQ (with search), About (team and how we built it).
- Works on phones, by keyboard, and respects "reduce motion".

### Pages

`index.html` (home), `items.html` (browse), `report.html`, `claim.html`, `faq.html`, `about.html`

### Files

| File | What it does |
|---|---|
| `assets/js/config.js` | Links to the Google Forms and the published Sheets. **Edit links here.** |
| `assets/css/foundit.css` | All styles (colors, layout, animations, light and dark themes) |
| `assets/js/data.js` | Loads the sheets, works out categories and dates, sample items |
| `assets/js/buildings.js` | Campus buildings and the words people type for them ("STC", "I-Center"…) |
| `assets/js/site.js` | Header, theme switch, animations, item cards, item details window |
| `assets/js/map.js` | Campus map (Leaflet + OpenStreetMap) |
| `assets/js/home.js`, `browse.js`, `report.js`, `faq.js` | Page scripts |

### Before this could go live

- Found-item form: put its link in `foundForm` and its published sheet in `foundItemsCsv` (`config.js`).
- Publish only sheet tabs **without names, emails or phone numbers**: every published column can show up on the site.
- `showSamplesWhenFewerThan` in `config.js` controls the sample items (0 = never show them).

### Run it locally

Any static server works, for example `python3 -m http.server` in this folder, then open http://localhost:8000.
