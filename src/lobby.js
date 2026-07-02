/* Deals with the rendering and netcode of the lobby screen
E.g. the screen that shows all the available lobbies and 
the screen once joined a lobby. */

const LOBBIES_PER_PAGE = 10; // Only show 5 lobbies at a time

function loadLobbies() {

    clearUIPanel(); // Removes UI but keeps background

    let selection; // Indicates which lobby listing that has been selected.

    function displayListings(lobbyListings) {
        //Called when lobby listing information is recieved
        const bgX = 0;
        const bgY = 0;
        const bgWidth = 15;
        const bgHeight = 15;
        const bg = new UIPanel(bgX, bgY, bgWidth, bgHeight, ["./textures/menu/lobby_players_panel.png"]);
        bg.z -= 0.1;
        bg.recalculateVertices();
        //Divide into lobbies per page
        const listingHeight = bgHeight / LOBBIES_PER_PAGE;
        const listingWidth = bgWidth;

        for(let i = 0; i < lobbyListings.length; i++) {
            const listing = lobbyListings[i];
            const uiComponent = new UIPanel(bgX, bgY + bgHeight /2 - listingHeight/2 - i * listingHeight , listingWidth, listingHeight, ["./textures/menu/connect_button_bg_0.png", "./textures/menu/connect_button_bg_1.png"]);
            
            uiComponent.addText(`${listing.name}   ${listing.playersCount}/4`);
            uiComponent.transparent = true;
            uiComponent.update = () => {
                uiComponent.textureIndex = uiComponent.mouseHovering || uiComponent.hasFocus ? 1: 0;
            }
            uiComponent.whenClicked = () => {
                selection = lobbyListings[i];
                showJoinButton();
                //console.log(`Selection: ${i}`);
            }
            UILayer.push(uiComponent);
        }

        UILayer.push(bg);
    }

    let joinButtonShown = false;
    let joinButton;
    function showJoinButton() {
        if(!joinButtonShown) {
            joinButtonShown = true;
            joinButton = new UIPanel(5, -9, 8, 2, ["./textures/menu/begin_button_bg_0.png", "./textures/menu/begin_button_bg_1.png"])
            joinButton.addText("Join");
            joinButton.update = () => {
                joinButton.textureIndex = joinButton.mouseHovering ? 1 : 0;
                if(UIPanel.getFocused().length == 0) {
                    hideJoinButton(); // No lobby selected
                }
            }
            joinButton.whenClicked = () => {
                //Need to show username prompt.
                promptUsername();
            };
            UILayer.push(joinButton);
        }
    }
    function hideJoinButton() {
        if(joinButtonShown) {
            joinButtonShown = false;
            removeUIPanel(joinButton);
        }
    }
    
    function promptUsername() {
        clearUIPanel();
        const text = new UIPanel(0, 6, 0, 3);
        text.addText("Enter your username");
        const usernameInput = new UIPanel(0, 0, 15, 3, ["./textures/menu/connect_button_bg_0.png", "./textures/menu/connect_button_bg_1.png"]);
        usernameInput.addTextInput();
        usernameInput.update = () => {
            if(usernameInput.mouseHovering || usernameInput.hasFocus) {
                usernameInput.textureIndex = 0;
            } else {
                usernameInput.textureIndex = 1;
            }
        }

        const goButton = new UIPanel(0, -6, 12, 3, ["./textures/menu/begin_button_bg_0.png", "./textures/menu/begin_button_bg_1.png"])
        goButton.update = () => {
            if(goButton.mouseHovering) {
                goButton.textureIndex = 1;
            } else {
                goButton.textureIndex = 0;
            }
        }
        goButton.whenClicked = () => {
            joinLobby(usernameInput.textContent);
        }
        goButton.addText("Join");
        UILayer.push(text);
        UILayer.push(usernameInput);
        UILayer.push(goButton);
    }

    function joinLobby(username) {
        clearUIPanel();
        Client.send({
            type:"join_lobby",
            lobbyID: selection.lobbyID,
            username: username
        });
        Client.onMessage = (e) => {
            const msg = JSON.parse(e.data);

            if(msg.type == "lobby_join_successful") {
                console.log("joined lobby!");
            } else if(msg.type == "lobby_join_unsuccessful") {
                console.log("failed to join!");
            }
        }

    }

    if(Client.connected) {
        Client.send({
            type:"get_lobby_listings"
        })

        Client.onMessage = (e) => {
            const msg = JSON.parse(e.data);

            switch(msg.type) {
                case "lobby_listings":
                    displayListings(msg.lobbyListings);
                    break;   
            }
        };
    } else {
        console.error("Cannot load load lobbies because no connection to server!");
    }
}