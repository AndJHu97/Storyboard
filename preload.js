const { contextBridge, ipcRenderer } = require('electron');


let writingBridge = {
    preloadCards: (callBack) => ipcRenderer.once("preload-cards", callBack),
    readCards: (passCards) => ipcRenderer.on("read-card-reply", passCards),
    documentOpened: (callBack) => ipcRenderer.on("document-opened", callBack)
}


contextBridge.exposeInMainWorld("writingBridge", writingBridge)

contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer);

