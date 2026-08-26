# MedStudy Application Feature Reference

This document describes the features currently implemented in MedStudy, an offline medical exam review application for organizing study material, reviewing disease concepts, practicing quiz questions, and monitoring study performance.

It is written for two audiences:

- **Medical users:** what each screen does and how to use it for exam review.
- **Maintainers and developers:** how the features are organized, what data they use, and which limitations are present in the current implementation.

The application is built with React and Vite and can be run in a browser or packaged as a Windows Electron desktop application. It does not require an account or cloud service.

## Feature Summary

MedStudy currently provides:

- Six routed areas: Home, Subjects, Diseases, Flashcards, Practice, and Statistics.
- A local subject and chapter hierarchy.
- A disease library with keywords and subject/chapter relationships.
- XLSX, XLS, and CSV disease import.
- XLSX disease export.
- Interactive flashcards with flip, navigation, shuffle, zoom, filtering, search, and review scores.
- Hard-keyword marking during flashcard review.
- Five quiz modes.
- Difficulty-aware quiz selection based on review scores.
- Quiz result screens and completion counting.
- General, subject, chapter, and disease statistics.
- English and Persian translations.
- Right-to-left layout support for Persian.
- Light and dark themes.
- Six accent colors.
- JSON backup and restore from Settings.
- Destructive deletion of all local MedStudy data.
- Electron desktop persistence through a secure preload bridge.

The current application does **not** yet include cloud synchronization, user accounts, timed mock examinations, clinical-vignette authoring, clinical explanations/references, image-based questions, or a full spaced-repetition scheduling algorithm.

## Application Navigation

The main navigation is available in the sticky header on every route:

| Area | Purpose |
|---|---|
| Home | Dashboard, quick actions, summary counts, and a random review card |
| Subjects | Create and organize subjects and chapters |
| Diseases | Create, search, filter, import, export, and manage disease records |
| Flashcards | Review disease cards, rate recall, and mark difficult keywords |
| Practice | Configure and take quizzes in five formats |
| Statistics | Review library size, study scores, coverage, and rankings |

The packaged desktop application uses `HashRouter`. Routes appear after the hash in the URL, for example `#/flashcards`. Hash routing is intentional because Electron opens the built renderer from a local `file://` URL.

### Header controls

The header includes:

- The MedStudy logo and application title.
- Navigation links with an active state for the current route.
- A language toggle that switches between English and Persian.
- A Settings button.

The Settings dropdown provides:

- Light theme selection.
- Dark theme selection.
- Accent color selection.
- English selection.
- Persian selection.
- Full JSON data export.
- Full JSON data import.
- Delete-all-data action.

The header closes the Settings dropdown when the user clicks outside it.

### Back to top

After the page is scrolled down, a floating Back to Top button appears. Clicking it smoothly scrolls the page to the top.

## Home Dashboard

The Home page is the starting point for the application and provides an overview of the study library.

### Welcome section

The welcome area includes:

- The application title.
- A short description of the review workflow.
- A button to open Practice.
- A button to open Flashcards.

### Overview counters

The dashboard calculates and displays:

- Total subjects.
- Total chapters.
- Total diseases.
- Total keywords.
- Total flashcard reviews recorded in the card-score data.

The counters act as shortcuts. Selecting a counter navigates to the related area.

### Random card

The Random Card section selects a disease from the current disease library and displays it as a compact flashcard.

The card supports:

- Front-side disease name.
- Keyword count.
- Subject and chapter path.
- Click-to-reveal behavior.
- Back-side keyword chips.
- A Front/Back toggle button.
- A Shuffle button to select another disease.

If no diseases exist, the section displays an empty-state message asking the user to add a disease first.

### Quick Start shortcuts

The Home page provides shortcut cards for:

- Subjects.
- Diseases.
- Flashcards.
- Practice.
- Statistics.

Each shortcut includes a short description and navigates directly to its route.

### Study goal section

The Study Goal section encourages regular review. It is currently informational and does not yet contain an editable goal, schedule, streak, or reminder system.

### Footer

The footer displays:

- MedStudy branding.
- A description of the application.
- A feature list.
- Visible version text.
- A copyright notice.
- A short “made with” message.

The footer version and copyright values are translation strings. They are not automatically read from `package.json`.

## Subjects and Chapters

The Subjects page manages the hierarchy used to organize disease records.

### Subjects

Users can:

- Add a subject.
- Edit a subject name.
- Delete a subject.
- Expand or collapse its chapters.
- Drag subjects to change their order.
- Use keyboard sorting controls through the drag-and-drop library.

A subject contains an ID, name, order value, and an array of chapters.

When there are no subjects, the page displays an empty state and an Add Subject action.

### Chapters

Inside an expanded subject, users can:

- Add a chapter.
- Edit a chapter name inline.
- Delete a chapter.
- Drag chapters to reorder them.
- Use keyboard sorting controls.
- Select a chapter name to open Flashcards filtered to that subject and chapter.

Chapter editing supports:

- Enter to save.
- Escape to cancel.
- Inline text editing.

A chapter contains an ID, name, parent subject ID, and order value.

### Deletion behavior

Deleting a subject or chapter removes it from the Subjects data structure. The current implementation does not perform a separate cascade cleanup of disease records that reference the deleted subject or chapter. Those disease records may remain with unresolved paths and display `?` where the subject or chapter cannot be found.

For beta releases, users should export a JSON backup before large structural changes or deletions.

## Disease Library

The Diseases page is the central content-management area. Each disease record contains:

- A unique ID.
- A disease name.
- A subject ID.
- A chapter ID.
- A list of keywords.

### Adding a disease

To add a disease, the user provides:

1. Disease name.
2. Subject.
3. Chapter.
4. One or more optional keywords.

The chapter selector is dependent on the selected subject. The Save button remains disabled until a name, subject, and chapter are selected.

### Keywords

Keywords are entered individually. The user can:

- Type a keyword and press Enter.
- Use the Add button.
- Remove a keyword from the chip list.
- Avoid duplicate keywords within the same disease form.

Keywords are used by:

- Flashcard back sides.
- Multiple Choice questions.
- True/False statements.
- Fill-in-the-Blank questions.
- Match Keywords questions.
- Multiple Select questions.
- Keyword counts in Statistics.

### Editing and deleting diseases

Each disease card provides edit and delete controls.

Editing allows the user to change:

- Disease name.
- Subject.
- Chapter.
- Keyword list.

Deleting requires confirmation. The disease is removed from the disease library and will no longer appear in filters, flashcards, quizzes, or statistics.

### Filtering and search

The disease library supports:

- Filter by subject.
- Filter by chapter after selecting a subject.
- Search by disease name.
- Search by subject name.
- Search by chapter name.
- Search by keyword.
- Clear all active filters.

Search is case-insensitive and matches the combined disease name, subject, chapter, and keyword text.

### Shuffle

The Shuffle action randomizes the displayed order of the currently filtered disease cards. It does not modify stored disease order or data.

## Spreadsheet Import and Export

The disease page supports spreadsheet exchange through the `xlsx` package.

### Supported import files

The file picker accepts:

- `.xlsx`
- `.xls`
- `.csv`

The first worksheet is read. Rows are expected to contain:

| Column | Required | Description |
|---|---:|---|
| `name` or `Name` | Yes | Disease name |
| `subject` or `Subject` | Yes | Subject name |
| `chapter` or `Chapter` | Yes | Chapter name |
| `keyword1`, `keyword2`, ... | No | Disease keywords |

Rows without a disease name, subject name, or chapter name are excluded before import.

### Import behavior

The import process:

1. Reads the first worksheet.
2. Resolves subjects by case-insensitive name.
3. Creates missing subjects automatically.
4. Resolves chapters within the selected subject by case-insensitive name.
5. Creates missing chapters automatically.
6. Adds new diseases.
7. Merges matching diseases when subject, chapter, and disease name are the same.
8. Combines existing and imported keywords without duplicates.

The import result reports counts for:

- Added records.
- Updated records.
- Skipped records.

The input element is reset after import so the same file can be selected again.

### Export behavior

Export creates `diseases.xlsx` with a `Diseases` worksheet. It includes:

- `name`
- `subject`
- `chapter`
- `keyword1`, `keyword2`, and additional keyword columns as needed

Spreadsheet export includes disease content only. It does not include:

- Flashcard review scores.
- Hard-keyword marks.
- Quiz completion count.
- Theme settings.
- Language settings.

Use the full JSON backup for complete local application data.

## Flashcard Review

The Flashcards page turns disease records into an interactive review sequence.

### Card sides

The front of a card displays:

- Disease name.
- Existing average score badge.
- Number of keywords.
- Optional subject/chapter path.
- Click-to-reveal hint.

The back displays:

- Disease name.
- Keyword chips.
- Optional subject/chapter path.
- Easy, Medium, and Hard score buttons.

Clicking the card flips it with a 3D animation.

### Navigation

Users can:

- Move to the previous card.
- Move to the next card.
- Loop from the last card to the first.
- Loop from the first card to the last.
- Shuffle the current card set.
- See progress as `current of total`.
- Filter by subject.
- Filter by chapter.
- Search by disease, subject, chapter, or keyword.
- Clear active filters.
- Show or hide the subject/chapter path.
- Zoom between 50% and 150%.

Keyboard controls are intended to include:

- Right Arrow: next card.
- Left Arrow: previous card.
- Space: flip the card.
- Enter: flip the card.

### Review scores

After revealing the card, the user can rate recall as:

- Easy: score value 3.
- Medium: score value 2.
- Hard: score value 1.

The application stores a review count and running average for each disease. The average is displayed on future card fronts and used by the Practice page for difficulty classification.

The score thresholds are:

| Average | Classification |
|---:|---|
| 2.3 or higher | Easy |
| 1.5 through below 2.3 | Medium |
| Below 1.5 | Hard |

This is a simple score-based model. It is not a full spaced-repetition scheduler and does not currently calculate due dates, forgetting curves, or review intervals.

### Hard keywords

On the back of a flashcard, clicking a keyword toggles its hard status. Hard keywords receive a distinct visual style and are counted in Statistics.

Hard-keyword status is stored as a set of keyword strings. Because the status is keyed by the keyword text rather than a disease-keyword ID, the same keyword text used in multiple diseases shares one hard state.

## Practice and Quizzes

The Practice page creates quiz sessions from the disease library.

### Selecting the question scope

Users can build a question scope by adding one or more selections:

- All subjects and all chapters.
- One subject and all of its chapters.
- One subject and one chapter.
- Multiple subject/chapter selections combined together.

Selections appear as removable tags. Duplicate selections are ignored. Clear All removes the current selections and resets the question count.

The selection preview shows the number of diseases covered by the currently selected subject/chapter option. The total available count is the unique number of diseases across all selected subsets.

### Question count

A range slider controls the requested number of questions. The maximum is the number of available diseases in the selected scope.

Only diseases with at least one keyword can generate questions. Therefore, the number of generated questions can be lower than the number of selected diseases if records do not contain keywords.

### Difficulty focus

The user can choose:

- Mixed.
- Easy focus.
- Medium focus.
- Hard focus.

The quiz generator uses stored card averages. Unrated diseases are treated as medium. The selected difficulty receives slightly more weight when the requested question count cannot be evenly divided across the difficulty groups. If a bucket is too small, the generator fills remaining slots from other available buckets.

This is difficulty-aware sampling, not a permanent difficulty label stored on each disease.

### Quiz modes

Five quiz modes are implemented.

#### Multiple Choice

The question asks which keyword belongs to a disease. It provides:

- One correct keyword from the disease.
- Up to three distractors from other diseases.
- Generic fallback medical terms if there are not enough distractors.
- Four-option presentation when enough options are available.

After selection, the correct answer is highlighted and an incorrect selection is marked. The user then advances to the next question or results.

#### True or False

The question displays a statement that a disease has a particular keyword. The statement is generated as either:

- True, using one of the disease's keywords.
- False, using a keyword from another disease or a fallback term.

The user selects True or False and receives immediate feedback.

#### Fill in the Blank

The disease's keyword list is displayed as a comma-separated sentence. One keyword is replaced by a blank. The user chooses the missing keyword from the options.

The current implementation is a multiple-choice blank-selection experience rather than free-text typing.

#### Match Keywords

The generator creates groups of diseases and selects one keyword from each disease. The user:

1. Selects a keyword.
2. Selects the disease it belongs to.
3. Repeats until all pairs are matched.
4. Submits the group.

The default group size is up to four diseases. Matching is scored pair by pair.

#### Multiple Select

The user must select all correct keywords for one disease.

The question provides:

- A set of correct keywords.
- Distractors sampled from related diseases and other diseases in scope.
- A required selection count.

The user can select up to the required number of options. After submission, correct selected, correct missed, and incorrect selected options are visually distinguished.

Scoring is fractional:

- Full selection earns 1.0 for the question.
- Partial selection earns a fraction based on correct selected keywords.
- The disease review score maps the fraction to a 1-to-3 score range.

### Quiz progress and results

Quiz screens include:

- Back to Quiz Types action.
- Current question counter.
- Progress bar.
- Disease information where relevant.
- Immediate answer feedback.
- Next Question or See Results action.

The result screen displays:

- Completion message.
- Percentage score.
- Correct count.
- Incorrect count.
- Total count.
- Color-coded circular score ring.
- A qualitative message based on performance.

The completed-quiz count increases when a result screen is mounted.

### No-question behavior

If no valid questions can be generated, the quiz screen displays a message explaining that diseases need keywords and provides a Back to Quiz Types action.

## Statistics Dashboard

Statistics are based on the current subjects, chapters, diseases, review scores, hard-keyword set, and quiz completion count.

If there are no subjects and no diseases, the page shows an empty state instead of the full dashboard.

### General tab

The General tab displays overview cards for:

- Total subjects.
- Total chapters.
- Total diseases.
- Average keywords per disease.
- Total keywords.
- Hard keywords.
- Completed quizzes.
- Reviewed cards.
- Overall average score.

It also displays score distribution across the Easy, Medium, and Hard classifications.

The general view can show top and low scorers for:

- Subjects.
- Chapters.
- Diseases.

Only entities with at least one recorded review are ranked.

### By Subject tab

The subject table includes:

- Subject name.
- Chapter count.
- Disease count.
- Keyword count.
- Average score.
- Score progress bar.

Columns can be sorted. Name sorting defaults to ascending order; numeric columns default to descending order when selected.

Hovering or focusing on a row displays a tooltip with additional subject counts and review totals.

### By Chapter tab

The chapter table includes:

- Chapter name.
- Parent subject.
- Disease count.
- Keyword count.
- Average score.
- Score progress bar.

Rows are sortable and provide tooltips with chapter details.

### By Disease tab

The disease table includes:

- Disease name.
- Subject.
- Chapter.
- Keyword count.
- Hard-keyword count.
- Average score.
- Score progress bar.

Rows are sortable and include tooltips with the disease path, keyword information, and review count.

### Score interpretation

The application treats higher values as stronger recall:

- Green: average score at least 2.3.
- Amber: average score at least 1.5 and below 2.3.
- Red: average score below 1.5.
- A dash: no review score exists yet.

Statistics are descriptive. They do not currently predict examination readiness, calculate time-based retention, or compare performance to an external residency-exam blueprint.

## Settings, Localization, and Themes

### Language support

The application supports:

- English (`en`).
- Persian (`fa`).

Switching language updates:

- Navigation labels.
- Page titles.
- Buttons.
- Form labels.
- Empty states.
- Quiz text.
- Statistics labels and tooltips.
- Document direction.

Persian sets the document direction to right-to-left and applies the Vazirmatn/Tahoma font fallback. English uses left-to-right layout.

### Theme support

Users can select:

- Light theme.
- Dark theme.

The selected theme is applied through the `data-theme` attribute on the document root and changes the CSS variables used throughout the interface.

### Accent colors

The available accent colors are:

- Blue.
- Green.
- Purple.
- Red.
- Orange.
- Teal.

Accent selection updates the primary accent, light accent background, accent border, and hover color.

### Preference persistence

Language, theme, and accent preferences are stored locally and restored on later launches. See the Data Storage section for the current storage-key details.

## Data Storage and Backup

MedStudy has two related storage layers:

1. Renderer-side browser `localStorage`.
2. Electron-side JSON storage exposed through the preload bridge.

### Desktop storage

The Electron main process writes data to:

```text
<electron userData directory>/medstudy-data.json
```

The exact Windows location is determined by Electron's `app.getPath('userData')` value.

The Electron process exposes storage operations through `preload.cjs` with:

- `get`
- `set`
- `remove`
- `keys`
- `export`
- `import`

The renderer does not receive direct Node.js filesystem access. The BrowserWindow uses:

- `contextIsolation: true`
- `nodeIntegration: false`

### Storage keys

The current application uses these logical keys:

| Key | Contents |
|---|---|
| `medstudy-subjects` | Subject and chapter hierarchy |
| `medstudy-diseases` | Disease records and keywords |
| `medstudy-theme` | Light/dark preference |
| `medstudy-accent` | Accent color preference |
| `medstudy-lang` | English/Persian preference |
| `medstudy-card-scores` | Review count and average score per disease |
| `medstudy-hard-keywords` | Keyword strings marked as difficult |
| `medstudy-quizzes-completed` | Number of completed quiz result screens |

The Settings backup additionally writes a `medstudy-language` value into the exported JSON object for its explicit language snapshot. The active Language Provider uses `medstudy-lang`. Maintainers should standardize these names before a stable release.

### Full JSON export

Settings export collects all renderer `localStorage` keys beginning with `medstudy-`, then explicitly includes theme, accent, and language settings. It downloads a file named like:

```text
medstudy-backup-2026-08-26.json
```

The date is generated from the local ISO timestamp.

### Full JSON import

Settings import:

1. Opens a JSON file picker.
2. Parses the selected file.
3. Restores keys whose names begin with `medstudy-`.
4. Restores theme, accent, and language when present.
5. Reloads the page.

Invalid JSON produces an error alert. Import is a replacement operation for matching keys and does not show a pre-import diff or merge preview.

### Delete all data

Delete All Data requires confirmation and removes all renderer `localStorage` keys beginning with `medstudy-`, then reloads the application.

Users should export a backup before using this action. In the current desktop implementation, direct renderer writes and Electron-side persisted values are not handled by one universal transaction, so destructive-data behavior should be verified carefully in packaged beta builds.

## Technical Architecture

### Entry point and provider hierarchy

The application starts in `src/main.tsx`.

The provider hierarchy is:

```text
StrictMode
└── ThemeProvider
    └── LanguageProvider
        └── SubjectsProvider
            └── DiseasesProvider
                └── App
```

`App` provides the router, shared Header, routed page content, and Back to Top control.

### Main data model

```ts
interface Subject {
  id: string;
  name: string;
  order: number;
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  name: string;
  subjectId: string;
  order: number;
}

interface Disease {
  id: string;
  name: string;
  subjectId: string;
  chapterId: string;
  keywords: string[];
}
```

Subject, chapter, and disease IDs are generated with UUID v4.

### Context ownership

| Context | Responsibility |
|---|---|
| `ThemeContext` | Theme and accent state, CSS variables, preference persistence |
| `LanguageContext` | Active language, translations, document language, text direction |
| `SubjectsContext` | Subject/chapter CRUD and ordering |
| `DiseasesContext` | Disease CRUD, spreadsheet import, spreadsheet export |

### Reusable quiz components

Quiz screens are split into reusable components:

- `MultipleChoice.tsx`
- `TrueFalse.tsx`
- `FillBlank.tsx`
- `MatchKeywords.tsx`
- `MultiSelect.tsx`
- `QuizResult.tsx`
- `quizUtils.ts`

`quizUtils.ts` contains:

- Difficulty classification.
- Shuffle and random-pick helpers.
- Question ID generation.
- Disease path construction.
- Question generators.
- Review-score updates.
- Quiz completion incrementing.

### External packages used by features

| Package | Current use |
|---|---|
| `@dnd-kit/core` | Drag-and-drop context and sensors |
| `@dnd-kit/sortable` | Sortable subjects and chapters |
| `@dnd-kit/utilities` | Transform styling for dragged items |
| `xlsx` | Spreadsheet import and export |
| `uuid` | Subject, chapter, and disease IDs |
| `react-router-dom` | Hash-based routing and navigation |
| Electron | Windows desktop shell and storage bridge |
| Electron Builder | Windows NSIS installer packaging |

### Electron storage bridge

`electron/main.cjs`:

- Creates the BrowserWindow.
- Loads the Vite development URL when configured.
- Loads `dist/index.html` in packaged/local production mode.
- Loads and saves `medstudy-data.json`.
- Registers IPC handlers for storage operations.
- Uses a temporary file before renaming during writes.

`electron/preload.cjs` exposes the limited `medStudyDesktop` API to the renderer through `contextBridge`.

### Electron-compatible build settings

`vite.config.ts` uses:

```ts
base: './'
```

This ensures production asset paths resolve when `dist/index.html` is opened using `file://`.

## Known Limitations and Beta Notes

The following points describe current behavior that should be communicated to beta testers and addressed before a stable release.

### Local-only application

There is no account system, cloud synchronization, collaboration, or remote content service. Data is local to the browser profile or Electron user-data directory.

### Simple score model, not spaced repetition

Card ratings produce running averages, but the app does not currently schedule cards by due date or calculate a forgetting curve. The Practice difficulty selector uses the averages for sampling only.

### Review metrics are partly direct localStorage writes

Subjects and diseases use the shared storage helper, which writes to localStorage and attempts to mirror values through the Electron bridge. Flashcard scores, hard keywords, and quiz completion counts are written directly by page or quiz utility code to localStorage.

This means packaged desktop persistence of every metric should be tested before beta distribution. A future storage abstraction should route all reads and writes through the same persistence mechanism.

### Preference-key inconsistency

The Settings export explicitly uses `medstudy-language`, while the Language Provider uses `medstudy-lang`. Theme and accent behavior should also be checked carefully against existing stored data and backup files before a stable release.

### No React error boundary

A render-time exception can leave the renderer without useful recovery controls. A beta hardening pass should add an application-level error boundary with reload and support guidance.

### No clinical-vignette system

Current questions are generated from disease names and keyword associations. The app does not yet support full clinical cases, laboratory tables, imaging, treatment explanations, or source references.

### No authoritative content guarantee

Disease names and keywords are user-created. They are not automatically verified against guidelines, textbooks, or official residency-exam sources.

### External fonts

`index.html` references Inter and Vazirmatn from Google Fonts. The application has fallback fonts, but a completely offline installation should bundle fonts locally or rely entirely on system fonts.

### Structural deletion cleanup

Deleting subjects or chapters does not explicitly remove or repair disease records that reference them. Review backup and data-integrity behavior before relying on deletion for major reorganization.

### No question timing

Practice sessions do not currently measure response time, enforce a countdown, or simulate a complete timed examination.

## Beta Verification Checklist

Use this checklist before distributing a beta installer.

### General startup

- [ ] `npm ci` completes successfully.
- [ ] `npm run lint` completes without new errors.
- [ ] `npm run build` completes successfully.
- [ ] The browser development build opens.
- [ ] The Electron development build opens.
- [ ] The packaged renderer does not show a white screen.
- [ ] All six routes render correctly.
- [ ] Hash navigation survives closing and reopening the desktop app.

### Subjects and diseases

- [ ] Add, edit, delete, and reorder subjects.
- [ ] Add, edit, delete, and reorder chapters.
- [ ] Open a chapter directly into filtered Flashcards.
- [ ] Add, edit, and delete diseases.
- [ ] Add and remove keywords.
- [ ] Search across disease, subject, chapter, and keyword text.
- [ ] Filter by subject and chapter.
- [ ] Shuffle filtered disease cards.
- [ ] Verify behavior after deleting a subject or chapter.

### Spreadsheet workflow

- [ ] Import a valid XLSX file.
- [ ] Import XLS and CSV files.
- [ ] Import a file with missing subjects and chapters.
- [ ] Import the same disease twice and verify keyword merging.
- [ ] Import an empty file.
- [ ] Import malformed content and verify the app remains usable.
- [ ] Export a disease library.
- [ ] Re-import an exported spreadsheet.
- [ ] Confirm spreadsheet export does not claim to contain review history.

### Flashcards

- [ ] Flip cards by clicking.
- [ ] Navigate previous and next.
- [ ] Test ArrowLeft and ArrowRight.
- [ ] Test Space and Enter.
- [ ] Shuffle cards.
- [ ] Filter and search cards.
- [ ] Toggle the subject/chapter path.
- [ ] Zoom from minimum to maximum.
- [ ] Record Easy, Medium, and Hard scores.
- [ ] Mark and unmark hard keywords.
- [ ] Close and reopen the packaged desktop app and verify scores and hard keywords.

### Practice

- [ ] Select all subjects.
- [ ] Select one subject.
- [ ] Select one chapter.
- [ ] Combine multiple subsets.
- [ ] Remove a subset.
- [ ] Use Clear All.
- [ ] Change question count.
- [ ] Test all four difficulty choices.
- [ ] Complete Multiple Choice.
- [ ] Complete True or False.
- [ ] Complete Fill in the Blank.
- [ ] Complete Match Keywords.
- [ ] Complete Multiple Select.
- [ ] Verify empty-question behavior for diseases without keywords.
- [ ] Verify completed quiz count updates.

### Statistics

- [ ] Verify overview counts.
- [ ] Verify score distribution after flashcard reviews.
- [ ] Verify top and low rankings.
- [ ] Sort subject rows.
- [ ] Sort chapter rows.
- [ ] Sort disease rows.
- [ ] Inspect tooltips with mouse and keyboard focus.
- [ ] Verify hard-keyword counts.
- [ ] Verify empty-state behavior.

### Settings and data

- [ ] Switch between English and Persian.
- [ ] Verify Persian RTL layout.
- [ ] Switch light and dark themes.
- [ ] Test all six accent colors.
- [ ] Export a full JSON backup.
- [ ] Import a full JSON backup.
- [ ] Import invalid JSON.
- [ ] Delete all data after taking a backup.
- [ ] Restart the desktop app after each important data operation.
- [ ] Verify the backup contains the intended settings and study data.

### Packaging and release

- [ ] Set an intentional beta version such as `0.1.0-beta.1`.
- [ ] Confirm the application ID is the permanent intended ID.
- [ ] Replace the default icon and configure the Windows `.ico` file.
- [ ] Confirm installer and shortcut branding.
- [ ] Update English and Persian visible version text.
- [ ] Correct README storage documentation.
- [ ] Add a support contact and medical educational-use disclaimer.
- [ ] Test fresh installation on a clean Windows account or virtual machine.
- [ ] Test upgrade from the previous build.
- [ ] Test uninstall and reinstall behavior.
- [ ] Keep a backup of the released installer and release notes.
- [ ] Do not include private signing credentials, API keys, or patient-identifiable data.

## Recommended Future Features

The current feature set is useful for structured review, but the following additions would make it substantially more suitable for residency-exam preparation:

1. FSRS or SM-2 spaced-repetition scheduling with due dates.
2. Timed mock examinations with pause, skip, mark-for-review, and section navigation.
3. Clinical-vignette questions with laboratory, imaging, and treatment data.
4. Explanations for correct and incorrect answers.
5. Source, guideline version, author, and clinical-review metadata.
6. An automatic error notebook for missed and low-confidence questions.
7. Confidence tracking before each answer.
8. A study planner based on exam date, topic weights, and available time.
9. Image-based questions for ECG, radiology, pathology, and dermatology.
10. Anki-compatible import and export.
11. Encrypted backups and optional synchronization.
12. Specialty-specific exam blueprints and readiness analytics.

These are not part of the current implementation and should be presented as roadmap items rather than existing capabilities.

## Source Map

| Feature | Primary files |
|---|---|
| Application shell and routes | `src/App.tsx`, `src/main.tsx` |
| Header, navigation, settings, backup controls | `src/components/Header.tsx` |
| Back to top | `src/components/BackToTop.tsx` |
| Home dashboard | `src/pages/Home.tsx` |
| Subjects and chapters | `src/pages/Subjects.tsx`, `src/contexts/SubjectsContext.tsx` |
| Disease library | `src/pages/Diseases.tsx`, `src/contexts/DiseasesContext.tsx` |
| Flashcards | `src/pages/Flashcards.tsx` |
| Practice configuration | `src/pages/Practice.tsx` |
| Quiz generation and score helpers | `src/components/quizzes/quizUtils.ts` |
| Multiple Choice quiz | `src/components/quizzes/MultipleChoice.tsx` |
| True or False quiz | `src/components/quizzes/TrueFalse.tsx` |
| Fill in the Blank quiz | `src/components/quizzes/FillBlank.tsx` |
| Match Keywords quiz | `src/components/quizzes/MatchKeywords.tsx` |
| Multiple Select quiz | `src/components/quizzes/MultiSelect.tsx` |
| Quiz result screen | `src/components/quizzes/QuizResult.tsx` |
| Statistics dashboard | `src/pages/Statistics.tsx` |
| Theme and accent state | `src/contexts/ThemeContext.tsx` |
| Language and RTL state | `src/contexts/LanguageContext.tsx` |
| Storage helper and desktop hydration | `src/lib/storage.ts` |
| Shared TypeScript data types | `src/types.ts` |
| English translations | `src/i18n/en.ts` |
| Persian translations | `src/i18n/fa.ts` |
| Global layout and feature styling | `src/index.css` |
| Electron main process and JSON persistence | `electron/main.cjs` |
| Electron renderer bridge | `electron/preload.cjs` |
| Electron-compatible asset base | `vite.config.ts` |
| Package and Windows installer metadata | `package.json` |

## Related Documentation

- [`PACKAGE_CUSTOMIZATION.md`](./PACKAGE_CUSTOMIZATION.md): package identity, branding, icons, versioning, contact information, installer settings, and release customization.
- [`README.md`](../README.md): project setup and build instructions.
