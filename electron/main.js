const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

// No bundled Chromium: poster.js drives the user's installed Chrome/Edge via
// Playwright's `channel` option, so there is no browser to point Playwright at.
const poster = require('./poster');

const SETTINGS_PATH = () => path.join(app.getPath('userData'), 'settings.json');
const PROFILE_DIR = () => path.join(app.getPath('userData'), 'chrome-profile');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1360,
    height: 864,
    icon: path.join(__dirname, '..', 'icon.svg.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH(), 'utf8'));
  } catch {
    return { caption: '', groups: [] };
  }
}

function saveSettings(data) {
  fs.writeFileSync(SETTINGS_PATH(), JSON.stringify(data, null, 2), 'utf8');
}

// ---- IPC ----
ipcMain.handle('settings:load', () => loadSettings());
ipcMain.handle('settings:save', (_e, data) => { saveSettings(data); return true; });

ipcMain.handle('shell:open', (_e, url) => {
  if (/^https?:\/\//.test(String(url))) shell.openExternal(url);
  return true;
});

ipcMain.handle('images:pick', async () => {
  const res = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }],
  });
  return res.canceled ? [] : res.filePaths;
});

ipcMain.handle('login:start', async () => {
  await poster.openLogin(PROFILE_DIR());
  return true;
});

ipcMain.handle('post:run', async (_e, payload) => {
  await poster.runPost({
    caption: payload.caption,
    images: payload.images,
    groups: payload.groups,
    onProgress: (line) => { if (win) win.webContents.send('progress', line); },
  });
  return true;
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
