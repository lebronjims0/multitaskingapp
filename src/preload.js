
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  youtubeSearch: (query, pageToken) => ipcRenderer.invoke('youtube-search', query, pageToken),
  openPiP: (videoId) => ipcRenderer.invoke('open-pip', videoId)
});