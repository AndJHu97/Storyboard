const { contextBridge, ipcRenderer } = require('electron');


let writingBridge = {
    readCards: (passCards) => ipcRenderer.on("read-card-reply", passCards),
    documentOpened: (callBack) => ipcRenderer.on("document-opened", callBack)
}


contextBridge.exposeInMainWorld("writingBridge", writingBridge)

contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer);

