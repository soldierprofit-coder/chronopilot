const {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  screen,
} = require('electron');
const { spawn } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { connectToGame } = require('./cdp-client.cjs');
const { findOfficialClient, isOfficialClientExe } = require('./official-client.cjs');

const INJECT_SOURCE = readFileSync(
  path.join(__dirname, '..', 'dist-inject', 'chronopilot.js'),
  'utf8',
);
const ATTACH_TIMEOUT_MS = 25_000;
const VISIBLE_SNAPSHOT_MS = 250;
const HIDDEN_SNAPSHOT_MS = 1_000;

let controlWindow = null;
let officialProcess = null;
let cdpSession = null;
let snapshotTimer = null;
let snapshotInFlight = false;
let isQuitting = false;
let launchToken = 0;
let attachPort = null;
let nextInjectionCheck = 0;
let lastSnapshot = { ready: false };
let launcherState = {
  phase: 'detecting',
  exePath: '',
  message: 'Looking for the official World of ClaudeCraft client…',
};

function safeControlPreferences() {
  return {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    spellcheck: false,
    backgroundThrottling: false,
    preload: path.join(__dirname, 'control-preload.cjs'),
  };
}

function statePath(name) {
  return path.join(app.getPath('userData'), name);
}

function readJson(name) {
  try {
    return JSON.parse(readFileSync(statePath(name), 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(name, value) {
  try {
    writeFileSync(statePath(name), JSON.stringify(value, null, 2));
  } catch {
    // A saved window position and executable path are conveniences only.
  }
}

function defaultControlBounds() {
  const { workArea } = screen.getPrimaryDisplay();
  const width = 470;
  const height = Math.min(860, Math.max(640, workArea.height - 80));
  return {
    x: workArea.x + workArea.width - width - 24,
    y: workArea.y + 40,
    width,
    height,
  };
}

function savedControlBounds() {
  const state = readJson('control-window.json');
  if (state && [state.x, state.y, state.width, state.height].every(Number.isFinite)) {
    const visible = screen.getAllDisplays().some(({ workArea }) => (
      state.x < workArea.x + workArea.width
      && state.x + state.width > workArea.x
      && state.y < workArea.y + workArea.height
      && state.y + state.height > workArea.y
    ));
    if (visible) return state;
  }
  return defaultControlBounds();
}

function saveControlBounds() {
  if (!controlWindow || controlWindow.isDestroyed() || controlWindow.isMinimized()) return;
  writeJson('control-window.json', controlWindow.getBounds());
}

function publishLauncherState(update = {}) {
  launcherState = { ...launcherState, ...update };
  if (controlWindow && !controlWindow.isDestroyed()) {
    controlWindow.webContents.send('chronopilot-launcher-state', launcherState);
  }
}

function publishSnapshot(snapshot) {
  lastSnapshot = snapshot;
  if (controlWindow && !controlWindow.isDestroyed()) {
    controlWindow.webContents.send('chronopilot-snapshot', lastSnapshot);
  }
}

function setOfficialClientPath(exePath) {
  launcherState.exePath = exePath || '';
  if (exePath) writeJson('official-client.json', { exePath });
}

async function detectOfficialClient() {
  const savedPath = readJson('official-client.json')?.exePath;
  const exePath = await findOfficialClient({ savedPath });
  if (!exePath) {
    publishLauncherState({
      phase: 'not-found',
      exePath: '',
      message: 'Official client not found. Browse to World of ClaudeCraft.exe.',
    });
    return null;
  }
  setOfficialClientPath(exePath);
  publishLauncherState({
    phase: 'ready',
    exePath,
    message: 'Official client found. Launching it now…',
  });
  return exePath;
}

function getFreeLoopbackPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close((error) => {
        if (error || !port) reject(error || new Error('Could not reserve a local port'));
        else resolve(port);
      });
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function closeCdpSession() {
  const session = cdpSession;
  cdpSession = null;
  if (session) {
    session.onDisconnected = null;
    session.close();
  }
  nextInjectionCheck = 0;
  publishSnapshot({ ready: false });
}

async function attachToOfficialClient(port, token, timeoutMs = ATTACH_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (!isQuitting && token === launchToken && Date.now() < deadline) {
    try {
      const session = await connectToGame(port);
      if (session) {
        if (token !== launchToken || isQuitting) {
          session.close();
          return false;
        }
        closeCdpSession();
        cdpSession = session;
        session.onDisconnected = () => {
          if (cdpSession !== session || isQuitting || token !== launchToken) return;
          cdpSession = null;
          publishSnapshot({ ready: false });
          publishLauncherState({
            phase: 'attaching',
            message: 'Game reloaded; reconnecting ChronoPilot…',
          });
          void attachToOfficialClient(port, token, 12_000).then((connected) => {
            if (!connected && token === launchToken && !isQuitting) {
              publishLauncherState({
                phase: 'error',
                message: 'The game restarted without the attach flag. Close it, then click Launch & Attach.',
              });
            }
          });
        };
        publishLauncherState({
          phase: 'attached',
          message: 'Attached to the official client. Sign in and enter the world.',
        });
        scheduleSnapshotPoll(0);
        return true;
      }
    } catch {
      // The official shell and renderer may still be starting. Keep polling locally.
    }
    await delay(400);
  }
  return false;
}

async function launchAndAttach() {
  if (['launching', 'attaching'].includes(launcherState.phase)) return false;
  const exePath = launcherState.exePath;
  if (!await isOfficialClientExe(exePath)) {
    publishLauncherState({
      phase: 'not-found',
      exePath: '',
      message: 'Select the installed World of ClaudeCraft.exe first.',
    });
    return false;
  }

  const token = ++launchToken;
  closeCdpSession();
  attachPort = await getFreeLoopbackPort();
  publishLauncherState({
    phase: 'launching',
    message: 'Starting the official World of ClaudeCraft client…',
  });

  let child;
  try {
    child = spawn(exePath, [
      '--remote-debugging-address=127.0.0.1',
      `--remote-debugging-port=${attachPort}`,
    ], {
      cwd: path.dirname(exePath),
      detached: false,
      shell: false,
      stdio: 'ignore',
      windowsHide: false,
    });
  } catch (error) {
    publishLauncherState({ phase: 'error', message: `Could not start the official client: ${error.message}` });
    return false;
  }
  officialProcess = child;
  child.once('error', (error) => {
    if (token !== launchToken) return;
    publishLauncherState({ phase: 'error', message: `Could not start the official client: ${error.message}` });
  });
  child.once('exit', () => {
    if (officialProcess === child) officialProcess = null;
    if (isQuitting || token !== launchToken) return;
    closeCdpSession();
    publishLauncherState({
      phase: 'ready',
      message: 'Official client closed or updated. Click Launch & Attach to start it again.',
    });
  });

  publishLauncherState({
    phase: 'attaching',
    message: 'Official client started; waiting for its game window…',
  });
  const connected = await attachToOfficialClient(attachPort, token);
  if (!connected && token === launchToken && !isQuitting) {
    publishLauncherState({
      phase: 'error',
      message: 'Could not attach. Fully close any existing WoC client, then click Launch & Attach.',
    });
  }
  return connected;
}

async function browseOfficialClient() {
  const result = await dialog.showOpenDialog(controlWindow, {
    title: 'Select World of ClaudeCraft.exe',
    properties: ['openFile'],
    filters: [{ name: 'World of ClaudeCraft', extensions: ['exe'] }],
  });
  const selected = result.canceled ? null : result.filePaths[0];
  if (!selected) return launcherState;
  if (!await isOfficialClientExe(selected)) {
    publishLauncherState({ phase: 'error', message: 'That file is not a readable Windows executable.' });
    return launcherState;
  }
  setOfficialClientPath(path.resolve(selected));
  publishLauncherState({
    phase: 'ready',
    exePath: path.resolve(selected),
    message: 'Official client selected. Click Launch & Attach.',
  });
  return launcherState;
}

async function ensureInjected() {
  if (!cdpSession) return false;
  const now = Date.now();
  if (now < nextInjectionCheck) return true;
  nextInjectionCheck = now + 1_000;
  const installed = await cdpSession.evaluate('Boolean(window.__chronopilotApi)');
  if (installed) return true;
  await cdpSession.evaluate(`${INJECT_SOURCE}\n//# sourceURL=chronopilot-injected.js`);
  return true;
}

async function sendCommand(command) {
  if (!cdpSession) return false;
  const encoded = JSON.stringify(command);
  try {
    return Boolean(await cdpSession.evaluate(`window.__chronopilotApi?.command(${encoded}) ?? false`));
  } catch {
    return false;
  }
}

async function pollSnapshot() {
  if (snapshotInFlight || isQuitting) return;
  snapshotInFlight = true;
  try {
    if (!cdpSession) {
      publishSnapshot({ ready: false });
      return;
    }
    await ensureInjected();
    const snapshot = await cdpSession.evaluate(
      'window.__chronopilotApi?.snapshot() ?? { ready: false }',
    );
    publishSnapshot(snapshot && typeof snapshot === 'object' ? snapshot : { ready: false });
    if (snapshot?.ready && launcherState.phase === 'attached') {
      publishLauncherState({ message: 'Connected to the official game world.' });
    }
  } catch {
    publishSnapshot({ ready: false });
    nextInjectionCheck = 0;
  } finally {
    snapshotInFlight = false;
  }
}

function scheduleSnapshotPoll(delayMs = 0) {
  if (snapshotTimer) clearTimeout(snapshotTimer);
  if (isQuitting) return;
  snapshotTimer = setTimeout(async () => {
    snapshotTimer = null;
    await pollSnapshot();
    const visible = controlWindow && !controlWindow.isDestroyed() && controlWindow.isVisible();
    scheduleSnapshotPoll(visible ? VISIBLE_SNAPSHOT_MS : HIDDEN_SNAPSHOT_MS);
  }, delayMs);
}

function showControlWindow() {
  if (!controlWindow || controlWindow.isDestroyed()) return;
  if (controlWindow.isMinimized()) controlWindow.restore();
  controlWindow.show();
  controlWindow.focus();
  scheduleSnapshotPoll(0);
}

function toggleControlWindow() {
  if (!controlWindow || controlWindow.isDestroyed()) return;
  if (controlWindow.isVisible()) controlWindow.hide();
  else showControlWindow();
}

function createControlWindow() {
  controlWindow = new BrowserWindow({
    title: 'ChronoPilot Official Launcher',
    ...savedControlBounds(),
    minWidth: 410,
    minHeight: 620,
    backgroundColor: '#090b13',
    autoHideMenuBar: true,
    webPreferences: safeControlPreferences(),
  });
  controlWindow.setMenuBarVisibility(false);
  void controlWindow.loadFile(path.join(__dirname, 'control.html'));
  controlWindow.on('move', saveControlBounds);
  controlWindow.on('resize', saveControlBounds);
  controlWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      controlWindow.hide();
    }
  });
  controlWindow.on('closed', () => { controlWindow = null; });
}

ipcMain.handle('chronopilot-command', (event, command) => {
  if (!controlWindow || event.sender !== controlWindow.webContents) return false;
  if (!command || !['start', 'stop', 'toggle', 'update-setting', 'update-settings'].includes(command.type)) return false;
  return sendCommand(command).finally(() => scheduleSnapshotPoll(0));
});
ipcMain.handle('chronopilot-launcher-get', (event) => {
  if (!controlWindow || event.sender !== controlWindow.webContents) return null;
  return launcherState;
});
ipcMain.handle('chronopilot-launcher-browse', (event) => {
  if (!controlWindow || event.sender !== controlWindow.webContents) return null;
  return browseOfficialClient();
});
ipcMain.handle('chronopilot-launcher-start', (event) => {
  if (!controlWindow || event.sender !== controlWindow.webContents) return false;
  return launchAndAttach();
});
ipcMain.on('chronopilot-control-ready', (event) => {
  if (!controlWindow || event.sender !== controlWindow.webContents) return;
  event.sender.send('chronopilot-snapshot', lastSnapshot);
  event.sender.send('chronopilot-launcher-state', launcherState);
});
ipcMain.on('chronopilot-control-pin', (event, enabled) => {
  if (controlWindow && event.sender === controlWindow.webContents) {
    controlWindow.setAlwaysOnTop(Boolean(enabled), 'floating');
  }
});
ipcMain.on('chronopilot-control-hide', (event) => {
  if (controlWindow && event.sender === controlWindow.webContents) controlWindow.hide();
});

app.setAppUserModelId('com.chronopilot.launcher');
const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', showControlWindow);
  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    // Old ChronoPilot builds registered the game's login protocol. The official
    // client must own that callback now, because it owns authentication.
    try { app.removeAsDefaultProtocolClient('worldofclaudecraft'); } catch { /* optional cleanup */ }
    createControlWindow();
    scheduleSnapshotPoll(0);
    globalShortcut.register('F10', toggleControlWindow);
    const exePath = await detectOfficialClient();
    if (exePath && !isQuitting) void launchAndAttach();
    app.on('activate', showControlWindow);
  });
}

app.on('before-quit', () => {
  isQuitting = true;
  launchToken += 1;
  if (snapshotTimer) clearTimeout(snapshotTimer);
  snapshotTimer = null;
  closeCdpSession();
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
