const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');

const fs = require('fs');
const path = require('path');
const url = require('url');

// Add the following line at the top
require('electron-reload')(__dirname);
const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

//the current document 
let documentLoaded = {
    quillText: {
        ops: []
    },
    cardInfo: []
}

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: isDev? 1600 : 800,
        height: 600,
        webPreferences:{
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    //open devtools if in dev env
    if(isDev){
        mainWindow.webContents.openDevTools();
    }


    mainWindow.loadFile(path.join(__dirname, 'TextEditor', 'writing.html'));
     // Open the window in full screen
     mainWindow.maximize();
      // Add the following line to retain focus
    mainWindow.show();
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



ipcMain.on('save-card', (event, { cardId, sourceStartIndex, sourceEndIndex, responseStartIndex, responseEndIndex, source, response }) => {
    // Find the index of the card in the cardInfo array
    const indexToUpdate = documentLoaded.cardInfo.findIndex(card => card.id === cardId);
    
    //update file if already exist
    if(indexToUpdate !== -1)
    {
       
        const documentCardInfo = getCardInfoById(cardId);
        const currentSource = documentCardInfo.source;
        const currentResponse = documentCardInfo.response;
        const currentSourceStartIndex = documentCardInfo.sourceStartIndex;
        const currentSourceEndIndex = documentCardInfo.sourceEndIndex;
        const currentResponseStartIndex = documentCardInfo.responseStartIndex;
        const currentResponseEndIndex = documentCardInfo.responseEndIndex;

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

        // Create a new card object with the provided variables
        const newCard = {
            sourceStartIndex,
            sourceEndIndex,
            responseStartIndex,
            responseEndIndex,
            source,
            response
        };

        // Push the new card object to the cardInfo array
        documentLoaded.cardInfo[indexToUpdate] = newCard;
        return;
    }
    
    //if not updating and creating a new card
    // Create a new card object with the provided variables
    const newCard = {
        sourceStartIndex,
        sourceEndIndex,
        responseStartIndex,
        responseEndIndex,
        source,
        response
    };

    // Push the new card object to the cardInfo array
    documentLoaded.cardInfo.push(newCard);
});


let openedFilePath;
//Save As
ipcMain.on('save-as-document', (_, quillContent) =>{
    // Show save dialog to choose the file path
    dialog.showSaveDialog({
        title: 'Save Document',
        defaultPath: 'document.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
    }).then(({ filePath }) => {
        // Check if filePath is defined (user clicked save)
        if (filePath) {
            // Save the quill content to the chosen file path
            // Write quillContent to the filePath using fs.writeFile 
            openedFilePath = filePath;
            documentLoaded.quillText = quillContent;
            fs.writeFile(filePath, JSON.stringify(documentLoaded,null,2), 'utf-8', (err) => {
                if (err) {
                    console.error('Error saving document:', err);
                } else {
                    console.log('Document saved successfully.');
                }
            });

        }
    }).catch(err => {
        console.error('Error saving document:', err);
    });
});

ipcMain.on("open-document",(_,{})=>{
    dialog.showOpenDialog({
        properties: ['openFile'], // Allow only selecting files
        filters: [{ name: 'JSON Files', extensions: ['json'] }] // Allow only JSON files
    }).then(result => {
        // Check if the user selected a file
        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            openedFilePath = filePath;
            fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err) {
                    console.error('Error reading file:', err);
                    // Handle error
                } else {
                    //update docuemntLoaded
                    const documentData = JSON.parse(data);
                    documentLoaded.quillText = documentData.quillContent;
                    documentLoaded.cardInfo = documentData.cardInfo;
                    // Send the JSON data to renderer process or do something with it
                    mainWindow.webContents.send('document-opened', data);
                }
            });
        }
    }).catch(err => {
        console.error('Error while showing open dialog:', err);
    });
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

function saveDocumentToFile() {
    // Write the documentLoaded object to a file
    fs.writeFileSync(openedFilePath, JSON.stringify(documentLoaded, null, 2));
}