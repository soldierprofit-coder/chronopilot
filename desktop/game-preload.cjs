const { contextBridge, ipcRenderer } = require('electron');

// The live game recognizes this narrow bridge as the official desktop login flow.
// Credentials remain in the player's normal browser; only a short-lived login code
// returns to the client through the worldofclaudecraft:// callback.
contextBridge.exposeInMainWorld('wocDesktop', {
  openBrowserLogin: () => ipcRenderer.invoke('desktop-login-open-browser'),
  takeLoginCode: () => ipcRenderer.invoke('desktop-login-take-code'),
  onLoginCode: (callback) => {
    const listener = (_event, code) => callback(code);
    ipcRenderer.on('desktop-login-code', listener);
    return () => ipcRenderer.removeListener('desktop-login-code', listener);
  },
});
