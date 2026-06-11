const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('saveAPI', {
  isElectron: true,
  listSlots: () => ipcRenderer.invoke('save:list'),
  createSlot: (slot) => ipcRenderer.invoke('save:create', slot),
  loadSlot: (slotId) => ipcRenderer.invoke('save:load', slotId),
  updateSlot: (slot) => ipcRenderer.invoke('save:update', slot),
  setActiveSlot: (slotId) => ipcRenderer.invoke('save:setActive', slotId),
  deleteSlot: (slotId) => ipcRenderer.invoke('save:delete', slotId),
  renameSlot: (slotId, name) => ipcRenderer.invoke('save:rename', { slotId, name }),
});
