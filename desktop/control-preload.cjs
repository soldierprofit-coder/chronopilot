const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('chronopilotDesktop', {
  command: (command) => ipcRenderer.invoke('chronopilot-command', command),
  onSnapshot: (callback) => {
    const listener = (_event, snapshot) => callback(snapshot);
    ipcRenderer.on('chronopilot-snapshot', listener);
    return () => ipcRenderer.removeListener('chronopilot-snapshot', listener);
  },
  ready: () => ipcRenderer.send('chronopilot-control-ready'),
  setPinned: (enabled) => ipcRenderer.send('chronopilot-control-pin', Boolean(enabled)),
  hide: () => ipcRenderer.send('chronopilot-control-hide'),
});
