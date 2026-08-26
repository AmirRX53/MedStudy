const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

let databasePath;
let data = {};

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
  const window = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(process.env.VITE_DEV_SERVER_URL);
    window.webContents.openDevTools();
  } else {
    await window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
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
