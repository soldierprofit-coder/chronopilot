const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  screen,
  shell,
} = require('electron');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');

// Match the performance-oriented official desktop shell where Electron supports it.
app.commandLine.appendSwitch('force-high-performance-gpu');
app.commandLine.appendSwitch('force_high_performance_gpu');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

const GAME_URL = 'https://worldofclaudecraft.com';
const INJECT_SOURCE = readFileSync(
  path.join(__dirname, '..', 'dist-inject', 'chronopilot.js'),
  'utf8',
);

let gameWindow = null;
let controlWindow = null;
let snapshotTimer = null;
let isQuitting = false;
let lastSnapshot = { ready: false };
let pendingLoginCode = null;

function safeGamePreferences() {
  return {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    spellcheck: false,
    backgroundThrottling: false,
    webviewTag: false,
    webSecurity: true,
    allowRunningInsecureContent: false,
    disableBlinkFeatures: 'Autofill',
    preload: path.join(__dirname, 'game-preload.cjs'),
  };
}

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

function statePath() {
  return path.join(app.getPath('userData'), 'control-window.json');
}

function defaultControlBounds() {
  const game = gameWindow?.getBounds() ?? { x: 100, y: 80, width: 1440, height: 900 };
  const width = 450;
  const height = Math.min(820, Math.max(640, game.height - 80));
  return {
    x: game.x + game.width - width - 28,
    y: game.y + 50,
    width,
    height,
  };
}

function savedControlBounds() {
  try {
    const state = JSON.parse(readFileSync(statePath(), 'utf8'));
    if ([state.x, state.y, state.width, state.height].every(Number.isFinite)) {
      const visible = screen.getAllDisplays().some(({ workArea }) => (
        state.x < workArea.x + workArea.width
        && state.x + state.width > workArea.x
        && state.y < workArea.y + workArea.height
        && state.y + state.height > workArea.y
      ));
      if (visible) return state;
    }
  } catch {
    // First launch or an invalid old position: start over the game window.
  }
  return defaultControlBounds();
}

function saveControlBounds() {
  if (!controlWindow || controlWindow.isDestroyed() || controlWindow.isMinimized()) return;
  try {
    writeFileSync(statePath(), JSON.stringify(controlWindow.getBounds()));
  } catch {
    // Remembering the cosmetic window position is optional.
  }
}

function injectChronoPilot(targetWindow) {
  void targetWindow.webContents.executeJavaScript(INJECT_SOURCE, true).catch((error) => {
    console.error('ChronoPilot injection failed:', error);
  });
}

function openDesktopLogin() {
  void shell.openExternal(new URL('/desktop-login', GAME_URL).toString());
}

function deliverLoginCode(code) {
  pendingLoginCode = code;
  if (!gameWindow || gameWindow.isDestroyed()) return;
  gameWindow.webContents.send('desktop-login-code', code);
  if (gameWindow.isMinimized()) gameWindow.restore();
  gameWindow.show();
  gameWindow.focus();
}

function handleDeepLink(value) {
  if (typeof value !== 'string') return;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return;
  }
  if (parsed.protocol !== 'worldofclaudecraft:' || parsed.hostname !== 'desktop-login') return;
  const code = parsed.searchParams.get('code');
  if (code) deliverLoginCode(code);
}

async function sendCommand(command) {
  if (!gameWindow || gameWindow.isDestroyed()) return false;
  const encoded = JSON.stringify(command);
  return gameWindow.webContents.executeJavaScript(
    `window.__chronopilotApi?.command(${encoded}) ?? false`,
    true,
  );
}

async function pollSnapshot() {
  if (!gameWindow || gameWindow.isDestroyed()) return;
  try {
    lastSnapshot = await gameWindow.webContents.executeJavaScript(
      'window.__chronopilotApi?.snapshot() ?? { ready: false }',
      true,
    );
  } catch {
    lastSnapshot = { ready: false };
  }
  if (controlWindow && !controlWindow.isDestroyed()) {
    controlWindow.webContents.send('chronopilot-snapshot', lastSnapshot);
  }
}

function showControlWindow() {
  if (!controlWindow || controlWindow.isDestroyed()) return;
  controlWindow.show();
  controlWindow.focus();
}

function toggleControlWindow() {
  if (!controlWindow || controlWindow.isDestroyed()) return;
  if (controlWindow.isVisible()) controlWindow.hide();
  else showControlWindow();
}

function createControlWindow() {
  const bounds = savedControlBounds();
  controlWindow = new BrowserWindow({
    title: 'ChronoPilot Controls',
    ...bounds,
    minWidth: 390,
    minHeight: 600,
    backgroundColor: '#090b13',
    autoHideMenuBar: true,
    parent: gameWindow,
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

function createGameWindow() {
  gameWindow = new BrowserWindow({
    title: 'World of ClaudeCraft — ChronoPilot',
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#10121c',
    autoHideMenuBar: true,
    webPreferences: safeGamePreferences(),
  });
  Menu.setApplicationMenu(null);
  gameWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Keep authentication in the game window; open unrelated links in the default browser.
    if (url.startsWith('https://worldofclaudecraft.com')) return { action: 'allow' };
    void shell.openExternal(url);
    return { action: 'deny' };
  });
  gameWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || input.isAutoRepeat) return;
    const configured = lastSnapshot?.settings?.safety?.toggleHotkey;
    if (typeof configured !== 'string' || configured.length < 1) return;
    if (String(input.key).toLowerCase() !== configured.toLowerCase()) return;
    event.preventDefault();
    void sendCommand({ type: 'toggle' });
  });
  gameWindow.webContents.on('did-finish-load', () => injectChronoPilot(gameWindow));
  void gameWindow.loadURL(GAME_URL);
  gameWindow.on('closed', () => {
    gameWindow = null;
    isQuitting = true;
    if (controlWindow && !controlWindow.isDestroyed()) controlWindow.destroy();
    app.quit();
  });
  createControlWindow();
}

ipcMain.handle('chronopilot-command', (event, command) => {
  if (!controlWindow || event.sender !== controlWindow.webContents) return false;
  if (!command || !['start', 'stop', 'toggle', 'update-setting', 'update-settings'].includes(command.type)) return false;
  return sendCommand(command);
});
ipcMain.handle('desktop-login-open-browser', (event) => {
  if (!gameWindow || event.sender !== gameWindow.webContents) return null;
  openDesktopLogin();
  return null;
});
ipcMain.handle('desktop-login-take-code', (event) => {
  if (!gameWindow || event.sender !== gameWindow.webContents) return null;
  const code = pendingLoginCode;
  pendingLoginCode = null;
  return code;
});
ipcMain.on('chronopilot-control-ready', (event) => {
  if (controlWindow && event.sender === controlWindow.webContents) {
    event.sender.send('chronopilot-snapshot', lastSnapshot);
  }
});
ipcMain.on('chronopilot-control-pin', (event, enabled) => {
  if (controlWindow && event.sender === controlWindow.webContents) {
    controlWindow.setAlwaysOnTop(Boolean(enabled), 'floating');
  }
});
ipcMain.on('chronopilot-control-hide', (event) => {
  if (controlWindow && event.sender === controlWindow.webContents) controlWindow.hide();
});

app.setAppUserModelId('com.chronopilot.lazyclient');
const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('worldofclaudecraft', process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient('worldofclaudecraft');
  }
  for (const argument of process.argv) handleDeepLink(argument);
  app.on('second-instance', (_event, argv) => {
    for (const argument of argv) handleDeepLink(argument);
    if (gameWindow && !gameWindow.isDestroyed()) {
      if (gameWindow.isMinimized()) gameWindow.restore();
      gameWindow.show();
      gameWindow.focus();
    }
  });
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleDeepLink(url);
  });
  app.whenReady().then(() => {
    createGameWindow();
    snapshotTimer = setInterval(() => { void pollSnapshot(); }, 250);
    globalShortcut.register('F10', toggleControlWindow);
    app.on('activate', () => {
      if (!gameWindow) createGameWindow();
      else showControlWindow();
    });
  });
}

app.on('before-quit', () => {
  isQuitting = true;
  if (snapshotTimer) clearInterval(snapshotTimer);
  snapshotTimer = null;
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
