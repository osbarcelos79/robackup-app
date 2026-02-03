const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),

    // Dialogs
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    selectLogFile: (save = false) => ipcRenderer.invoke('select-log-file', save),

    // Robocopy
    executeRobocopy: (args) => ipcRenderer.invoke('execute-robocopy', args),
    cancelRobocopy: () => ipcRenderer.invoke('cancel-robocopy'),
    isRobocopyRunning: () => ipcRenderer.invoke('is-robocopy-running'),

    // Robocopy event listeners
    onRobocopyOutput: (callback) => {
        const handler = (event, data) => callback(data);
        ipcRenderer.on('robocopy-output', handler);
        return () => ipcRenderer.removeListener('robocopy-output', handler);
    },
    onRobocopyComplete: (callback) => {
        const handler = (event, data) => callback(data);
        ipcRenderer.on('robocopy-complete', handler);
        return () => ipcRenderer.removeListener('robocopy-complete', handler);
    },
    onRobocopyError: (callback) => {
        const handler = (event, data) => callback(data);
        ipcRenderer.on('robocopy-error', handler);
        return () => ipcRenderer.removeListener('robocopy-error', handler);
    },

    // Profiles
    saveProfile: (name, config) => ipcRenderer.invoke('save-profile', { name, config }),
    loadProfile: (name) => ipcRenderer.invoke('load-profile', name),
    getProfiles: () => ipcRenderer.invoke('get-profiles'),
    deleteProfile: (name) => ipcRenderer.invoke('delete-profile', name),

    // External
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    openFolder: (path) => ipcRenderer.invoke('open-folder', path),
});
