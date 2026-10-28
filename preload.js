const { contextBridge, ipcRenderer: r } = require('electron');
const CH = ['show', 'settings', 'media', 'cover', 'mic', 'weather', 'notify'];
contextBridge.exposeInMainWorld('api', {
  setIgnore: (v) => r.send('ignore', v),
  on: (ch, cb) => { if (CH.includes(ch)) r.on(ch, (_e, ...a) => cb(...a)); },
  getSettings: () => r.invoke('settings:get'),
  getWeather: () => r.invoke('weather:get'),
  setSettings: (p) => r.send('settings:set', p),
  resetAll: () => r.send('settings:reset'),
  resetPos: () => r.send('pos:reset'),
  testNotify: () => r.send('test'),
  dragStart: (x, y) => r.send('drag-start', x, y),
  dragMove: (x, y) => r.send('drag-move', x, y),
  dragEnd: () => r.send('drag-end'),
  media: (k) => r.send('media-key', k),
  openSettings: () => r.send('open-settings'),
});
