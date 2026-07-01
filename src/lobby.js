/* Deals with the rendering and netcode of the lobby screen
E.g. the screen that shows all the available lobbies and 
the screen once joined a lobby. */

const LOBBIES_PER_PAGE = 10; // Only show 5 lobbies at a time

function loadLobbies() {

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
                showJoinButton();
                console.log(`Selection: ${i}`);
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
            UILayer.push(joinButton);
        }
    }
    function hideJoinButton() {
        if(joinButtonShown) {
            joinButtonShown = false;
            removeUIPanel(joinButton);
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