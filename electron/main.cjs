const path = require('node:path');
const { app, BrowserWindow, ipcMain } = require('electron');
const saveStore = require('./saveStore.cjs');

// Use localhost in dev to avoid 127.0.0.1 binding differences on some macOS setups.
const DEV_SERVER_URL = 'http://localhost:5173';

function createWindow() {
  const window = new BrowserWindow({
    width: 600,
    height: 400,
    minWidth: 600,
    minHeight: 400,
    backgroundColor: '#061d1b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (app.isPackaged) {
    window.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    window.loadURL(DEV_SERVER_URL);
    window.webContents.openDevTools({ mode: 'detach' });
  }
}

function registerIpcHandlers() {
  ipcMain.handle('save:list', async () => saveStore.listSlots());
  ipcMain.handle('save:create', async (_, slot) => saveStore.createSlot(slot));
  ipcMain.handle('save:load', async (_, slotId) => saveStore.loadSlot(slotId));
  ipcMain.handle('save:update', async (_, slot) => saveStore.saveSlot(slot));
  ipcMain.handle('save:setActive', async (_, slotId) => saveStore.setActiveSlot(slotId));
  ipcMain.handle('save:delete', async (_, slotId) => saveStore.deleteSlot(slotId));
  ipcMain.handle('save:rename', async (_, payload) => saveStore.renameSlot(payload.slotId, payload.name));
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
