const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let currentProcess = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../public/icon.png'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Window controls
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

// Folder dialog
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

// File dialog for log file
ipcMain.handle('select-log-file', async (event, save = false) => {
  if (save) {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'robocopy.log',
      filters: [
        { name: 'Log Files', extensions: ['log', 'txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result.canceled ? null : result.filePath;
  } else {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Log Files', extensions: ['log', 'txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result.canceled ? null : result.filePaths[0];
  }
});

// Execute robocopy
ipcMain.handle('execute-robocopy', async (event, args) => {
  return new Promise((resolve, reject) => {
    if (currentProcess) {
      reject(new Error('Um processo já está em execução'));
      return;
    }

    console.log('Executing robocopy with args:', args);

    currentProcess = spawn('robocopy', args, {
      shell: true,
      windowsHide: true,
    });

    currentProcess.stdout.on('data', (data) => {
      const text = data.toString('utf8');
      mainWindow?.webContents.send('robocopy-output', { type: 'stdout', data: text });
    });

    currentProcess.stderr.on('data', (data) => {
      const text = data.toString('utf8');
      mainWindow?.webContents.send('robocopy-output', { type: 'stderr', data: text });
    });

    currentProcess.on('close', (code) => {
      currentProcess = null;
      // Robocopy exit codes: 0-7 are success/info, 8+ are errors
      const success = code !== null && code < 8;
      mainWindow?.webContents.send('robocopy-complete', { code, success });
      resolve({ code, success });
    });

    currentProcess.on('error', (err) => {
      currentProcess = null;
      mainWindow?.webContents.send('robocopy-error', err.message);
      reject(err);
    });
  });
});

// Cancel robocopy
ipcMain.handle('cancel-robocopy', async () => {
  if (currentProcess) {
    currentProcess.kill('SIGTERM');
    currentProcess = null;
    return true;
  }
  return false;
});

// Get robocopy running status
ipcMain.handle('is-robocopy-running', async () => {
  return currentProcess !== null;
});

// Save profile
const getProfilesPath = () => {
  const userDataPath = app.getPath('userData');
  const profilesPath = path.join(userDataPath, 'profiles');
  if (!fs.existsSync(profilesPath)) {
    fs.mkdirSync(profilesPath, { recursive: true });
  }
  return profilesPath;
};

ipcMain.handle('save-profile', async (event, { name, config }) => {
  const filePath = path.join(getProfilesPath(), `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
  return true;
});

ipcMain.handle('load-profile', async (event, name) => {
  const filePath = path.join(getProfilesPath(), `${name}.json`);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
  return null;
});

ipcMain.handle('get-profiles', async () => {
  const profilesPath = getProfilesPath();
  const files = fs.readdirSync(profilesPath);
  return files
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));
});

ipcMain.handle('delete-profile', async (event, name) => {
  const filePath = path.join(getProfilesPath(), `${name}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
});

// Open external link
ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url);
});

// Open folder in explorer
ipcMain.handle('open-folder', async (event, folderPath) => {
  if (fs.existsSync(folderPath)) {
    shell.openPath(folderPath);
    return true;
  }
  return false;
});
