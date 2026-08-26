# MedStudy Package Customization Guide

This guide explains where to change the application name, icon, version, description, author, contact information, legal text, colors, installer settings, and other release details.

The project is a React/Vite application packaged as a Windows Electron application with `electron-builder`.

---

## 1. Customization map

Use this table to find the correct file quickly.

| What you want to change | File or folder | What to edit |
|---|---|---|
| Package name used by npm | `package.json` | `name` |
| Application version | `package.json` | `version` |
| Application description | `package.json` | `description` |
| Package author | `package.json` | `author` |
| Installer/application ID | `package.json` | `build.appId` |
| Name shown by the installer | `package.json` | `build.productName` |
| Installer output filename | `package.json` | `build.win.artifactName` |
| Windows installer type | `package.json` | `build.win.target` |
| Windows application icon | `build/icon.ico` and `package.json` | `build.win.icon` |
| Browser tab/favicon | `public/favicon.svg`, `index.html` | favicon link and SVG file |
| Window title and HTML metadata | `index.html` | `<title>` and meta tags |
| Logo shown in the navigation bar | `src/components/Header.tsx` | `.app-logo` content |
| Visible application name | `src/i18n/en.ts`, `src/i18n/fa.ts` | `appTitle` and related strings |
| Visible version text | `src/i18n/en.ts`, `src/i18n/fa.ts` | `version` |
| Copyright text | `src/i18n/en.ts`, `src/i18n/fa.ts` | `copyright` |
| About/contact text | `src/i18n/en.ts`, `src/i18n/fa.ts`, UI components | add or update translation keys |
| Main accent colors | `src/contexts/ThemeContext.tsx`, `src/index.css` | accent map and CSS variables |
| Electron window size | `electron/main.cjs` | `BrowserWindow` options |
| Local application data location | `electron/main.cjs` | `app.getPath('userData')` and filename |
| Development/build asset paths | `vite.config.ts` | `base: './'` |
| Build commands | `package.json` | `scripts` |
| Project overview and instructions | `README.md` | documentation text |

---

## 2. Change the application identity

The main package metadata is in `package.json`.

Current relevant values are equivalent to:

```json
{
  "name": "medstudy",
  "version": "0.0.0",
  "description": "Offline medical exam review application",
  "author": "MedStudy",
  "main": "electron/main.cjs",
  "build": {
    "appId": "com.medstudy.app",
    "productName": "MedStudy"
  }
}
```

### 2.1 `name`

```json
"name": "medstudy"
```

This is the npm/package identifier. It should:

- use lowercase letters, numbers, and hyphens;
- not contain spaces;
- remain stable after publishing or distributing the application;
- normally be different from the friendly product name shown to users.

Example:

```json
"name": "clinical-reviewer"
```

Changing this value does not automatically change the visible application name in the UI or installer. Those are controlled separately.

### 2.2 `productName`

```json
"build": {
  "productName": "MedStudy"
}
```

This is the friendly name used by Electron Builder and Windows installer-related UI.

Example:

```json
"productName": "Clinical Review"
```

Use the same spelling and capitalization everywhere else to avoid a mixed-brand experience.

### 2.3 `appId`

```json
"appId": "com.medstudy.app"
```

The application ID uniquely identifies the desktop application. Use a reverse-domain format:

```text
com.yourcompany.yourproduct
```

Example:

```json
"appId": "com.example.clinicalreview"
```

Choose this carefully. Once users have installed the application, changing the ID can make Windows treat the new package as a different application. It can affect upgrade behavior, shortcuts, protocol registrations, notifications, and application data identity.

Do not use a temporary or personal-looking ID in a production release.

### 2.4 `description`

```json
"description": "Offline medical exam review application"
```

Use a short, accurate description. This may be used in package metadata and release tooling.

Example:

```json
"description": "Offline clinical study and exam review tool"
```

### 2.5 `author`

The current value is:

```json
"author": "MedStudy"
```

For a person:

```json
"author": "Jane Doe <jane@example.com>"
```

For a company:

```json
"author": "Example Health Education LLC"
```

The `author` field is package metadata. It is not automatically displayed as a contact section inside the application. Add visible contact information separately as described in Section 6.

---

## 3. Set the version correctly

The package version is currently:

```json
"version": "0.0.0"
```

Before making a real release, replace it with a meaningful semantic version, for example:

```json
"version": "1.0.0"
```

### 3.1 Semantic versioning

Use the format:

```text
MAJOR.MINOR.PATCH
```

Examples:

| Version | Use when |
|---|---|
| `1.0.0` | First stable public release |
| `1.0.1` | Bug fix with no new major feature |
| `1.1.0` | Backward-compatible feature addition |
| `2.0.0` | Breaking change or major redesign |
| `1.0.0-beta.1` | Pre-release testing build |

### 3.2 Places that must be updated

The version currently appears in more than one place:

1. `package.json` controls the Electron package and installer version.
2. `src/i18n/en.ts` contains visible text such as `Version 1.0`.
3. `src/i18n/fa.ts` contains the Persian version text.
4. `README.md` may contain release instructions or version references.

Update the package version first:

```json
"version": "1.0.0"
```

Then update the visible translations:

```ts
// src/i18n/en.ts
version: 'Version 1.0.0',
```

```ts
// src/i18n/fa.ts
version: 'نسخه ۱.۰.۰',
```

Do not assume the visible footer version updates automatically from `package.json`; the current UI uses hardcoded translation strings.

### 3.3 Installer filename

The current installer filename is configured as:

```json
"artifactName": "MedStudy-Setup-${version}.${ext}"
```

After changing the product name, update it too:

```json
"artifactName": "Clinical-Review-Setup-${version}.${ext}"
```

The `${version}` and `${ext}` placeholders are resolved by Electron Builder.

---

## 4. Replace the application icon

There are two separate icon concerns:

1. The browser/HTML favicon.
2. The Windows executable and installer icon.

Changing only one will not update the other.

### 4.1 Browser favicon

The HTML currently references:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

The source file is:

```text
public/favicon.svg
```

Replace that SVG with your own artwork, keeping the same filename, or change the HTML reference to another asset.

Because the application is loaded by Electron from a local file URL, keep the Vite configuration set to:

```ts
// vite.config.ts
base: './',
```

For consistency, a relative favicon reference is safer in the built desktop application:

```html
<link rel="icon" type="image/svg+xml" href="./favicon.svg" />
```

### 4.2 Windows executable and installer icon

Electron Builder normally expects a Windows icon in `.ico` format. Add your icon here:

```text
build/icon.ico
```

Then configure it explicitly in `package.json`:

```json
"build": {
  "appId": "com.example.clinicalreview",
  "productName": "Clinical Review",
  "win": {
    "icon": "build/icon.ico",
    "target": "nsis",
    "artifactName": "Clinical-Review-Setup-${version}.${ext}"
  }
}
```

Recommended source sizes for a Windows icon include:

- 16×16
- 24×24
- 32×32
- 48×48
- 64×64
- 128×128
- 256×256

A multi-resolution `.ico` file gives Windows better results at different scaling levels. Do not simply rename a PNG file to `.ico`; convert it properly using an icon editor or image tool.

### 4.3 Electron window icon

The `BrowserWindow` is currently created without an explicit icon:

```js
const window = new BrowserWindow({
  width: 1280,
  height: 850,
  // ...
});
```

For Windows, add an icon option if you want the development window and packaged window to use the same icon:

```js
const window = new BrowserWindow({
  width: 1280,
  height: 850,
  icon: path.join(__dirname, '..', 'build', 'icon.ico'),
  // ...
});
```

The installer icon configuration remains necessary even if the BrowserWindow icon is set.

### 4.4 Icon checklist

Before packaging, verify:

- `public/favicon.svg` shows the new design;
- `build/icon.ico` exists;
- `package.json` points to `build/icon.ico`;
- the icon has transparent padding appropriate for Windows;
- the installer and installed shortcut show the new icon;
- old icon caches are cleared when testing a replacement icon.

Windows may cache shortcut icons. If the old icon remains visible, uninstall the old build, remove the old shortcut, or test with a new version and a fresh shortcut.

---

## 5. Change the visible application name and logo

The navigation header is implemented in:

```text
src/components/Header.tsx
```

The current logo is an emoji:

```tsx
<span className="app-logo">🏥</span>
```

You can replace it with text:

```tsx
<span className="app-logo">CR</span>
```

Or use an image:

```tsx
<img className="app-logo-image" src="./logo.svg" alt="Clinical Review" />
```

If the image is stored in `public/logo.svg`, Vite will copy it to the build output. With the Electron-compatible relative base, use a relative URL in the rendered application.

Add styling in `src/index.css`, for example:

```css
.app-logo-image {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
```

The visible translated application name is controlled by:

```ts
// src/i18n/en.ts
appTitle: 'MedStudy',
```

and:

```ts
// src/i18n/fa.ts
appTitle: 'مداستادی',
```

Update both languages if the application is still bilingual.

Also update the browser title in `index.html`:

```html
<title>Clinical Review – Medical Exam Review</title>
```

---

## 6. Add contact information and legal details

The current package has an `author` field, but there is no dedicated visible contact section in the application. Package metadata alone is not enough for users who need support.

### 6.1 Recommended contact information

Decide which of the following you want to publish:

- support email;
- company or developer name;
- website;
- documentation URL;
- bug-report URL;
- privacy policy URL;
- terms of use URL;
- social/community link;
- physical business address, if legally required.

Avoid placing private personal information in a public installer or repository unless you intend to publish it.

### 6.2 Add contact translation keys

Add matching keys to both language files.

Example English keys:

```ts
// src/i18n/en.ts
support: 'Support',
contactUs: 'Contact us',
contactEmail: 'support@example.com',
website: 'Website',
reportIssue: 'Report an issue',
privacyPolicy: 'Privacy Policy',
termsOfUse: 'Terms of Use',
```

Example Persian keys:

```ts
// src/i18n/fa.ts
support: 'پشتیبانی',
contactUs: 'تماس با ما',
contactEmail: 'support@example.com',
website: 'وب‌سایت',
reportIssue: 'گزارش مشکل',
privacyPolicy: 'حریم خصوصی',
termsOfUse: 'شرایط استفاده',
```

Because the translation type is derived from `en.ts`, add the English key first and then add the equivalent key to `fa.ts`.

### 6.3 Add a contact/about section to the UI

A good location is the home-page footer or a dedicated About page. A simple external email link looks like this:

```tsx
<a href="mailto:support@example.com">
  {t('contactEmail')}
</a>
```

A website link should use a full HTTPS URL:

```tsx
<a
  href="https://example.com"
  target="_blank"
  rel="noreferrer"
>
  {t('website')}
</a>
```

If the application must remain fully offline, make the contact text visible without requiring a network connection. The links can still be available when an internet connection exists.

### 6.4 Centralize contact details

For a larger project, avoid repeating contact URLs in multiple components. Create a small configuration module, for example:

```ts
// src/lib/appInfo.ts
export const appInfo = {
  supportEmail: 'support@example.com',
  websiteUrl: 'https://example.com',
  issueUrl: 'https://github.com/example/clinical-review/issues',
  privacyUrl: 'https://example.com/privacy',
  termsUrl: 'https://example.com/terms',
} as const;
```

Then import `appInfo` wherever the links are displayed. This makes future changes safer and prevents one page from showing outdated contact details.

### 6.5 Legal text

Update these translation values when rebranding:

```ts
version: 'Version 1.0.0',
madeWith: 'Made with ❤️ for medical students',
 copyright: '© 2026 Your Company. All rights reserved.',
```

The Persian translation should be updated separately rather than relying on an English string fallback.

Do not treat a copyright notice as a substitute for a privacy policy, terms of use, medical disclaimer, or license. Add separate documents when they are required for your distribution context.

---

## 7. Change colors and visual branding

The theme and accent colors are defined in:

```text
src/contexts/ThemeContext.tsx
src/index.css
```

The accent map currently contains:

```ts
const accentColorMap: Record<AccentColor, string> = {
  blue: '#3b82f6',
  green: '#10b981',
  purple: '#8b5cf6',
  red: '#ef4444',
  orange: '#f97316',
  teal: '#14b8a6',
};
```

To change an existing color, update both the map and any hardcoded CSS colors used by the landing/home sections.

The default CSS variables are near the beginning of `src/index.css`:

```css
:root {
  --accent: #3b82f6;
  --accent-bg: rgba(59, 130, 246, 0.1);
  --accent-border: rgba(59, 130, 246, 0.5);
  --accent-hover: rgba(59, 130, 246, 0.85);
}
```

If you are replacing the brand color, check the following states:

- light theme;
- dark theme;
- active navigation links;
- buttons;
- form focus rings;
- badges and keyword chips;
- error and success messages;
- Persian/RTL layout;
- high-contrast readability.

Do not use the accent color for error text unless the meaning is clear. Keep danger colors and success colors distinguishable from the brand color.

---

## 8. Customize the installer and Windows package

The current Windows build configuration is in `package.json`:

```json
"build": {
  "appId": "com.medstudy.app",
  "productName": "MedStudy",
  "directories": {
    "output": "${env.LOCALAPPDATA}/MedStudyBuild"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "package.json"
  ],
  "asar": true,
  "win": {
    "target": "nsis",
    "artifactName": "MedStudy-Setup-${version}.${ext}"
  }
}
```

### 8.1 Change installer output location

For a stable project-local output directory:

```json
"directories": {
  "output": "release"
}
```

For the current project, the configured output uses the Windows `LOCALAPPDATA` environment variable:

```json
"directories": {
  "output": "${env.LOCALAPPDATA}/MedStudyBuild"
}
```

Use one intentional location and document it in `README.md`. Do not accidentally commit generated installers or unpacked application folders unless that is part of your release process.

### 8.2 NSIS installer options

The current target is:

```json
"win": {
  "target": "nsis"
}
```

You can add NSIS settings such as:

```json
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "Clinical Review",
  "deleteAppDataOnUninstall": false
}
```

Important considerations:

- `oneClick: false` gives users an installation wizard;
- allowing a custom installation directory is useful for managed environments;
- `deleteAppDataOnUninstall: false` helps preserve user data, but you should explain how users can remove data manually;
- changing shortcut settings does not necessarily remove an old shortcut created by a previous version.

Test installation, upgrade, uninstall, and reinstall behavior on a clean Windows machine or virtual machine.

### 8.3 Add publisher information

For professional distribution, code-sign the installer and executable. A signed package helps Windows users verify the publisher and reduces security warnings.

Code signing generally requires:

- a Windows code-signing certificate;
- secure certificate/private-key handling;
- build environment secrets that are not committed to the repository;
- a release process that signs the final artifacts.

Do not place certificate passwords, private keys, or signing tokens in `package.json`, source files, or public documentation.

---

## 9. Understand where user data is stored

The current Electron implementation stores data in a JSON file:

```js
const databasePath = path.join(app.getPath('userData'), 'medstudy-data.json');
```

This is in `electron/main.cjs`.

The current implementation is **not using SQLite**, despite older README wording that mentions a SQLite database. The source of truth is:

- Electron storage: `medstudy-data.json` in Electron's `userData` directory;
- renderer storage: browser `localStorage`;
- synchronization: `src/lib/storage.ts` hydrates desktop values into `localStorage` and writes changes through the preload bridge.

When changing the product name or app ID, the operating system may use a different `userData` path. Treat that as a migration concern. Existing users may not automatically see data created by a differently identified application.

If you intentionally want a stable custom directory, change the path in `electron/main.cjs` carefully and provide a migration plan:

```js
const databasePath = path.join(
  app.getPath('userData'),
  'clinical-review-data.json',
);
```

Before changing the filename or app ID in a released application:

1. export a JSON backup from the UI;
2. decide whether old data must be migrated;
3. implement and test migration if needed;
4. test upgrade from the previous installer;
5. verify that uninstall behavior does not unexpectedly delete user study data.

Never rely on the installation directory for permanent user data because updates and uninstalls can replace or remove it.

---

## 10. Change the HTML metadata

Update `index.html` for browser, accessibility, and basic package identity:

```html
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#3b82f6" />
  <title>Clinical Review</title>
</head>
```

Recommended changes:

- update `lang` if the default language changes;
- update `theme-color` to the new brand color;
- update the favicon reference;
- update the title;
- remove or replace Google Fonts if the application must not make external requests.

The current HTML loads Inter and Vazirmatn from Google Fonts. The application still works without them because CSS provides fallback fonts, but an entirely offline product should bundle fonts locally or use system fonts.

---

## 11. Update translations consistently

The app supports English and Persian. User-facing brand and legal text should be updated in both files:

```text
src/i18n/en.ts
src/i18n/fa.ts
```

At minimum, search for and review:

```text
appTitle
welcomeTitle
aboutDesc
version
madeWith
copyright
```

When adding a new translation key:

1. add it to `en.ts`;
2. add the same key to `fa.ts`;
3. use it through `t('keyName')` in the component;
4. run the build to catch type errors;
5. test both language modes;
6. test RTL layout after switching to Persian.

Do not hardcode brand names, contact links, or legal text in only one component if the same information is displayed in multiple languages.

---

## 12. Update the README and release documents

After rebranding, update `README.md` so it no longer describes the old product or an implementation that is no longer present.

The current README says the desktop version uses SQLite, but the current implementation uses JSON storage through Electron IPC. Correct that before publishing documentation.

A release-ready README should include:

- product name and short description;
- supported operating systems;
- current version;
- developer/company name;
- support email or issue URL;
- installation instructions;
- backup and restore instructions;
- data-storage explanation;
- privacy and offline behavior;
- license information;
- known limitations;
- build commands for contributors.

Example contact section:

```md
## Support

- Email: support@example.com
- Website: https://example.com
- Bug reports: https://github.com/example/clinical-review/issues
```

Keep public contact information synchronized between the README, the application UI, installer metadata, and your website.

---

## 13. Build and verify the customized package

From the project root, run:

```bash
npm ci
npm run lint
npm run build
```

To run the desktop application from the current source:

```bash
npm run desktop:dev
```

To build the Windows installer:

```bash
npm run desktop:dist
```

The project currently uses these scripts:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "oxlint",
  "preview": "vite preview",
  "desktop:dev": "npm run build && electron .",
  "desktop:dist": "npm run build && electron-builder --win"
}
```

### 13.1 Manual verification checklist

After changing branding, verify all of the following:

- [ ] `npm run build` succeeds.
- [ ] `npm run lint` has no new errors.
- [ ] The application opens without a white screen.
- [ ] Home, Subjects, Diseases, Flashcards, Practice, and Statistics routes work.
- [ ] Navigation works after packaging, not only during Vite development.
- [ ] English strings show the new brand.
- [ ] Persian strings show the new brand.
- [ ] RTL layout remains usable.
- [ ] Browser tab title is correct.
- [ ] Browser favicon is correct.
- [ ] Electron window icon is correct.
- [ ] Installer icon is correct.
- [ ] Installer name is correct.
- [ ] Installer filename contains the expected version.
- [ ] Start Menu/Desktop shortcuts use the expected name and icon.
- [ ] Existing data survives an application upgrade.
- [ ] Export and import still work.
- [ ] Delete-all-data behavior is understood and tested.
- [ ] Support/contact information is visible and accurate.
- [ ] Copyright and license text are accurate.
- [ ] No private credentials or signing keys are included in the build files.

### 13.2 Test on a clean machine

At least one release candidate should be tested on a clean Windows account or virtual machine. Check:

1. fresh installation;
2. first launch;
3. creating subjects and diseases;
4. closing and reopening the application;
5. upgrading from the previous release;
6. uninstalling without unintentionally losing data;
7. reinstalling;
8. importing a backup;
9. launching with no internet connection;
10. checking Windows Defender/SmartScreen behavior for unsigned builds.

---

## 14. Suggested release customization order

Use this order to avoid forgetting dependent files:

1. Choose the final product name.
2. Choose the permanent reverse-domain `appId`.
3. Choose the package name and author metadata.
4. Set the semantic version.
5. Replace the Windows `.ico` file.
6. Replace the favicon.
7. Update the Electron window icon.
8. Update the navigation logo.
9. Update English and Persian brand strings.
10. Update version, copyright, and contact text.
11. Update `index.html` title and theme color.
12. Update installer filename and NSIS options.
13. Correct the README and release notes.
14. Run lint and build.
15. Test a development run.
16. Build and test the installer.
17. Create a backup of the final installer and release notes.

---

## 15. Example customized metadata

This is an example only. Replace the values with your real organization details:

```json
{
  "name": "clinical-review",
  "private": true,
  "version": "1.0.0",
  "description": "Offline clinical study and exam review tool",
  "author": "Example Health Education LLC <support@example.com>",
  "main": "electron/main.cjs",
  "build": {
    "appId": "com.example.clinicalreview",
    "productName": "Clinical Review",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "package.json"
    ],
    "asar": true,
    "win": {
      "icon": "build/icon.ico",
      "target": "nsis",
      "artifactName": "Clinical-Review-Setup-${version}.${ext}"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "Clinical Review",
      "deleteAppDataOnUninstall": false
    }
  }
}
```

Do not copy this example blindly. In particular, make sure the app ID, contact address, legal text, icon path, and data migration strategy are appropriate for your own product.

---

## 16. Important project-specific notes

- The Vite `base: './'` setting is required because Electron loads the production page from a local `file://` URL.
- The application uses `HashRouter`, which is appropriate for packaged local files and avoids server-side route resolution problems.
- The current desktop storage implementation uses `medstudy-data.json`, not SQLite.
- The footer version and copyright text are translations, not values automatically read from `package.json`.
- The current Windows build configuration does not yet define a custom `build.win.icon`; add one when replacing the installer icon.
- The current favicon is an SVG. Windows installer/executable branding should use a proper `.ico` file as well.
- Data is written through a secure Electron preload bridge with `contextIsolation: true` and `nodeIntegration: false`; preserve those security settings when customizing the desktop process.
- Do not put API keys, private certificates, signing credentials, or personal secrets into the renderer, preload script, package metadata, or public assets.
