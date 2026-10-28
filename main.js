const { app, BrowserWindow, Tray, Menu, globalShortcut, screen, nativeImage, ipcMain } = require('electron');
const path = require('path');

const W = 440, H = 190;
let win, tray;

if (!app.requestSingleInstanceLock()) app.quit();

function place() {
  const { bounds } = screen.getPrimaryDisplay();
  win.setBounds({ x: Math.round(bounds.x + (bounds.width - W) / 2), y: bounds.y, width: W, height: H });
}

function createWindow() {
  win = new BrowserWindow({
    width: W, height: H, transparent: true, frame: false, resizable: false,
    movable: false, hasShadow: false, alwaysOnTop: true, skipTaskbar: true,
    focusable: false, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setIgnoreMouseEvents(true, { forward: true });
  place();
  win.loadFile('index.html');
  win.once('ready-to-show', () => win.showInactive());
  screen.on('display-metrics-changed', place);
}

const send = (k) => win && win.webContents.send('show', k);

const ACTIONS = [
  ['Música', 'music', '1'], ['Temporizador', 'timer', '2'], ['Llamada', 'call', '3'],
  ['Mensaje', 'msg', '4'], ['Carga', 'charge', '5'], ['Reposo', 'idle', '0'],
];

app.whenReady().then(() => {
  createWindow();
  ipcMain.on('ignore', (_e, v) => win.setIgnoreMouseEvents(v, { forward: true }));

  ACTIONS.forEach(([, k, n]) => globalShortcut.register('CommandOrControl+Alt+' + n, () => send(k)));

  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png')));
  tray.setToolTip('Isla dinámica');
  const menu = () => Menu.buildFromTemplate([
    ...ACTIONS.map(([label, k, n]) => ({ label, accelerator: 'Ctrl+Alt+' + n, click: () => send(k) })),
    { type: 'separator' },
    {
      label: 'Iniciar con Windows', type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (i) => app.setLoginItemSettings({ openAtLogin: i.checked }),
    },
    { label: 'Salir', click: () => app.quit() },
  ]);
  tray.on('click', () => tray.popUpContextMenu(menu()));
  tray.setContextMenu(menu());
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => app.quit());
