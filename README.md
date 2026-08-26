# MedStudy

MedStudy is an offline medical exam review app.

## Web development

```bash
npm ci
npm run dev
```

## Windows desktop app

The desktop version uses Electron and SQLite. Study data is stored locally in:

```text
%APPDATA%\MedStudy\medstudy.db
```

It does not require an account, internet connection, or cloud service. The database is outside the installation directory, so application updates do not remove study data.

Run the desktop app in development mode:

```bash
npm run desktop:dev
```

Build a Windows installer:

```bash
npm run desktop:dist
```

The installer is written to `%LOCALAPPDATA%\MedStudyBuild` (the exact resolved path is shown in the build output). The application uses a secure Electron preload bridge; the React UI never receives direct filesystem or SQLite access.

The app currently starts with an empty desktop database. Browser `localStorage` data is intentionally not imported automatically. Use the existing JSON export/import controls if you want to transfer data manually.

## Backup recommendation

Export a JSON backup before uninstalling or moving the app. The SQLite database is persistent, but backups protect against disk failure or accidental deletion of the Windows application-data folder.
