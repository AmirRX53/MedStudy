# MedStudy 1.0.1 Release Notes

- **Version:** 1.0.1
- **Release date:** August 26, 2026
- **Supported platform:** Windows 10 or later, 64-bit
- **Installer:** `MedStudy-Setup-1.0.1.exe`
- **SHA-256 checksum:**
  ```
  b60d4372cd9adb2cd7cbd3cb47e4ca8a2b56cf79923971cc5f6063b28056271b
  ```
- **Support contact:** `amirrx53@protonmail.com`

## About

MedStudy is a local-first medical exam review app. It organizes study material into
subjects, chapters, and diseases with keywords, then helps you review with flashcards
and five quiz types. No account, internet connection, or cloud service is required —
all data lives on your computer.

## What's new in 1.0.1

This is the final release. Changes since the 1.0.0 beta:

- **Security:** upgraded the spreadsheet library (`xlsx`) to SheetJS 0.20.3, fixing
  high-severity vulnerabilities (prototype pollution and ReDoS) in the npm 0.18.5 build.
  `npm audit` now reports zero vulnerabilities.
- **Smaller installer:** build-time dependencies are no longer bundled into the
  packaged application, reducing the installer size and the packaged `app.asar`
  (~27 MB of dead `node_modules` removed).
- **Maximum compression:** packaging is configured with `compression: "maximum"`
  (solid LZMA). The NSIS installer already compresses at the highest level, so
  this keeps the setting consistent for any future targets.
- **Crash recovery:** an application-level error boundary now shows a reload screen
  with guidance instead of a blank window if the renderer hits an unexpected error.
- **Documentation:** the README now accurately describes the JSON data file, the data
  location, and the installer output directory.
- **Version consistency:** the in-app footer now shows Version 1.0.1 in English and
  Persian, matching the package version and installer name.

## Features

- **Home dashboard** — overview counters, a random review card, quick-start
  shortcuts, and a study-goal reminder.
- **Subjects and chapters** — create, edit, delete, and drag-and-drop reorder;
  keyboard reordering supported; open a chapter directly into filtered Flashcards.
- **Disease library** — add, edit, delete, search, filter, and shuffle disease
  records with keywords.
- **Spreadsheet import/export** — import XLSX, XLS, or CSV (missing subjects and
  chapters are created automatically; duplicate diseases merge keywords); export
  the library to XLSX.
- **Flashcards** — flip, navigate, shuffle, zoom (50–150%), filter and search,
  show/hide the subject › chapter path, and rate cards.
- **Spaced repetition** — SM-2 scheduling with due dates, review sessions, and
  per-card intervals (Again / Hard / Good / Easy), capped at 365 days.
- **Hard keywords** — mark difficult keywords on the back of a card; they are
  highlighted and counted in Statistics.
- **Practice quizzes** — five modes: Multiple Choice, True or False, Fill in the
  Blank, Match Keywords, and Multiple Select (fractional scoring); difficulty-aware
  question selection (Mixed / Easy / Medium / Hard focus).
- **Statistics** — overview cards, score distribution, top/low scorers, and sortable
  per-subject, per-chapter, and per-disease tables with tooltips.
- **Localization and themes** — English and Persian with right-to-left layout; light
  and dark themes; six accent colors.
- **Backup and restore** — full JSON export and import from Settings.
- **Desktop persistence** — secure Electron preload bridge; data is stored locally
  in `%APPDATA%\MedStudy\medstudy-data.json` (written atomically via a temp file).

## Installation

1. Download `MedStudy-Setup-1.0.1.exe`.
2. (Recommended) Verify the SHA-256 checksum above matches the downloaded file.
3. Run the installer. You can choose the installation directory; a Desktop shortcut
   is created by default.
4. Launch MedStudy from the Start Menu or the Desktop shortcut.
5. The app is not code-signed, so Windows SmartScreen may show a "Windows protected
   your PC" or unknown-publisher warning. Click **More info → Run anyway** if you
   trust the source of the file.

## Backup instructions

MedStudy stores data locally, and backups protect against disk failure or accidental
deletion. Export regularly:

1. Open **Settings** (the ⚙️ button in the header).
2. Under **Data Management**, choose **Export Data**.
3. Save the JSON file somewhere safe (outside the app data folder).

To restore: choose **Import Data** in the same menu and select a backup file.
Import replaces the matching keys and reloads the app.

Export a JSON backup **before** uninstalling, moving the app, deleting a subject or
chapter, or using **Delete All Data**.

## Uninstall and data preservation

- Uninstall MedStudy through Windows **Settings → Apps → Installed apps**.
- Your study data lives in `%APPDATA%\MedStudy\medstudy-data.json`, **outside** the
  installation directory, so it survives uninstall, reinstall, and application
  updates.
- To remove all data permanently, delete the `%APPDATA%\MedStudy` folder (after
  taking a backup) or use **Delete All Data** inside the app.

## First five minutes

1. **Subjects** — add a subject (for example, "Cardiology").
2. **Chapters** — expand the subject and add a chapter (for example, "Coronary
   Artery Disease").
3. **Diseases** — add a disease with its keywords.
4. **Flashcards** — review the card, flip it, and rate it.
5. **Practice** — take a quiz to check your knowledge.

## Known limitations

- **Local-only:** no accounts, cloud sync, or collaboration. Data never leaves your
  computer.
- **No timed mock exams**, clinical-vignette authoring, image-based questions, or
  answer explanations/references.
- **Medical content is user-created** and is not professionally reviewed or verified
  against guidelines, textbooks, or official exam banks. Verify current guidance
  from authoritative sources.
- **External fonts:** the app loads Inter and Vazirmatn from Google Fonts when
  online; fully offline it falls back to system fonts.
- **Structural deletion is destructive:** deleting a subject or chapter also deletes
  its diseases and their review data. Export a backup first.
- **Scores are averages:** flashcard ratings produce running averages and SM-2
  scheduling; they do not predict exam readiness.

## Known data risks

- Data is a single local JSON file; disk failure or accidental deletion of the app
  data folder means data loss unless you keep JSON backups.
- **Delete All Data** and **Delete Subject/Chapter** are irreversible.
- Backups contain your study notes — protect them like any private file.
- Do not enter identifiable patient information.

## Reporting issues

Include in a bug report:

- App version (footer shows Version 1.0.1) and Windows version.
- The screen or workflow where the problem occurred.
- Steps to reproduce.
- Whether the problem survives an app restart.
- A screenshot or screen recording when safe.

**Never include patient-identifiable information in bug reports or backups.**

## Medical educational-use disclaimer

> MedStudy is an educational exam-preparation tool. It is not a substitute for
> current clinical guidelines, institutional protocols, supervision, or professional
> medical judgment. Do not enter identifiable patient information.
