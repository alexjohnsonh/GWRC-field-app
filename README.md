# Fish Passage Inspection

Offline field app for Transmission Gully fish passage culvert maintenance inspections (WS.7).
Inspectors fill the form and take 4 photos with no coverage. Everything saves on the phone first, then
uploads to Firebase in the background. The office pulls everyone's inspections and makes the CSV,
the photo zip and the Greater Wellington Regional Council (Appendix C) PDF report.

Hosted on **GitHub Pages** (the app files) with **Firebase** as the backend (sign-in, data, photos).

## Files (all at the repo root)

| File | What it is |
|---|---|
| `index.html` | app screens and styles |
| `app.js` | app logic: form, photos, storage, export, GWRC PDF, cloud sync |
| `firebase-config.js` | **your Firebase project settings — fill this in** |
| `admin.html` | office page: add/remove people, change PINs |
| `sw.js` | service worker: caches the app for offline use (bump `VERSION` on every change) |
| `firestore.rules`, `storage.rules` | security rules to paste into the Firebase console |
| `cors.json` | lets the office browser download photos (one-time setting) |
| `firebase-*-compat.js` | Firebase JS SDK 10.14.1, kept here so the app loads offline |
| `jspdf.umd.min.js` | jsPDF 2.5.2 (MIT) for the PDF report |
| `manifest.webmanifest`, `icon-*.png` | home-screen install |

## Where data lives

| What | Where |
|---|---|
| On the phone | browser storage (answers) and IndexedDB (photos), until uploaded and after |
| Answers in the cloud | Firestore, collection `inspections`, one document per inspection |
| Photos in the cloud | Firebase Storage, `inspections/<id>/ph1.jpg` … `ph4.jpg` |
| Who can sign in | Firebase Authentication + Firestore collection `staff` |

Deleting an inspection on a phone never deletes the cloud copy.

## Sign-in (name + PIN)

People type their name and a 4–8 digit PIN, once per phone; the phone remembers them after that.
Behind the scenes this becomes a Firebase email/password login (e.g. `tim-olley.3fa1c2…@staff.tg-fish-passage.example.com`).
Nobody needs a real email address. The PIN is hashed into that ID, so it isn't visible in the console.
Access also requires an entry in the `staff` collection, which only admins can change.

## One-time Firebase setup

1. **Plan:** Firebase console → your project → upgrade to **Blaze** (needed for Storage). Add a budget alert in Google Cloud Billing.
2. **Authentication:** Build → Authentication → Get started → Sign-in method → **Email/Password** → Enable.
3. **Firestore:** Build → Firestore Database → Create database → location **australia-southeast1 (Sydney)** → production mode.
   Rules tab → replace everything with `firestore.rules` → Publish.
4. **Storage:** Build → Storage → Get started → same location. Rules tab → paste `storage.rules` → Publish.
   Note the bucket name shown at the top (e.g. `your-project.firebasestorage.app`).
5. **Web app settings:** Project settings (gear) → General → Your apps → Add app → Web. Copy the `firebaseConfig`
   values into `firebase-config.js` and commit.
6. **First admin:** open `https://<you>.github.io/<repo>/admin.html` → First-time setup → type your name and PIN.
   - Authentication → Users → Add user → paste the email and password it shows.
   - Firestore → Start collection `staff` → Document ID = that email → fields `name` = your name, `role` = `admin`.
   - Back on admin.html, sign in. Add everyone else from there (Tim etc.).
7. **Photo downloads for the office (CORS):** in the Google Cloud console open **Cloud Shell** (the `>_` button), upload `cors.json` and run:
   ```
   gcloud storage buckets update gs://gwrc-field-application.firebasestorage.app --cors-file=cors.json
   ```
   Without this, uploads still work; only "Get everyone's inspections" can't fetch photos.

## Phones

- Open the GitHub Pages link once with coverage, sign in, then Add to Home Screen.
- Saved tab → Cloud → Upload: **Wi-Fi only** (default), any connection, or only when you tap Sync now.
  iPhones can't report Wi-Fi vs mobile data, so on iPhone "Wi-Fi only" means "upload when I tap Sync now".
- Uploads go one piece at a time (answers, then each photo) with timeouts. A dropped connection pauses the queue and
  it resumes where it stopped. The app never waits on the network, so it can't freeze.

## Office

Sign in on a laptop → Saved tab → **Get everyone's inspections**. That copies all cloud inspections and photos into that
browser; then Download CSV / Download all (zip) / GWRC report cover everyone's data. You can also browse the data
directly in the Firebase console (Firestore and Storage).

## Making changes

Edit the file, and change `VERSION` in `sw.js` (e.g. `fpi-v4` → `fpi-v5`) in the same commit so phones pick it up.
If you change how logins are made (`loginEmail` in app.js), change it identically in admin.html.
