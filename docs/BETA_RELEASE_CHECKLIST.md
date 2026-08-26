# MedStudy Beta Release Checklist

This checklist is the ordered release process for preparing MedStudy `0.1.0-beta.1` or another intentional beta version.

It is written for the current React/Vite/Electron implementation. Complete the sections in order. Do not distribute the installer until every **Release Blocker** is either complete or explicitly accepted by the release owner.

## Release Status

- [ ] Release owner assigned: `____________________________`
- [ ] Target beta version: `____________________________`
- [ ] Target release date: `____________________________`
- [ ] Supported platform confirmed: `Windows ____________________`
- [ ] Distribution channel confirmed: `____________________________`
- [ ] Support email or issue URL confirmed: `____________________________`
- [ ] Medical-content reviewer confirmed: `____________________________`

## Priority Levels

- **Release Blocker:** fix or explicitly document before sending the installer to external beta users.
- **Required:** complete before a responsible beta release whenever possible.
- **Recommended:** useful hardening that can follow the first beta if it does not affect data safety or core usability.

## 1. Freeze the Beta Scope

### Release Blocker

- [ ] Decide exactly what the beta includes:
  - [ ] Home dashboard.
  - [ ] Subjects and chapters.
  - [ ] Disease library.
  - [ ] Spreadsheet import/export.
  - [ ] Flashcards.
  - [ ] Five quiz types.
  - [ ] Statistics.
  - [ ] English and Persian languages.
  - [ ] Light and dark themes.
  - [ ] JSON backup and restore.
  - [ ] Windows Electron installer.
- [ ] Record features that are explicitly **not** included:
  - [ ] Cloud synchronization.
  - [ ] Accounts or login.
  - [ ] Timed mock examinations.
  - [ ] Spaced-repetition scheduling with due dates.
  - [ ] Clinical-vignette authoring.
  - [ ] Image-based questions.
  - [ ] Clinical explanations and references.
  - [ ] Collaboration or shared libraries.
- [ ] Do not advertise roadmap features as if they are implemented.
- [ ] Decide whether the beta is for internal testers only or external medical users.
- [ ] Define the maximum number of beta users and how feedback will be collected.

## 2. Fix Data-Safety Blockers

The current application uses both renderer `localStorage` and Electron JSON persistence. Data behavior must be made reliable before external distribution.

### Release Blocker: startup hydration

- [ ] Ensure Electron data hydration completes before React providers initialize.
- [ ] Prevent empty initial state from overwriting existing desktop data while hydration is still in progress.
- [ ] Add a visible loading state while desktop storage is being hydrated.
- [ ] Test first launch with no existing data.
- [ ] Test restart with existing subjects and diseases.
- [ ] Test restart with existing scores, hard keywords, and quiz count.

### Release Blocker: one storage path

- [ ] Route subjects and diseases through the shared storage abstraction.
- [ ] Route flashcard scores through the same storage abstraction.
- [ ] Route hard-keyword data through the same storage abstraction.
- [ ] Route quiz-completion data through the same storage abstraction.
- [ ] Route JSON import and delete-all-data through the same desktop-aware storage abstraction.
- [ ] Confirm every important write reaches both renderer storage and Electron `medstudy-data.json` in the packaged app.
- [ ] Confirm every important delete removes both renderer and Electron values.
- [ ] Confirm storage write failures are surfaced or logged clearly.

### Release Blocker: preference keys

- [ ] Standardize the theme key to one spelling. The current code uses both `medstudy-theme` and `medistudy-theme`.
- [ ] Standardize the accent key to one spelling. The current code uses both `medstudy-accent` and `medistudy-accent`.
- [ ] Standardize the language key. The provider uses `medstudy-lang`, while backup handling also uses `medstudy-language`.
- [ ] Add migration logic for beta testers who already have data under the old keys.
- [ ] Test theme persistence after restart.
- [ ] Test accent persistence after restart.
- [ ] Test language persistence after restart.
- [ ] Test import/export of settings using the final key names.

### Release Blocker: backup and restore

- [ ] Export a complete JSON backup from the packaged desktop application.
- [ ] Confirm the backup contains subjects and chapters.
- [ ] Confirm the backup contains diseases and keywords.
- [ ] Confirm the backup contains review scores.
- [ ] Confirm the backup contains hard-keyword state.
- [ ] Confirm the backup contains quiz completion count.
- [ ] Confirm the backup contains theme, accent, and language preferences.
- [ ] Import the backup into a clean profile.
- [ ] Verify all restored data after application restart.
- [ ] Test invalid JSON.
- [ ] Test an empty JSON object.
- [ ] Test a backup containing unknown keys.
- [ ] Test a backup with incorrect value types.
- [ ] Add a backup date and application-version field if practical.
- [ ] Document that XLSX export does not include scores or settings.

## 3. Fix Known Functional Issues

### Release Blocker

- [ ] Correct the Flashcards previous-card keyboard handler from `ArrowLeft  ` to `ArrowLeft`.
- [ ] Add an application-level React error boundary.
- [ ] Give the error boundary a reload action and a support/contact instruction.
- [ ] Ensure renderer errors do not leave users with an unexplained blank window.
- [ ] Handle failed or malformed spreadsheet imports without crashing the page.
- [ ] Handle missing subject/chapter references without silently corrupting disease data.
- [ ] Decide and implement the expected behavior when a subject or chapter is deleted while diseases reference it.
- [ ] Test the packaged app after every functional fix, not only the browser development build.

### Required

- [ ] Verify every button has a visible result or a clear disabled state.
- [ ] Verify modal dialogs can be closed by their Cancel action.
- [ ] Verify clicking the modal backdrop does not accidentally submit or delete data.
- [ ] Verify Enter and Escape behavior in all inline and modal forms.
- [ ] Verify duplicate disease import merges keywords as documented.
- [ ] Verify deleting a disease removes it from flashcards, quizzes, and statistics.
- [ ] Verify changing a disease's subject or chapter updates displayed paths.

## 4. Set Product Identity and Version

### Release Blocker

- [ ] Set an intentional beta version in `package.json`, for example:

```json
"version": "0.1.0-beta.1"
```

- [ ] Confirm the final package name in `package.json`.
- [ ] Confirm the final `build.productName`.
- [ ] Confirm the permanent `build.appId`.
- [ ] Do not change the `appId` after distributing the beta unless a migration plan exists.
- [ ] Update the visible English version string in `src/i18n/en.ts`.
- [ ] Update the visible Persian version string in `src/i18n/fa.ts`.
- [ ] Update the installer artifact name if the product name changed.
- [ ] Update the browser title in `index.html`.
- [ ] Update the author and description metadata.
- [ ] Confirm copyright ownership and year.
- [ ] Add a release notes file for this beta.

### Required

- [ ] Search the repository for the old product name and remove unintended stale references.
- [ ] Confirm the visible footer version matches `package.json`.
- [ ] Confirm the installer filename contains the expected version.
- [ ] Confirm the application title is correct in English and Persian.

## 5. Complete Branding and Installer Configuration

### Release Blocker

- [ ] Create a proper Windows multi-resolution `.ico` file.
- [ ] Add the icon at the chosen project path, such as `build/icon.ico`.
- [ ] Configure `build.win.icon` in `package.json`.
- [ ] Verify the installer icon.
- [ ] Verify the installed executable icon.
- [ ] Verify the Desktop shortcut icon.
- [ ] Verify the Start Menu shortcut icon.
- [ ] Verify the Electron window icon if an explicit window icon is required.
- [ ] Replace the browser favicon if the default asset is not final.
- [ ] Replace the navigation logo if the current emoji logo is not final.
- [ ] Verify branding in both themes.
- [ ] Verify branding in both English and Persian layouts.

### Required

- [ ] Decide whether the installer should be one-click or wizard-based.
- [ ] Decide whether users can choose the installation directory.
- [ ] Decide whether uninstall should preserve application data.
- [ ] Document the installer output directory.
- [ ] Keep signing certificates and private keys outside the repository.

## 6. Correct Public Documentation

### Release Blocker

- [ ] Correct `README.md`: the current implementation uses `medstudy-data.json`, not SQLite.
- [ ] Correct the documented desktop data path.
- [ ] Document that the application is local-first and does not use accounts or cloud sync.
- [ ] Document JSON backup and restore.
- [ ] Document XLSX disease import/export separately from full backup.
- [ ] Add supported operating system information.
- [ ] Add the beta version.
- [ ] Add installation instructions.
- [ ] Add a support email or issue URL.
- [ ] Add a known-limitations section.
- [ ] Link to:
  - [ ] `docs/APPLICATION_FEATURES.md`.
  - [ ] `docs/PACKAGE_CUSTOMIZATION.md`.
  - [ ] The beta release notes.
- [ ] Ensure documentation does not claim features that are only roadmap items.

### Recommended

- [ ] Add a short troubleshooting section for white-screen, missing-data, and backup problems.
- [ ] Add screenshots or a short usage guide.
- [ ] Add a license file and license section if required for distribution.

## 7. Prepare and Review Medical Content

### Release Blocker

- [ ] Decide whether the beta ships empty or with a reviewed starter dataset.
- [ ] If starter content is included, record its source and license.
- [ ] Have a qualified medical reviewer check every distributed disease record.
- [ ] Check disease names for spelling and terminology consistency.
- [ ] Check keywords for clinical accuracy.
- [ ] Remove unsupported or ambiguous medical claims.
- [ ] Mark content that is user-created and not professionally reviewed.
- [ ] Record source textbook, guideline, or reference where appropriate.
- [ ] Record content review date.
- [ ] Record the reviewer or review status if the content model supports it.
- [ ] Do not describe user-created content as official residency-exam material.
- [ ] Add a visible educational-use disclaimer:

> MedStudy is an educational exam-preparation tool. It is not a substitute for current clinical guidelines, institutional protocols, supervision, or professional medical judgment. Do not enter identifiable patient information.

### Required

- [ ] Confirm no patient-identifiable information is included in seed data, screenshots, examples, backups, or release artifacts.
- [ ] Confirm content is not copied from restricted exam banks without permission.
- [ ] Confirm any third-party images, references, or datasets have appropriate usage rights.
- [ ] Explain that medical information can change and users must verify current guidance.

## 8. Add Minimum Quality Controls

### Release Blocker

- [ ] Run the TypeScript/Vite build successfully.
- [ ] Run the linter successfully.
- [ ] Fix all new lint errors.
- [ ] Confirm no debug-only DevTools behavior is enabled in the production path.
- [ ] Confirm no secrets, API keys, private certificates, or personal data are present.
- [ ] Confirm Electron security settings remain:
  - [ ] `contextIsolation: true`.
  - [ ] `nodeIntegration: false`.
  - [ ] Limited preload API only.
- [ ] Confirm the renderer has no unnecessary filesystem or process access.

### Required automated coverage

Add focused tests for:

- [ ] Subject and chapter CRUD.
- [ ] Subject and chapter reordering.
- [ ] Disease CRUD.
- [ ] Disease import merge behavior.
- [ ] Disease export shape.
- [ ] Difficulty classification.
- [ ] Multiple Choice generation.
- [ ] True/False generation.
- [ ] Fill-in-the-Blank generation.
- [ ] Match Keywords generation.
- [ ] Multiple Select generation.
- [ ] Review-score calculations.
- [ ] Fractional Multiple Select scoring.
- [ ] Backup parsing and restoration.
- [ ] Preference migration.

The repository currently has no detected automated test files, so this is a material beta-quality gap.

## 9. Run Manual Feature Tests

Complete these tests against the browser build and the packaged Electron build.

### Startup and navigation

- [ ] Start the web development server.
- [ ] Open Home.
- [ ] Open Subjects.
- [ ] Open Diseases.
- [ ] Open Flashcards.
- [ ] Open Practice.
- [ ] Open Statistics.
- [ ] Refresh every route.
- [ ] Close and reopen the Electron app on each route.
- [ ] Confirm no white screen appears.
- [ ] Confirm no route renders only the header without page content.

### Subjects and chapters

- [ ] Add a subject.
- [ ] Edit a subject.
- [ ] Delete a subject after confirmation.
- [ ] Reorder subjects with pointer input.
- [ ] Reorder subjects with keyboard input.
- [ ] Expand and collapse subjects.
- [ ] Add a chapter.
- [ ] Edit a chapter with Enter.
- [ ] Cancel chapter editing with Escape.
- [ ] Delete a chapter after confirmation.
- [ ] Reorder chapters with pointer input.
- [ ] Reorder chapters with keyboard input.
- [ ] Open a chapter into filtered Flashcards.

### Disease library

- [ ] Add a disease with multiple keywords.
- [ ] Attempt to save without a name.
- [ ] Attempt to save without a subject.
- [ ] Attempt to save without a chapter.
- [ ] Edit the disease.
- [ ] Move the disease to another subject/chapter.
- [ ] Delete the disease after confirmation.
- [ ] Search by disease name.
- [ ] Search by subject name.
- [ ] Search by chapter name.
- [ ] Search by keyword.
- [ ] Filter by subject.
- [ ] Filter by chapter.
- [ ] Clear filters.
- [ ] Shuffle the displayed list.

### Spreadsheet workflow

- [ ] Import a valid XLSX file.
- [ ] Import an XLS file.
- [ ] Import a CSV file.
- [ ] Import rows with missing subject and chapter records.
- [ ] Import the same disease again.
- [ ] Verify duplicate disease keyword merging.
- [ ] Import an empty file.
- [ ] Import malformed content.
- [ ] Export the disease library.
- [ ] Open the exported workbook and inspect headers.
- [ ] Re-import the exported workbook.
- [ ] Confirm the import result message is understandable.

### Flashcards

- [ ] Flip a card by clicking.
- [ ] Use the Front/Back button.
- [ ] Go to the previous card.
- [ ] Go to the next card.
- [ ] Test Right Arrow.
- [ ] Test Left Arrow.
- [ ] Test Space.
- [ ] Test Enter.
- [ ] Confirm navigation loops correctly.
- [ ] Shuffle cards.
- [ ] Filter by subject and chapter.
- [ ] Search flashcards.
- [ ] Clear flashcard filters.
- [ ] Show and hide the subject/chapter path.
- [ ] Zoom out to the minimum.
- [ ] Zoom in to the maximum.
- [ ] Rate a card Easy.
- [ ] Rate a card Medium.
- [ ] Rate a card Hard.
- [ ] Mark a keyword as hard.
- [ ] Unmark a keyword as hard.
- [ ] Restart Electron and verify review state.

### Practice and quiz modes

- [ ] Select all subjects.
- [ ] Select one subject.
- [ ] Select one chapter.
- [ ] Add multiple non-duplicate subsets.
- [ ] Remove a subset.
- [ ] Clear all subsets.
- [ ] Change question count.
- [ ] Select Mixed difficulty.
- [ ] Select Easy focus.
- [ ] Select Medium focus.
- [ ] Select Hard focus.
- [ ] Complete Multiple Choice.
- [ ] Complete True or False.
- [ ] Complete Fill in the Blank.
- [ ] Complete Match Keywords.
- [ ] Complete Multiple Select.
- [ ] Submit a wrong answer and verify feedback.
- [ ] Submit a correct answer and verify feedback.
- [ ] Complete a quiz and verify the result percentage.
- [ ] Verify the completed-quiz statistic increments once.
- [ ] Try to practice with diseases that have no keywords.

### Statistics

- [ ] Verify total subjects.
- [ ] Verify total chapters.
- [ ] Verify total diseases.
- [ ] Verify total keywords.
- [ ] Verify cards reviewed.
- [ ] Verify quizzes completed.
- [ ] Verify average score.
- [ ] Verify score distribution.
- [ ] Verify top scorers.
- [ ] Verify low scorers.
- [ ] Open the By Subject tab.
- [ ] Open the By Chapter tab.
- [ ] Open the By Disease tab.
- [ ] Sort every table by each available sortable column.
- [ ] Inspect tooltips.
- [ ] Verify empty-state behavior with a clean profile.

### Settings, localization, and layout

- [ ] Switch to English.
- [ ] Switch to Persian.
- [ ] Check every route in Persian.
- [ ] Confirm document direction changes to RTL.
- [ ] Check forms, modals, tables, cards, and settings in RTL.
- [ ] Switch to Light mode.
- [ ] Switch to Dark mode.
- [ ] Test Blue accent.
- [ ] Test Green accent.
- [ ] Test Purple accent.
- [ ] Test Red accent.
- [ ] Test Orange accent.
- [ ] Test Teal accent.
- [ ] Test the Settings outside-click behavior.
- [ ] Test Back to Top on a long page.
- [ ] Test the minimum supported desktop window size.
- [ ] Test a narrow window and confirm text does not overlap or disappear.

## 10. Test Persistence, Upgrade, and Recovery

### Release Blocker

- [ ] Create a representative study library.
- [ ] Close the packaged app normally.
- [ ] Reopen it and verify all data.
- [ ] Terminate the app unexpectedly and reopen it.
- [ ] Verify the JSON file remains valid after writes.
- [ ] Verify temporary files are not left as the only copy.
- [ ] Export a backup before an upgrade.
- [ ] Install the next beta over the existing beta.
- [ ] Verify data survives the upgrade.
- [ ] Verify the app ID and user-data path remain stable.
- [ ] Test uninstall behavior and document whether user data is preserved.
- [ ] Reinstall and restore from a JSON backup.
- [ ] Test on a clean Windows user account or virtual machine.

### Required

- [ ] Test with a large disease library.
- [ ] Test with long disease names and long keyword strings.
- [ ] Test with Persian names and keywords.
- [ ] Test with empty subjects and chapters.
- [ ] Test with malformed existing JSON storage.
- [ ] Confirm malformed storage falls back safely without silently destroying a valid backup.

## 11. Check Performance and Accessibility

### Required

- [ ] Start the app with the intended beta dataset.
- [ ] Check initial load time.
- [ ] Check navigation responsiveness.
- [ ] Check disease search with a large dataset.
- [ ] Check flashcard navigation with a large dataset.
- [ ] Check Statistics with a large dataset.
- [ ] Confirm the UI does not freeze during spreadsheet import/export.
- [ ] Navigate controls using the keyboard.
- [ ] Confirm focused controls are visibly indicated.
- [ ] Confirm icon-only controls have accessible labels or titles.
- [ ] Confirm buttons are not disabled without an understandable reason.
- [ ] Confirm text fits in English and Persian.
- [ ] Confirm color is not the only indication of correctness, danger, or difficulty.
- [ ] Check the application at the supported minimum window size.

### Recommended

- [ ] Run an accessibility audit with browser developer tools.
- [ ] Test with Windows display scaling at 125%, 150%, and 200%.
- [ ] Test with reduced-motion preferences if animations are retained.

## 12. Review Privacy and Security

### Release Blocker

- [ ] Confirm the application does not collect analytics without consent.
- [ ] Confirm no study data is sent to a remote service.
- [ ] Confirm no patient-identifiable information is included in the release dataset.
- [ ] Add a clear warning not to store patient information in MedStudy.
- [ ] Keep `contextIsolation: true`.
- [ ] Keep `nodeIntegration: false`.
- [ ] Review all preload-exposed methods.
- [ ] Do not expose arbitrary filesystem access to the renderer.
- [ ] Do not include API keys, signing passwords, private certificates, or tokens.
- [ ] Review generated release artifacts for sensitive files.
- [ ] Decide whether a local application lock is required for the beta.

### Required

- [ ] Add a privacy statement appropriate for a local-only educational tool.
- [ ] Add a medical educational-use disclaimer.
- [ ] Explain where local data and backups are stored.
- [ ] Explain that backups may contain private study notes and must be protected.

## 13. Build the Beta Candidate

### Before building

- [ ] Confirm the working tree contains only intentional release changes.
- [ ] Confirm the final version and package metadata.
- [ ] Confirm the final icons are present.
- [ ] Confirm the README and release notes are updated.
- [ ] Confirm the medical disclaimer and support contact are available.
- [ ] Confirm the beta dataset and its license/source are ready.

### Run project checks

From the project root:

```bash
npm ci
npm run lint
npm run build
```

- [ ] `npm ci` succeeds.
- [ ] `npm run lint` succeeds.
- [ ] `npm run build` succeeds.
- [ ] Review and resolve build warnings that affect the release.
- [ ] Confirm `dist/index.html` uses relative asset paths such as `./assets/...`.

### Run the desktop candidate

```bash
npm run desktop:dev
```

- [ ] The Electron development candidate opens.
- [ ] The Home content renders, not only the header.
- [ ] DevTools behavior is limited to development mode.
- [ ] The storage path is correct.
- [ ] Data survives restart.

### Build the installer

```bash
npm run desktop:dist
```

- [ ] Electron Builder completes successfully.
- [ ] The installer is found in the configured output directory.
- [ ] The filename contains the expected product name and version.
- [ ] The installer is copied to a protected release folder.
- [ ] A SHA-256 checksum is generated for the installer.
- [ ] The checksum is recorded in the release notes.
- [ ] The installer is scanned before distribution.

## 14. Install and Test the Installer

### Release Blocker

- [ ] Install on a clean Windows machine or virtual machine.
- [ ] Verify installer product name.
- [ ] Verify installer icon.
- [ ] Verify install directory behavior.
- [ ] Verify Start Menu shortcut.
- [ ] Verify Desktop shortcut if enabled.
- [ ] Launch from the installed shortcut.
- [ ] Test all six routes.
- [ ] Create and restore study data.
- [ ] Close and reopen the installed application.
- [ ] Verify no internet connection is required for core workflows.
- [ ] Test upgrade from the previous beta.
- [ ] Test uninstall.
- [ ] Verify documented data-preservation behavior after uninstall.
- [ ] Reinstall and restore a backup.

### Required

- [ ] Test with Windows Defender or SmartScreen behavior documented.
- [ ] If unsigned, clearly warn beta users that Windows may show a publisher warning.
- [ ] If signed, verify the displayed publisher identity.

## 15. Prepare Beta Distribution Materials

### Release Blocker

- [ ] Create release notes containing:
  - [ ] Version number.
  - [ ] Release date.
  - [ ] Supported operating systems.
  - [ ] New features.
  - [ ] Known limitations.
  - [ ] Known data risks.
  - [ ] Installation instructions.
  - [ ] Backup instructions.
  - [ ] Uninstall/data-preservation behavior.
  - [ ] Support contact.
  - [ ] Medical educational-use disclaimer.
  - [ ] Checksum.
- [ ] Include links to the feature reference and customization guide.
- [ ] Provide a short “first five minutes” guide:
  1. Create a subject.
  2. Add a chapter.
  3. Add a disease and keywords.
  4. Review it with Flashcards.
  5. Take a Practice quiz.
- [ ] Provide a bug-report template.
- [ ] Tell testers what information to include:
  - [ ] App version.
  - [ ] Windows version.
  - [ ] Route or workflow where the issue occurred.
  - [ ] Steps to reproduce.
  - [ ] Screenshot or screen recording when safe.
  - [ ] Whether the issue survives restart.
  - [ ] Relevant log or error text without private data.
- [ ] Tell testers not to include patient information in bug reports or backups.

### Recommended

- [ ] Create a dedicated beta feedback form.
- [ ] Create a known-issues page.
- [ ] Create a rollback plan if a beta corrupts or hides local data.
- [ ] Keep the previous installer available.

## 16. Final Go/No-Go Review

The release owner should sign off each item below.

### Go criteria

- [ ] No known data-loss blocker remains.
- [ ] Startup hydration is reliable.
- [ ] Backup and restore are verified in the packaged app.
- [ ] The final version and app ID are correct.
- [ ] The installer is tested on a clean Windows environment.
- [ ] Medical content and source/licensing status are reviewed.
- [ ] The medical educational-use disclaimer is visible.
- [ ] README and release notes describe the actual JSON storage implementation.
- [ ] Support and bug-report channels work.
- [ ] The beta artifact checksum is recorded.
- [ ] The release owner approves distribution.

### No-go criteria

Do not distribute if any of the following is true:

- [ ] Existing user data can be overwritten during startup hydration.
- [ ] Backup restore has not been tested after a packaged-app restart.
- [ ] The installer identity or version is still temporary or inconsistent.
- [ ] The release includes unreviewed medical content presented as authoritative.
- [ ] Patient-identifiable data is present in the installer, seed data, screenshots, or backups.
- [ ] The application can open as a white screen without a recovery path.
- [ ] The release owner cannot explain where user data is stored.

## 17. Post-Release Beta Operations

Complete after distribution begins.

- [ ] Record the exact installer checksum and distribution URL.
- [ ] Track the number of downloads and active testers if collected lawfully and transparently.
- [ ] Review incoming bug reports daily during the first release period.
- [ ] Prioritize data-loss, startup, import/export, and security bugs above cosmetic issues.
- [ ] Maintain a list of confirmed and unresolved issues.
- [ ] Ask testers to export a backup before installing a replacement beta.
- [ ] Never request patient-identifiable data for debugging.
- [ ] Publish a hotfix only after repeating the persistence and backup tests.
- [ ] Decide the criteria for `0.1.0-beta.2`.
- [ ] Archive the installer, checksum, release notes, and test results for each beta build.

## Related Documentation

- [`APPLICATION_FEATURES.md`](./APPLICATION_FEATURES.md): implemented feature reference and technical behavior.
- [`PACKAGE_CUSTOMIZATION.md`](./PACKAGE_CUSTOMIZATION.md): package identity, icons, versions, installer metadata, contact information, and branding.
- [`README.md`](../README.md): project setup and build instructions.
