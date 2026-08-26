const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

let databasePath;
let data = {};

const SPLASH_MS = 2000;

function loadDatabase() {
  databasePath = path.join(app.getPath('userData'), 'medstudy-data.json');
  try {
    data = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
  } catch {
    data = {};
  }
}

function saveDatabase() {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const temporaryPath = `${databasePath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(temporaryPath, databasePath);
}

function registerStorageHandlers() {
  ipcMain.handle('storage:get', (_event, key) => data[key] ?? null);
  ipcMain.handle('storage:set', (_event, key, value) => {
    data[key] = value;
    saveDatabase();
  });
  ipcMain.handle('storage:remove', (_event, key) => {
    delete data[key];
    saveDatabase();
  });
  ipcMain.handle('storage:keys', () => Object.keys(data).sort());
  ipcMain.handle('storage:export', () => ({ ...data }));
  ipcMain.handle('storage:import', (_event, importedData) => {
    data = {};
    for (const [key, value] of Object.entries(importedData)) {
      if (typeof value === 'string') data[key] = value;
    }
    saveDatabase();
  });
  ipcMain.handle('storage:clear', () => {
    data = {};
    saveDatabase();
  });
}

async function createWindow() {
  const appIcon = path.join(__dirname, '..', 'dist', 'favicon.ico');

  // ─── Splash screen ────────────────────────────────────────────────────────
  const splash = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    center: true,
    show: false,
    icon: appIcon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  await splash.loadFile(path.join(__dirname, 'splash.html'));
  splash.show();
  const splashShownAt = Date.now();

  // ─── Main window ──────────────────────────────────────────────────────────
  const window = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    show: false,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Hand over control to the main window exactly once.
  let handedOff = false;
  const handOff = () => {
    if (handedOff) return;
    handedOff = true;
    if (!splash.isDestroyed()) splash.close();
    if (!window.isDestroyed()) {
      window.show();
      window.focus();
    }
  };

  // Listen BEFORE loading so the event can never be missed.
  window.once('ready-to-show', () => {
    const remaining = Math.max(0, SPLASH_MS - (Date.now() - splashShownAt));
    setTimeout(handOff, remaining);
  });

  // Safety net: never let the splash linger, even if loading fails or stalls.
  setTimeout(handOff, SPLASH_MS + 5000);

  try {
    if (process.env.VITE_DEV_SERVER_URL) {
      await window.loadURL(process.env.VITE_DEV_SERVER_URL);
      window.webContents.openDevTools();
    } else {
      await window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }
  } catch (err) {
    console.error('Failed to load main window:', err);
    handOff();
  }
}

app.whenReady().then(() => {
  loadDatabase();
  registerStorageHandlers();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
