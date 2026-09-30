# Fish Passage Inspection

Offline field app for Transmission Gully fish passage culvert maintenance inspections (WS.7).
Captures the inspection form plus 4 required photos on a phone with no coverage, then exports a CSV + photos and a PDF "Greater Wellington Regional Council Report".

## Files
- `index.html` – the whole app (form, storage, export, PDF report). No build step. jsPDF 2.5.2 (MIT) is bundled inline so the report works offline.
- `sw.js` – service worker that caches the app for offline use. **Bump `VERSION` every time you change index.html**, or phones keep the old copy.
- `manifest.webmanifest`, `icon-*.png` – lets the phone install it to the home screen.

## Deploy (GitHub Pages)
1. Create a repo and upload these files to the root of the `main` branch.
2. Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`. Save.
3. After a minute the app is at `https://<user>.github.io/<repo>/`.

## Install on a phone
1. Open the URL once with coverage (Chrome on Android, Safari on iPhone).
2. Android: menu → Add to Home screen / Install app. iPhone: Share → Add to Home Screen.
3. Test: turn on flight mode, open it from the home screen, fill and save a test inspection.

## Data
- Records: `localStorage` (`fpi.records.v1`); draft `fpi.draft.v1`; last inspector `fpi.prefs.v1`.
- Photos: IndexedDB database `fpi`, store `photos` (resized to 1920 px JPEG).
- Data stays on that phone/browser only. Export regularly; use Backup file before changing phones or clearing browser data.

## Export
- CSV: one row per inspection, first column Culvert No. (saved upper case, single spaces), photo columns hold file names.
- Zip: CSV + `photos/` folder. Photos get a caption (culvert, view, date, time) burnt in at export.
- Photo names: `<CulvertNo>_<YYYYMMDD-HHMM>_<n>-<View>.jpg`.
- Merge with the TG Culvert Monitoring 2026 sheet at the office by matching Culvert No. to the sheet's Name column (e.g. XLOOKUP).

## GWRC PDF report
Saved tab → GWRC report. Pick a date range and tick the culverts to include, then Download or Share PDF.
Layout follows Appendix C (Fish Passage Maintenance Inspection Form – Transmission Gully): cover + summary table, then for each
inspection a completed form (Asset Identification, Inspection Details, WS.7 assessment, Asset Condition Summary, fish passage aids,
Recommended Remedial Actions, Follow-Up / Close-Out, Photo Log, Additional Notes) followed by the four photos.
Fields the app doesn't capture (Road/Catchment/Stream, Lat/Long, culvert type/diameter/length, rainfall, target species,
remedial actions, follow-up) are left blank for completion at the office. Code: search `buildReport` in index.html.
