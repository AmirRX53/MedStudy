const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('medStudyDesktop', {
  get: key => ipcRenderer.invoke('storage:get', key),
  set: (key, value) => ipcRenderer.invoke('storage:set', key, value),
  remove: key => ipcRenderer.invoke('storage:remove', key),
  keys: () => ipcRenderer.invoke('storage:keys'),
  export: () => ipcRenderer.invoke('storage:export'),
  import: data => ipcRenderer.invoke('storage:import', data),
  clear: () => ipcRenderer.invoke('storage:clear'),
});
