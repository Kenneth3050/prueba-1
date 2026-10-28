const { app, BrowserWindow, Tray, Menu, globalShortcut, screen, nativeImage, ipcMain } = require('electron');
const path = require('path'), fs = require('fs'), http = require('http');
const { spawn } = require('child_process');

const W = 620, H = 300;
const DEF = {
  scale: 1, bg: '#000000', accent: '#32d74b', fg: '#ffffff', opacity: 1,
  autoMusic: true, hideIdle: false, h24: true, lock: false, timerMin: 5, x: null, y: null,
};
let cfg = { ...DEF }, win, setWin, tray, cfgFile, drag = null;
let mp, kp, mBuf = '', retries = 0, quitting = false;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => openSettings());
  app.whenReady().then(init);
}

/* ---------- ajustes ---------- */
function load() { try { cfg = { ...DEF, ...JSON.parse(fs.readFileSync(cfgFile, 'utf8')) }; } catch (e) {} }
function save() { try { fs.writeFileSync(cfgFile, JSON.stringify(cfg)); } catch (e) {} }
const pub = () => ({ ...cfg, login: app.getLoginItemSettings().openAtLogin });
function broadcast() {
  [win, setWin].forEach((w) => w && !w.isDestroyed() && w.webContents.send('settings', pub()));
}
const num = (v, a, b, d) => { v = Number(v); return isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
const col = (v, d) => (/^#[0-9a-f]{6}$/i.test(v) ? v : d);
function sanitize(p) {
  const o = {};
  if ('scale' in p) o.scale = num(p.scale, 0.5, 1.6, 1);
  if ('opacity' in p) o.opacity = num(p.opacity, 0.2, 1, 1);
  if ('timerMin' in p) o.timerMin = Math.round(num(p.timerMin, 1, 600, 5));
  ['bg', 'accent', 'fg'].forEach((k) => { if (k in p) o[k] = col(p[k], DEF[k]); });
  ['autoMusic', 'hideIdle', 'h24', 'lock'].forEach((k) => { if (k in p) o[k] = !!p[k]; });
  return o;
}

/* ---------- ventana de la isla ---------- */
const defPos = () => { const b = screen.getPrimaryDisplay().bounds; return { x: Math.round(b.x + (b.width - W) / 2), y: b.y }; };
function place() {
  let p = defPos();
  if (cfg.x != null && cfg.y != null) {
    const ok = screen.getAllDisplays().some((d) => {
      const b = d.bounds, cx = cfg.x + W / 2;
      return cx >= b.x && cx <= b.x + b.width && cfg.y + 40 >= b.y && cfg.y <= b.y + b.height - 20;
    });
    if (ok) p = { x: cfg.x, y: cfg.y };
  }
  win.setBounds({ ...p, width: W, height: H });
}
function createWindow() {
  win = new BrowserWindow({
    width: W, height: H, transparent: true, frame: false, resizable: false, movable: false,
    hasShadow: false, alwaysOnTop: true, skipTaskbar: true, focusable: false, show: false,
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

/* ---------- ventana de configuración ---------- */
function openSettings() {
  if (setWin && !setWin.isDestroyed()) { setWin.show(); setWin.focus(); return; }
  setWin = new BrowserWindow({
    width: 400, height: 680, resizable: false, minimizable: false, maximizable: false,
    title: 'Configuración de la isla', autoHideMenuBar: true, backgroundColor: '#14162b',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true },
  });
  setWin.setMenu(null);
  setWin.loadFile('settings.html');
  setWin.on('closed', () => { setWin = null; });
}

/* ---------- IPC ---------- */
function wireIpc() {
  ipcMain.on('ignore', (_e, v) => win && win.setIgnoreMouseEvents(!!v, { forward: true }));
  ipcMain.handle('settings:get', () => pub());
  ipcMain.on('settings:set', (_e, p) => {
    p = p || {};
    if ('login' in p) app.setLoginItemSettings({ openAtLogin: !!p.login });
    Object.assign(cfg, sanitize(p));
    save(); broadcast();
  });
  ipcMain.on('settings:reset', () => { cfg = { ...DEF }; save(); place(); broadcast(); });
  ipcMain.on('pos:reset', () => { cfg.x = null; cfg.y = null; save(); place(); });
  ipcMain.on('test', () => win.webContents.send('notify', 'Notificación de prueba', 'Así se verá un aviso en tu isla'));
  ipcMain.on('open-settings', openSettings);
  ipcMain.on('drag-start', (_e, sx, sy) => { if (cfg.lock) return; const [x, y] = win.getPosition(); drag = { sx, sy, x, y }; });
  ipcMain.on('drag-move', (_e, sx, sy) => {
    if (drag) win.setBounds({ x: Math.round(drag.x + sx - drag.sx), y: Math.round(drag.y + sy - drag.sy), width: W, height: H });
  });
  ipcMain.on('drag-end', () => {
    if (!drag) return; drag = null;
    const [x, y] = win.getPosition(); cfg.x = x; cfg.y = y; save();
  });
  ipcMain.on('media-key', (_e, k) => {
    if (kp && ['pp', 'next', 'prev'].includes(k)) { try { kp.stdin.write(k + '\n'); } catch (e) {} }
  });
}

/* ---------- música real (controles multimedia de Windows) ---------- */
function psDir() {
  const d = path.join(app.getPath('userData'), 'ps');
  fs.mkdirSync(d, { recursive: true });
  ['media.ps1', 'keys.ps1'].forEach((f) => fs.writeFileSync(path.join(d, f), fs.readFileSync(path.join(__dirname, 'ps', f))));
  return d;
}
const runPS = (d, f) => spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(d, f)], { windowsHide: true });
function startMedia() {
  if (process.platform !== 'win32') return;
  const d = psDir();
  mp = runPS(d, 'media.ps1');
  mp.stdout.setEncoding('utf8');
  mp.stdout.on('data', (chunk) => {
    mBuf += chunk;
    let i;
    while ((i = mBuf.indexOf('\n')) >= 0) {
      const line = mBuf.slice(0, i).replace(/^\uFEFF/, '').trim();
      mBuf = mBuf.slice(i + 1);
      if (line[0] === '{') { try { win && win.webContents.send('media', JSON.parse(line)); } catch (e) {} }
    }
  });
  mp.on('exit', () => { mp = null; if (!quitting && retries++ < 5) setTimeout(startMedia, 4000); });
}
function startKeys() {
  if (process.platform !== 'win32') return;
  kp = runPS(psDir(), 'keys.ps1');
  kp.on('exit', () => { kp = null; });
  kp.stdin.on('error', () => {});
}

/* ---------- avisos desde otros programas: http://127.0.0.1:47821/notify?title=..&body=.. ---------- */
function startServer() {
  http.createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    if (u.pathname === '/notify' && win) {
      win.webContents.send('notify', (u.searchParams.get('title') || 'Aviso').slice(0, 60), (u.searchParams.get('body') || '').slice(0, 120));
      res.end('ok');
    } else { res.statusCode = 404; res.end(); }
  }).listen(47821, '127.0.0.1').on('error', () => {});
}

/* ---------- atajos y bandeja ---------- */
const ACTIONS = [['Música', 'music', '1'], ['Temporizador', 'timer', '2'], ['Probar notificación', 'test', '3'], ['Reposo', 'idle', '0']];
function hotkeys() {
  ACTIONS.forEach(([, k, n]) => globalShortcut.register('CommandOrControl+Alt+' + n, () => send(k)));
  globalShortcut.register('CommandOrControl+Alt+S', openSettings);
}
function makeTray() {
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png')));
  tray.setToolTip('Isla dinámica');
  const menu = () => Menu.buildFromTemplate([
    ...ACTIONS.map(([label, k, n]) => ({ label, accelerator: 'Ctrl+Alt+' + n, click: () => k === 'test' ? win.webContents.send('notify', 'Notificación de prueba', 'Así se verá un aviso en tu isla') : send(k) })),
    { type: 'separator' },
    { label: 'Configuración…', accelerator: 'Ctrl+Alt+S', click: openSettings },
    { label: 'Restablecer posición', click: () => { cfg.x = null; cfg.y = null; save(); place(); } },
    { label: 'Iniciar con Windows', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin, click: (i) => { app.setLoginItemSettings({ openAtLogin: i.checked }); broadcast(); } },
    { type: 'separator' },
    { label: 'Salir', click: () => app.quit() },
  ]);
  tray.on('click', () => tray.popUpContextMenu(menu()));
  tray.setContextMenu(menu());
}

function init() {
  cfgFile = path.join(app.getPath('userData'), 'settings.json');
  load();
  createWindow(); wireIpc(); hotkeys(); makeTray(); startMedia(); startKeys(); startServer();
}
app.on('will-quit', () => {
  quitting = true; globalShortcut.unregisterAll();
  [mp, kp].forEach((p) => { try { p && p.kill(); } catch (e) {} });
});
app.on('window-all-closed', () => {});
