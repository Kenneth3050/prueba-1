const { app, BrowserWindow, Tray, Menu, globalShortcut, screen, nativeImage, ipcMain, shell, clipboard } = require('electron');
const path = require('path'), fs = require('fs'), http = require('http'), os = require('os');
const { spawn } = require('child_process');

/* ---------- nombre: Cubo (y migración de datos de la versión anterior) ---------- */
app.setName('Cubo');
try {
  const appData = app.getPath('appData'), nu = path.join(appData, 'Cubo');
  app.setPath('userData', nu);
  if (!fs.existsSync(path.join(nu, 'settings.json'))) {
    for (const o of ['isla-dinamica', 'Isla Dinamica', 'isla', 'Isla']) {
      const d = path.join(appData, o);
      if (fs.existsSync(path.join(d, 'settings.json'))) {
        fs.mkdirSync(nu, { recursive: true });
        for (const f of ['settings.json', 'notes.json']) if (fs.existsSync(path.join(d, f))) fs.copyFileSync(path.join(d, f), path.join(nu, f));
        break;
      }
    }
  }
} catch (e) {}

const W = 620, H = 380;
const DEF_LAUNCHERS = '🧮 Calculadora | calc\n📝 Bloc de notas | notepad\n🎨 Paint | mspaint\n🌐 Google | https://www.google.com';
const DEF = {
  scale: 1, bg: '#000000', accent: '#32d74b', fg: '#ffffff', opacity: 1,
  shape: 'round', borderW: 0, borderColor: '#7c8cff', shadow: true, animSpeed: 'normal', font: 'Segoe UI',
  align: 'center', monitor: 0, offsetY: 0, lock: false, onTop: true, hideFullscreen: false, hideIdle: false, hoverExpand: false,
  autoMusic: true, expandSecs: 3.5, coverMode: 'bg', showCover: true, showBars: true, showTimes: true, musicIgnore: '', calls: true,
  volOSD: true, wheelVol: true, volSlider: true, volStep: 2,
  mascot: true, mascotType: 'penguin', mascotSize: 1, headphones: true,
  h24: true, seconds: false, weather: true, unit: 'C', city: '', timerMin: 5, msgSecs: 4.2, sound: false, cdName: '', cdDate: '',
  pomoWork: 25, pomoBreak: 5, clipHistory: false, zones: '', launchers: DEF_LAUNCHERS,
  voiceOn: true, wakeWord: false, wakeName: 'cubo', voiceSpeak: true, voiceTimeout: 7, voiceName: '', voiceRate: 1, voicePitch: 1, voiceVolume: 100,
  notesOnIsland: true,
  lang: null, x: null, y: null,
};
const SC = {
  scale: ['n', 0.5, 1.6], opacity: ['n', 0.2, 1], expandSecs: ['n', 1, 15], mascotSize: ['n', 0.6, 1.4], msgSecs: ['n', 2, 15],
  voiceRate: ['n', 0.5, 2], voicePitch: ['n', 0.5, 2],
  borderW: ['i', 0, 6], monitor: ['i', 0, 8], offsetY: ['i', 0, 300], volStep: ['i', 1, 10], timerMin: ['i', 1, 600],
  pomoWork: ['i', 1, 120], pomoBreak: ['i', 1, 60], voiceTimeout: ['i', 4, 15], voiceVolume: ['i', 0, 100],
  bg: ['c'], accent: ['c'], fg: ['c'], borderColor: ['c'],
  lock: ['b'], onTop: ['b'], hideFullscreen: ['b'], hideIdle: ['b'], hoverExpand: ['b'], shadow: ['b'],
  autoMusic: ['b'], showCover: ['b'], showBars: ['b'], showTimes: ['b'], calls: ['b'],
  volOSD: ['b'], wheelVol: ['b'], volSlider: ['b'], mascot: ['b'], headphones: ['b'],
  h24: ['b'], seconds: ['b'], weather: ['b'], sound: ['b'], clipHistory: ['b'],
  voiceOn: ['b'], wakeWord: ['b'], voiceSpeak: ['b'], notesOnIsland: ['b'],
  lang: ['e', ['es', 'en']], unit: ['e', ['C', 'F']], coverMode: ['e', ['accent', 'bg', 'off']],
  mascotType: ['e', ['penguin', 'cone', 'ghost']], shape: ['e', ['round', 'soft', 'square']],
  animSpeed: ['e', ['normal', 'fast', 'off']], align: ['e', ['left', 'center', 'right']],
  font: ['e', ['Segoe UI', 'Arial', 'Consolas', 'Georgia', 'Trebuchet MS', 'Comic Sans MS']],
  city: ['s', 60], musicIgnore: ['s', 80], cdName: ['s', 40], cdDate: ['d'], zones: ['s', 160], launchers: ['s', 700],
  wakeName: ['s', 20], voiceName: ['s', 100],
};
let cfg = { ...DEF }, win, setWin, notesWin, tray, cfgFile, notesFile, drag = null;
let notes = [], wakeP = null, kp, wx = null, fsOn = false, quitting = false;
let clips = [], lastClip = '', prevCpu = null;
const procs = {};
const ICON = path.join(__dirname, 'assets', 'icon.ico');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => openSettings());
  app.whenReady().then(init);
}

const log = (msg) => { try { fs.appendFileSync(path.join(app.getPath('userData'), 'cubo.log'), new Date().toISOString() + ' ' + msg + '\n'); } catch (e) {} };

/* ---------- ajustes ---------- */
function load() {
  try { cfg = { ...DEF, ...JSON.parse(fs.readFileSync(cfgFile, 'utf8')) }; } catch (e) {}
  if (cfg.lang !== 'es' && cfg.lang !== 'en') cfg.lang = app.getLocale().toLowerCase().startsWith('es') ? 'es' : 'en';
}
function save() { try { fs.writeFileSync(cfgFile, JSON.stringify(cfg)); } catch (e) {} }
const pub = () => ({ ...cfg, login: app.getLoginItemSettings().openAtLogin });
function broadcast() {
  [win, setWin].forEach((w) => w && !w.isDestroyed() && w.webContents.send('settings', pub()));
}
function sanitize(p) {
  const o = {};
  for (const k of Object.keys(p || {})) {
    const s = SC[k]; if (!s) continue;
    const v = p[k];
    if (s[0] === 'n') { const n = Number(v); if (isFinite(n)) o[k] = Math.min(s[2], Math.max(s[1], n)); }
    else if (s[0] === 'i') { const n = Math.round(Number(v)); if (isFinite(n)) o[k] = Math.min(s[2], Math.max(s[1], n)); }
    else if (s[0] === 'c') { if (/^#[0-9a-f]{6}$/i.test(v)) o[k] = v; }
    else if (s[0] === 'b') o[k] = !!v;
    else if (s[0] === 'e') { if (s[1].includes(v)) o[k] = v; }
    else if (s[0] === 's') o[k] = String(v).slice(0, s[1]);
    else if (s[0] === 'd') o[k] = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '';
  }
  return o;
}
function parseLaunchers() {
  return String(cfg.launchers || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const i = l.indexOf('|');
    return i < 0 ? { name: l, cmd: l } : { name: l.slice(0, i).trim(), cmd: l.slice(i + 1).trim() };
  }).filter((a) => a.name && a.cmd).slice(0, 8);
}

/* ---------- ventana de la isla ---------- */
function targetDisplay() {
  const d = screen.getAllDisplays();
  return d[Math.min(cfg.monitor, d.length - 1)] || screen.getPrimaryDisplay();
}
function defPos() {
  const b = targetDisplay().bounds;
  let x = b.x + (b.width - W) / 2;
  if (cfg.align === 'left') x = b.x;
  if (cfg.align === 'right') x = b.x + b.width - W;
  return { x: Math.round(x), y: b.y + Math.round(cfg.offsetY) };
}
function place() {
  if (!win || win.isDestroyed()) return;
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
function vis() {
  if (!win || win.isDestroyed()) return;
  const hide = cfg.hideFullscreen && fsOn;
  if (hide && win.isVisible()) win.hide();
  else if (!hide && !win.isVisible()) win.showInactive();
}
function createWindow() {
  win = new BrowserWindow({
    width: W, height: H, transparent: true, frame: false, resizable: false, movable: false,
    hasShadow: false, alwaysOnTop: true, skipTaskbar: true, focusable: false, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, autoplayPolicy: 'no-user-gesture-required' },
  });
  win.setAlwaysOnTop(!!cfg.onTop, cfg.onTop ? 'screen-saver' : 'normal');
  win.setIgnoreMouseEvents(true, { forward: true });
  place();
  win.loadFile('index.html');
  win.once('ready-to-show', () => { win.showInactive(); vis(); });
  screen.on('display-metrics-changed', place);
}
const send = (k) => win && win.webContents.send('show', k);

/* ---------- ventanas de configuración y notas ---------- */
function openSettings() {
  if (setWin && !setWin.isDestroyed()) { setWin.show(); setWin.focus(); return; }
  const wa = targetDisplay().workArea;
  const w = Math.min(960, wa.width - 40), h = Math.min(700, wa.height - 100);
  setWin = new BrowserWindow({
    width: w, height: h, x: wa.x + Math.round((wa.width - w) / 2), y: wa.y + 70,
    frame: false, resizable: false, maximizable: false,
    title: 'Cubo', icon: ICON, backgroundColor: '#0e1022',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true },
  });
  setWin.setMenu(null);
  setWin.loadFile('settings.html');
  setWin.on('closed', () => { setWin = null; });
}
function openNotes() {
  if (notesWin && !notesWin.isDestroyed()) { notesWin.show(); notesWin.focus(); return; }
  const wa = targetDisplay().workArea;
  notesWin = new BrowserWindow({
    width: 460, height: Math.min(700, wa.height - 100), x: wa.x + Math.round((wa.width - 460) / 2), y: wa.y + 70,
    frame: false, resizable: true, minWidth: 380, minHeight: 420, maximizable: false,
    title: 'Cubo · Notas', icon: ICON, backgroundColor: '#0e1022',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true },
  });
  notesWin.setMenu(null);
  notesWin.loadFile('notes.html');
  notesWin.on('closed', () => { notesWin = null; });
}
function loadNotes() { try { notes = JSON.parse(fs.readFileSync(notesFile, 'utf8')); } catch (e) { notes = []; } if (!Array.isArray(notes)) notes = []; }
function saveNotes() { try { fs.writeFileSync(notesFile, JSON.stringify(notes)); } catch (e) {} }
function cleanNotes(a) {
  let pinned = false;
  return (Array.isArray(a) ? a : []).slice(0, 300).map((n) => {
    const p = !!n.p && !pinned; if (p) pinned = true;
    return { id: String(n.id || Date.now() + '' + Math.random()).slice(0, 40), t: String(n.t || '').slice(0, 600), d: !!n.d, p, ts: Number(n.ts) || Date.now() };
  }).filter((n) => n.t.trim() !== '');
}
function bcNotes(skip) {
  [win, notesWin].forEach((w) => { if (w && !w.isDestroyed() && w.webContents !== skip) w.webContents.send('notes', notes); });
}

/* ---------- portapapeles (solo en memoria, opcional) y rendimiento ---------- */
function pollClip() {
  if (!cfg.clipHistory || !win || win.isDestroyed()) return;
  let t = '';
  try { t = clipboard.readText(); } catch (e) {}
  t = (t || '').trim();
  if (!t || t === lastClip) return;
  lastClip = t;
  t = t.slice(0, 300);
  clips = [t, ...clips.filter((x) => x !== t)].slice(0, 8);
  win.webContents.send('clip', clips);
}
function cpuSample() {
  let idle = 0, total = 0;
  os.cpus().forEach((c) => { for (const k in c.times) total += c.times[k]; idle += c.times.idle; });
  return { idle, total };
}
function sendStats() {
  if (!win || win.isDestroyed()) return;
  const cur = cpuSample();
  let cpu = 0;
  if (prevCpu) { const di = cur.idle - prevCpu.idle, dt = cur.total - prevCpu.total; cpu = dt > 0 ? Math.round((1 - di / dt) * 100) : 0; }
  prevCpu = cur;
  const total = os.totalmem(), used = total - os.freemem();
  win.webContents.send('stats', { cpu: Math.max(0, Math.min(100, cpu)), ram: Math.round((used / total) * 100), used, total });
}

/* ---------- IPC ---------- */
const vcmd = (cmd) => { const p = procs['voice.ps1']; try { p && p.stdin.write(cmd + '\n'); } catch (e) {} };
const vsend = (cmd) => { const p = procs['vol.ps1']; try { p && p.stdin.write(cmd + '\n'); } catch (e) {} };
function launch(i) {
  const a = parseLaunchers()[Number(i) | 0];
  if (!a) return;
  const c = a.cmd;
  try {
    if (/^https?:\/\//i.test(c)) shell.openExternal(c);
    else if (fs.existsSync(c)) shell.openPath(c);
    else { const ch = spawn(c, [], { shell: true, detached: true, stdio: 'ignore' }); ch.on('error', () => {}); ch.unref(); }
  } catch (e) { log('acceso: ' + e.message); }
}
function wireIpc() {
  ipcMain.on('ignore', (_e, v) => win && win.setIgnoreMouseEvents(!!v, { forward: true }));
  ipcMain.handle('settings:get', () => pub());
  ipcMain.handle('displays', () => screen.getAllDisplays().map((d, i) => ({ i, primary: d.id === screen.getPrimaryDisplay().id, w: d.size.width, h: d.size.height })));
  ipcMain.handle('weather:get', () => wx);
  ipcMain.handle('notes:get', () => notes);
  ipcMain.on('settings:set', (_e, p) => {
    p = p || {};
    if ('login' in p) app.setLoginItemSettings({ openAtLogin: !!p.login });
    const o = sanitize(p);
    Object.assign(cfg, o);
    if (['align', 'monitor', 'offsetY'].some((k) => k in o)) { cfg.x = null; cfg.y = null; place(); }
    if ('onTop' in o && win) win.setAlwaysOnTop(!!cfg.onTop, cfg.onTop ? 'screen-saver' : 'normal');
    if ('hideFullscreen' in o) vis();
    if (['voiceOn', 'wakeWord', 'wakeName', 'lang'].some((k) => k in o)) startWake();
    if ('lang' in o) vcmd('lang ' + cfg.lang);
    if ('clipHistory' in o) { clips = []; try { lastClip = (clipboard.readText() || '').trim(); } catch (e) {} if (win) win.webContents.send('clip', clips); }
    save(); broadcast(); makeTray();
    if ('city' in o || 'lang' in o) getWeather();
  });
  ipcMain.on('settings:reset', () => { const l = cfg.lang; cfg = { ...DEF, lang: l }; save(); place(); broadcast(); makeTray(); getWeather(); startWake(); });
  ipcMain.on('pos:reset', () => { cfg.x = null; cfg.y = null; save(); place(); });
  ipcMain.on('test', () => send('test'));
  ipcMain.on('open-settings', openSettings);
  ipcMain.on('win:close', (e) => { const w = BrowserWindow.fromWebContents(e.sender); if (w) w.close(); });
  ipcMain.on('win:min', (e) => { const w = BrowserWindow.fromWebContents(e.sender); if (w) w.minimize(); });
  ipcMain.on('notes:set', (e, a) => { notes = cleanNotes(a); saveNotes(); bcNotes(e.sender); });
  ipcMain.on('notes:add', (_e, t) => {
    t = String(t || '').trim().slice(0, 600); if (!t) return;
    notes.unshift({ id: Date.now() + '' + Math.floor(Math.random() * 1000), t, d: false, p: false, ts: Date.now() });
    saveNotes(); bcNotes();
  });
  ipcMain.on('notes:open', openNotes);
  ipcMain.on('voice:test', () => send('voice'));
  ipcMain.on('voice:speaktest', () => send('speaktest'));
  ipcMain.on('voice:listen', () => {
    if (!procs['voice.ps1'] || process.platform !== 'win32') { if (win) win.webContents.send('heard', { err: 'norecognizer' }); return; }
    vcmd('listen ' + cfg.voiceTimeout);
  });
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
  ipcMain.on('vol:set', (_e, v) => vsend('set ' + Number(v).toFixed(3)));
  ipcMain.on('vol:step', (_e, d) => vsend('step ' + Number(d).toFixed(3)));
  ipcMain.on('vol:mute', () => vsend('toggle'));
  ipcMain.on('mic:toggle', () => vsend('mic'));
  ipcMain.on('shot', () => { if (process.platform === 'win32') shell.openExternal('ms-screenclip:'); });
  ipcMain.on('clip:set', (_e, t) => {
    t = String(t || '').slice(0, 300); if (!t) return;
    try { clipboard.writeText(t); } catch (e) {}
    lastClip = t; clips = [t, ...clips.filter((x) => x !== t)].slice(0, 8);
    if (win) win.webContents.send('clip', clips);
  });
  ipcMain.on('clip:clear', () => { clips = []; if (win) win.webContents.send('clip', clips); });
  ipcMain.on('app:launch', (_e, i) => launch(i));
}

/* ---------- scripts de Windows ---------- */
function psDir() {
  const d = path.join(app.getPath('userData'), 'ps');
  fs.mkdirSync(d, { recursive: true });
  ['media.ps1', 'keys.ps1', 'mic.ps1', 'vol.ps1', 'fs.ps1', 'voice.ps1', 'wake.ps1'].forEach((f) => fs.writeFileSync(path.join(d, f), fs.readFileSync(path.join(__dirname, 'ps', f))));
  return d;
}
const runPS = (d, f, args = []) => spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(d, f), ...args], { windowsHide: true });
function startPS(f, onLine, args = []) {
  if (process.platform !== 'win32') return;
  const d = psDir();
  let buf = '', tries = 0;
  const go = () => {
    const p = runPS(d, f, args); procs[f] = p;
    p.stdout.setEncoding('utf8');
    p.stderr.on('data', (x) => log(f + ': ' + String(x).slice(0, 400)));
    p.stdout.on('data', (chunk) => {
      buf += chunk;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).replace(/^\uFEFF/, '').trim();
        buf = buf.slice(i + 1);
        if (line[0] === '{') { try { onLine(JSON.parse(line)); } catch (e) {} }
      }
    });
    p.stdin.on('error', () => {});
    p.on('exit', () => { if (!quitting && tries++ < 5) setTimeout(go, 4000); });
  };
  go();
}
function startKeys() {
  if (process.platform !== 'win32') return;
  kp = runPS(psDir(), 'keys.ps1');
  kp.on('exit', () => { kp = null; });
  kp.stdin.on('error', () => {});
}
function startScripts() {
  startPS('media.ps1', (j) => {
    if (!win) return;
    if (j.dbg) { log(j.dbg); delete j.dbg; }
    const img = j.img; delete j.img;
    win.webContents.send('media', j);
    if (img !== undefined) win.webContents.send('cover', img);
  });
  startPS('mic.ps1', (j) => {
    if (!win) return;
    win.webContents.send('mic', [].concat(j.apps || []).map((n) => String(n).split('#').pop()));
  });
  startPS('vol.ps1', (j) => { if (win && j.vol !== undefined) win.webContents.send('volume', j); });
  startPS('fs.ps1', (j) => { fsOn = !!j.fs; vis(); });
  startPS('voice.ps1', (j) => {
    if (!win) return;
    if (j.ready) log('voz: reconocedor ' + j.ready + ' (idioma coincide: ' + j.match + ') instalados: ' + j.all);
    else if (j.err) { log('voz: ' + j.err); win.webContents.send('heard', { err: j.err === 'norecognizer' ? 'norecognizer' : 'err' }); }
    else if (j.heard !== undefined) win.webContents.send('heard', { text: j.heard });
  }, [cfg.lang]);
  startKeys();
  setTimeout(() => vsend('get'), 1500);
  setInterval(() => vsend('get'), 1500);
}

/* ---------- palabra de activación (por defecto "cubo") ---------- */
function stopWake() { if (wakeP) { try { wakeP.kill(); } catch (e) {} wakeP = null; } }
function startWake() {
  stopWake();
  if (process.platform !== 'win32' || !cfg.voiceOn || !cfg.wakeWord) return;
  const name = (cfg.wakeName || 'cubo').replace(/[^\p{L}\p{N} ]/gu, '').trim() || 'cubo';
  const p = runPS(psDir(), 'wake.ps1', [cfg.lang, name]);
  wakeP = p;
  p.stdout.setEncoding('utf8');
  p.stdout.on('data', (d) => { if (d.includes('"wake"')) send('voice'); else if (d.includes('err')) log('wake: ' + d.trim()); });
  p.stderr.on('data', (x) => log('wake.ps1: ' + String(x).slice(0, 300)));
  p.stdin.on('error', () => {});
  p.on('exit', () => { if (wakeP === p) wakeP = null; });
}

/* ---------- clima (Open-Meteo; ubicación por ciudad o por IP) ---------- */
async function getWeather() {
  try {
    let lat, lon, city = (cfg.city || '').trim();
    if (city) {
      const g = await (await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=' + cfg.lang + '&name=' + encodeURIComponent(city))).json();
      const r = g.results && g.results[0];
      if (!r) throw new Error('ciudad no encontrada');
      lat = r.latitude; lon = r.longitude; city = r.name;
    } else {
      const g = await (await fetch('https://ipwho.is/')).json();
      lat = g.latitude; lon = g.longitude; city = g.city || '';
    }
    const w = await (await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,weather_code,is_day&timezone=auto')).json();
    wx = { t: w.current.temperature_2m, code: w.current.weather_code, day: w.current.is_day, city };
    if (win) win.webContents.send('weather', wx);
  } catch (e) {}
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
const L = {
  es: { music: 'Música', timer: 'Temporizador', test: 'Probar aviso', sw: 'Cronómetro', pomo: 'Pomodoro', stats: 'Rendimiento', clip: 'Portapapeles', apps: 'Accesos rápidos', idle: 'Reposo', voice: 'Asistente de voz', notes: 'Notas', shot: 'Captura de pantalla', settings: 'Configuración…', rpos: 'Restablecer posición', login: 'Iniciar con Windows', dataf: 'Abrir carpeta de datos', quit: 'Salir' },
  en: { music: 'Music', timer: 'Timer', test: 'Test alert', sw: 'Stopwatch', pomo: 'Pomodoro', stats: 'Performance', clip: 'Clipboard', apps: 'Quick launchers', idle: 'Idle', voice: 'Voice assistant', notes: 'Notes', shot: 'Screenshot', settings: 'Settings…', rpos: 'Reset position', login: 'Start with Windows', dataf: 'Open data folder', quit: 'Quit' },
};
const ACTIONS = [['music', '1'], ['timer', '2'], ['test', '3'], ['sw', '4'], ['pomo', '5'], ['stats', '6'], ['clip', '7'], ['apps', '8'], ['idle', '0']];
function hotkeys() {
  ACTIONS.forEach(([k, n]) => globalShortcut.register('CommandOrControl+Alt+' + n, () => send(k)));
  globalShortcut.register('CommandOrControl+Alt+PageUp', () => send('volup'));
  globalShortcut.register('CommandOrControl+Alt+PageDown', () => send('voldown'));
  globalShortcut.register('CommandOrControl+Alt+M', () => send('mute'));
  globalShortcut.register('CommandOrControl+Alt+K', () => send('micmute'));
  globalShortcut.register('CommandOrControl+Alt+S', openSettings);
  globalShortcut.register('CommandOrControl+Alt+V', () => send('voice'));
  globalShortcut.register('CommandOrControl+Alt+N', openNotes);
}
function makeTray() {
  if (!tray) {
    tray = new Tray(nativeImage.createFromPath(process.platform === 'win32' ? ICON : path.join(__dirname, 'assets', 'icon.png')));
    tray.setToolTip('Cubo');
  }
  const t = L[cfg.lang] || L.es;
  const menu = Menu.buildFromTemplate([
    ...ACTIONS.map(([k, n]) => ({ label: t[k], accelerator: 'Ctrl+Alt+' + n, click: () => send(k) })),
    { type: 'separator' },
    { label: t.voice, accelerator: 'Ctrl+Alt+V', click: () => send('voice') },
    { label: t.notes, accelerator: 'Ctrl+Alt+N', click: openNotes },
    { label: t.shot, click: () => { if (process.platform === 'win32') shell.openExternal('ms-screenclip:'); } },
    { label: t.settings, accelerator: 'Ctrl+Alt+S', click: openSettings },
    { label: t.rpos, click: () => { cfg.x = null; cfg.y = null; save(); place(); } },
    { label: t.login, type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin, click: (i) => { app.setLoginItemSettings({ openAtLogin: i.checked }); broadcast(); } },
    { label: t.dataf, click: () => shell.openPath(app.getPath('userData')) },
    { type: 'separator' },
    { label: t.quit, click: () => app.quit() },
  ]);
  tray.removeAllListeners('click');
  tray.on('click', () => tray.popUpContextMenu(menu));
  tray.setContextMenu(menu);
}

function init() {
  try { app.setAppUserModelId('com.isla.dinamica'); } catch (e) {}
  cfgFile = path.join(app.getPath('userData'), 'settings.json');
  notesFile = path.join(app.getPath('userData'), 'notes.json');
  load(); loadNotes();
  createWindow(); wireIpc(); hotkeys(); makeTray(); startScripts(); startServer(); startWake();
  getWeather(); setInterval(getWeather, 20 * 60 * 1000);
  setInterval(sendStats, 2000);
  setInterval(pollClip, 900);
}
app.on('will-quit', () => {
  quitting = true; globalShortcut.unregisterAll(); stopWake();
  [kp, ...Object.values(procs)].forEach((p) => { try { p && p.kill(); } catch (e) {} });
});
app.on('window-all-closed', () => {});
