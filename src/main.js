const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fetch = require('node-fetch'); // If using Node 18+, you can use global fetch

const apiKey = ""; // Replace with your actual key

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'assets', 'assets/icons/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

// --- YouTube Search Handler ---
ipcMain.handle('youtube-search', async (event, query, pageToken = null) => {
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: '10',
      key: apiKey,
    });
    if (pageToken) params.append('pageToken', pageToken);

    const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error && data.error.message ? data.error.message : 'YouTube API error');
    }

    return data;
  } catch (err) {
    return { error: err.message || 'Failed to fetch YouTube data.' };
  }
});

// --- Multiple PiP Windows Handler ---
const pipWindows = new Set();

ipcMain.handle('open-pip', async (event, videoId) => {
  const pipWindow = new BrowserWindow({
    width: 480,
    height: 270,
    alwaysOnTop: true,
    frame: false,
    resizable: true,
    movable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  pipWindow.loadFile(path.join(__dirname, 'pip.html'), {
    query: { videoId }
  });

  pipWindows.add(pipWindow);

  pipWindow.on('closed', () => {
    pipWindows.delete(pipWindow);
  });
});
