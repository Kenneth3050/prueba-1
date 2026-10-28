const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  setIgnore: (v) => ipcRenderer.send('ignore', v),
  onShow: (cb) => ipcRenderer.on('show', (_e, k) => cb(k)),
});
