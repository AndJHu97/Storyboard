
let quill;
    let toolbaroptions = [
        // Your toolbar options here
    ];
    


document.addEventListener('DOMContentLoaded', () => {
    // Initialize Quill when the DOM is ready
    quill = new Quill('#editor-container', {
        modules: {
            toolbar: toolbaroptions,
        },
        theme: 'snow',
    });

    const saveAsButton = document.getElementById("saveAsDocument");
    const openDocButton = document.getElementById("openDocument");
    
    saveAsButton.addEventListener('click', () =>{
        ipcRenderer.send("save-as-document", quill.getContents());
    })

    //open document
    openDocButton.addEventListener('click', () =>{
        ipcRenderer.send("open-document",{});
    })

    window.writingBridge.documentOpened((_, jsonDocData) =>{
        const jsonData = JSON.parse(jsonDocData);
        const quillText = jsonData.quillText;
        const cardInfos = jsonData.cardInfo;
        quill.setContents(quillText);
        cardInfos.forEach((cardInfo) =>{
            let cardId = cardInfo.id;
            console.log("card id writing bridge: " + cardId);
            createNewCards(cardId);
            
        });
    });

    //CURRENTLY WORKING HERE TO CHECK CHANGE
    let characterCount = 0;
    let firstDetect = true;
    let startIndex = 0;
    let textLength = 3;
    quill.on('text-change', (delta, oldDelta, source) => {
        
        if (source === 'user') {
            
            const cursorPosition = quill.getSelection().index;
            // Iterate through delta.ops to get information about the edits
            delta.ops.forEach(op => {
                if (op.insert) {
                    // Inserted content
                    console.log(`Inserted: "${op.insert}" at index ${cursorPosition}`);
                    characterCount += op.insert.length;
                    //Don't know why cursorposition is outputting 1 more than what it should be but delete works as it should. So I added cursorPosition - 1
                    //If add text before the startIndex
                    if(cursorPosition - 1 <= startIndex - 1)
                    {
                        //add the amount typed
                        startIndex += op.insert.length;
                    
                    //if you add in text at the beginning of comment to extend the comments
                    }else if(cursorPosition - 1 == startIndex && !firstDetect)
                    {
                        textLength += op.insert.length;
                    }
                } else if (op.delete) {
                    // Deleted content
                    console.log(`Deleted: ${op.delete} characters at index ${cursorPosition}`);
                    characterCount -= op.delete;
                    if(cursorPosition <= startIndex - 1)
                    {
                        startIndex -= op.delete;
                    }
                }
            });

            console.log(`Cursor is at index: ${cursorPosition}`);

            if(characterCount > 0)
            {
                quill.formatText(0, characterCount - 1, { 'background-color': false });
            }
  
            if(characterCount >= 11)
            {
                //TEST: Pretend there's a comment at index 5
                if(firstDetect)
                {
                    startIndex = 5;
                    firstDetect = false;
                }
                quill.formatText(startIndex, textLength, { 'background-color': 'yellow' });
            }
        }

       
      });
      
      


    //get readCards from main
    window.writingBridge.readCards((event, data) => {
        if (data) {
            console.log(data);// Do something with the retrieved data (e.g., update UI)
        } else {
        }
    });
   
    
    // Example: Create cards
    const createCards = document.getElementById('create-cards');
    const cardContainer = document.getElementById('cards-row');

    createCards.addEventListener('click', () => {
        // Get all elements with the class name 'dropdown-container' within cardContainer
       const cardsNumber = cardContainer.getElementsByClassName('dropdown-container');
       //get the amount of cards already created
       let cardId = cardsNumber.length; // Variable to track the number of created cards
       createNewCards(cardId); 
    });


    function createNewCards(cardId){
          // Create a container for the button and its dropdown
          const buttonContainer = document.createElement('div');
          buttonContainer.className = 'dropdown-container';
  
          // Create the button
          const newButton = document.createElement('button');
          newButton.textContent = 'Card';
          newButton.className = 'card';
  
          //cardID
         
          newButton.setAttribute('data-card-id', cardId);
          cardId++;
          
          ipcRenderer.send("save-card", {
              cardId: getCardId(newButton),
              sourceStartIndex: null,
              sourceEndIndex: null,
              responseStartIndex: null,
              responseEndIndex: null,
              source: null,
              response: null,
          });
          
          // Create the dropdown content
          const dropdownContent = document.createElement('div');
          dropdownContent.className = 'dropdown-content';
          dropdownContent.innerHTML = `
              <a data-value="Source">Source</a>
              <a data-value="Response">Response</a>
          `;
  
          // Append the button and dropdown content to the container
          buttonContainer.appendChild(newButton);
          buttonContainer.appendChild(dropdownContent);
          // Append the container to the row
          cardContainer.appendChild(buttonContainer);
  
          // Add event listeners for hovering and option selection
          buttonContainer.addEventListener('mouseenter', () => {
              dropdownContent.style.display = 'block';
          });
  
          buttonContainer.addEventListener('mouseleave', () => {
              dropdownContent.style.display = 'none';
          });
  
          //source and response clicks and saves the start and end index
          dropdownContent.addEventListener('click', (event) => {
              //click only on the anchor source and response
              if (event.target.tagName === 'A') {
                  const selectedOption = event.target.getAttribute('data-value');
                  
                  // Check the selected option and perform actions accordingly
                  if (selectedOption === 'Source' || selectedOption === 'Response') {
                  // Get the highlighted text
                  const range = quill.getSelection();
                  const selectedText = quill.getText(range.index, range.length);
                  if(selectedOption === 'Source')
                  {
                      ipcRenderer.send("save-card", {
                          cardId: getCardId(newButton),
                          sourceStartIndex: range.index,
                          sourceEndIndex: range.index + range.length,
                          responseStartIndex: null,
                          responseEndIndex: null, 
                          source: selectedText,
                          response: null,
                      });
                  }
                  
                  if(selectedOption === 'Response')
                  {
                      //save to main
                      ipcRenderer.send("save-card", {
                          cardId: getCardId(newButton),
                          sourceStartIndex: null,
                          sourceEndIndex: null,
                          responseStartIndex: range.index,
                          responseEndIndex: range.index + range.length,
                          source: null,
                          response: selectedText,
                      });
                  }
  
  
                  // Perform actions based on the selected option and highlighted text
                  alert(`You selected: ${selectedOption}\nHighlighted Text: ${selectedText}`);
                  }
              }
          });
  
          //read card file and display content
          newButton.addEventListener('click', (event) => {
              console.log(getCardId(newButton));
              ipcRenderer.send('read-card', { cardId: getCardId(newButton) });
          });

    }

    function getCardId(card)
    {
        return card.getAttribute("data-card-id");
    }

    
});

   
