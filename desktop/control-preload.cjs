const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('chronopilotDesktop', {
  command: (command) => ipcRenderer.invoke('chronopilot-command', command),
  getLauncherState: () => ipcRenderer.invoke('chronopilot-launcher-get'),
  browseGameExe: () => ipcRenderer.invoke('chronopilot-launcher-browse'),
  launchAndAttach: () => ipcRenderer.invoke('chronopilot-launcher-start'),
  onLauncherState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('chronopilot-launcher-state', listener);
    return () => ipcRenderer.removeListener('chronopilot-launcher-state', listener);
  },
  onSnapshot: (callback) => {
    const listener = (_event, snapshot) => callback(snapshot);
    ipcRenderer.on('chronopilot-snapshot', listener);
    return () => ipcRenderer.removeListener('chronopilot-snapshot', listener);
  },
  ready: () => ipcRenderer.send('chronopilot-control-ready'),
  setPinned: (enabled) => ipcRenderer.send('chronopilot-control-pin', Boolean(enabled)),
  hide: () => ipcRenderer.send('chronopilot-control-hide'),
});
