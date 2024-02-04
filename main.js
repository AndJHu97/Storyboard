const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');

const fs = require('fs');
const path = require('path');
const url = require('url');

// Add the following line at the top
require('electron-reload')(__dirname);
const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';



const createWindow = () => {
    const win = new BrowserWindow({
        width: isDev? 1600 : 800,
        height: 600,
        webPreferences:{
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    //open devtools if in dev env
    if(isDev){
        win.webContents.openDevTools();
    }


    win.loadFile(path.join(__dirname, 'TextEditor', 'writing.html'));
     // Open the window in full screen
     win.maximize();
      // Add the following line to retain focus
    win.show();

    
      

}



app.whenReady().then(() => {
    createWindow();

    app.on('activate', () =>{
        if(BrowserWindow.getAllWindows().length === 0){
            createWindow();
        }
    })

   

});

app.on('window-all-closed', () =>{
    if(process.platform !== 'darwin') app.quit()})

app.on('window-all-closed', () =>{
    if(!isMac) app.quit()})



//Card events below
ipcMain.on('load-cards', (event,{}) => {
    const cardsDirectory = path.join(app.getPath('userData'), 'CardFiles');
    const cardFiles = fs.readdirSync(cardsDirectory);

    event.reply('preload-cards', { cardFiles });
});

ipcMain.on('save-card', (event, { cardId, sourceStartIndex, sourceEndIndex, responseStartIndex, responseEndIndex, source, response }) => {
    const filePath = getCardFilePath(cardId);
    //update file if already exist
    if(fs.existsSync(filePath))
    {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const currentData = JSON.parse(fileContent);
        const currentSource = currentData.source;
        const currentResponse = currentData.response;
        const currentSourceStartIndex = currentData.sourceStartIndex;
        const currentSourceEndIndex = currentData.sourceEndIndex;
        const currentResponseStartIndex = currentData.responseStartIndex;
        const currentResponseEndIndex = currentData.responseEndIndex;

        //If it is updating source
        if(source != null)
        {
            response = currentResponse;
            responseStartIndex = currentResponseStartIndex;
            responseEndIndex = currentResponseEndIndex;
            
        //updating response
        }else if(response != null)
        {
            source = currentSource;
            sourceStartIndex = currentSourceStartIndex;
            sourceEndIndex = currentSourceEndIndex;
            //card already created but not on screen (loading cards)
        }else{
            sourceStartIndex = currentSourceStartIndex;
            sourceEndIndex = currentSourceEndIndex;
            source = currentSource;
            responseStartIndex = currentResponseStartIndex;
            responseEndIndex = currentResponseEndIndex;
            response = currentResponse;
        }
    }
    
    const data = {sourceStartIndex, sourceEndIndex, responseStartIndex, responseEndIndex, source,response};
   
    fs.writeFileSync(filePath, JSON.stringify(data));  
});

ipcMain.on('read-card', (event, {cardId}) => {
    const filePath = getCardFilePath(cardId);
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        event.reply('read-card-reply', fileContent);
    } catch (error) {
        console.error('Error reading file:', error.message);
        event.reply('read-card-reply', null);
    }
});

function getCardFilePath(cardId) {
// Define the path logic for your card files
console.log(app.getPath('userData', 'CardFiles'));
const cardsDirectory = path.join(app.getPath('userData'), 'CardFiles');
return path.join(cardsDirectory, `card_${cardId}.txt`);
}