const { contextBridge, ipcRenderer } = require('electron');


let writingBridge = {
    preloadCards: (callBack) => ipcRenderer.once("preload-cards", callBack),
    readCards: (passCards) => ipcRenderer.on("read-card-reply", passCards)
}


contextBridge.exposeInMainWorld("writingBridge", writingBridge)

contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer);

