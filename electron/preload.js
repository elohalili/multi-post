const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (data) => ipcRenderer.invoke('settings:save', data),
  pickImages: () => ipcRenderer.invoke('images:pick'),
  startLogin: () => ipcRenderer.invoke('login:start'),
  runPost: (payload) => ipcRenderer.invoke('post:run', payload),
  onProgress: (cb) => ipcRenderer.on('progress', (_e, line) => cb(line)),
});
