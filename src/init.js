function init() {

    loadMenu();

}

function loadMenu() {
    // Initialize camera with proper aspect ratio
    const canvas = document.getElementById('c');
    const aspectRatio = canvas.width / canvas.height;
    Camera.main.displayHeight = 25;
    Camera.main.displayWidth = 25 * aspectRatio;

    const car = new SceneNode();
    car.translation = [0, -25, -80];
    car.scale = [5, 5, 5];
    car.update = () => {
        
    }
    //car.translation
    car.addMesh(["models/car.fbx"]);
    
    //First layer booster
    car.update = () => {
        car.rotate(0, 0.025, 0);
        const booster1 = car.getChildByMesh("booster_1");
        
        if(booster1) {
            const a = 0.05;
            const f = 8;
            const vibration = a * Math.sin(2 * Math.PI * performance.now() * f / 1000);

            const scale = vibration + 1;
            
            booster1.scale = [scale, scale, scale];
        }
        //Second layer booster
        const booster2 = car.getChildByMesh("booster_2");
        if(booster2) {
            const a = 0.05;
            const f = 8;
            const vibration = a * Math.sin(2 * Math.PI * performance.now() * f / 1000);

            const scale = vibration + 1;
            booster2.scale = [scale, scale, scale];
        }
    }
        


    const backdrop = new SceneNode();
    backdrop.addMesh(["models/backdrop.fbx"]);
    backdrop.translation = [0, -35, -80]
    backdrop.scale = [0.2, 0.2, 0.2];

    const background = new SceneNode();
    background.addMesh(["models/menubackground.fbx"]);
    background.translation = [0, -20, -80];
    background.scale = [2, 2, 2];
    background.update = () => {
        const factor = 0.0625;
        background.rotate(0.05 * factor, 0.025 * factor, 0.0125 * factor);
    };
    
    const b1 = new UIPanel(0, 0, 16, 4, ["textures/connect_button_0.png", "textures/connect_button_1.png"]);
    b1.whenClicked = function() {

        Client.onOpen = (e) => {
            loadLobby();
        };
        
        Client.connect();
        connectingScreen();
    };
    b1.update = function() {
        if(this.mouseHovering) {
            this.textureIndex = 1;
        } else {
            this.textureIndex = 0;
        }

        // if (currentGamepad.isHeld("A")) {
        //     b1.whenClicked();
        // }
    }
    UILayer.push(b1);

    sceneGraph.root.addChild(car);
    sceneGraph.root.addChild(backdrop);
    sceneGraph.root.addChild(background);
}

function connectingScreen() {
    UILayer = [];
    UILayer.push(new UIPanel(0, 0, 3*4, 3, ["textures/connecting.png"]));
}

function loadLobby() {
    UILayer = [];
    const idToUIPanel = new Map();

    Client.onMessage = (e) => {
        const m = JSON.parse(e.data);

        /*
            If freshly joining lobby.
        */
        if(m.type == "set_id") {
            const id = m.id;
            const stripHeight = 5;
            const playerStrip = new UIPanel(0,12 - stripHeight/2 - (id - 1) * stripHeight, stripHeight * 4, stripHeight, [`textures/player_${id}.png`, 'textures/you.png']);
            let frameCounter = 0;
            playerStrip.update = function() {
                frameCounter++;
                const timePassed = frameCounter / UPDATES_PER_SECOND;
                if(timePassed % 2 == 0) {
                    //Every even second
                    this.textureIndex = this.textureIndex ? 0 : 1;
                }
            }

            idToUIPanel.set(id, playerStrip);
            UILayer.unshift(playerStrip);
        }

        if(m.type == "lobby_state") {
            m.ids.forEach((id) => {
                    const stripHeight = 5;
                    const playerStrip = new UIPanel(0,12 - stripHeight/2 - (id - 1) * stripHeight, stripHeight * 4, stripHeight, [`textures/player_${id}.png`]);
                    idToUIPanel.set(id, playerStrip);
                    UILayer.unshift(playerStrip);
            });
        }

        /* If other players join lobby. */

        if(m.type == "lobby_update_player_connected") {
            const id = m.id;
            const stripHeight = 5;
            const playerStrip = new UIPanel(0,12 - stripHeight/2 - (id - 1) * stripHeight, stripHeight * 4, stripHeight, [`textures/player_${id}.png`, 'textures/you.png']);
            idToUIPanel.set(id, playerStrip);
            UILayer.unshift(playerStrip);
        }

        if(m.type == "lobby_update_player_disconnected") {
            console.log("player disconnected");
            removeUIPanel(idToUIPanel.get(m.id));
        }

        if(m.type == "initiate_load_track_1") {
            sceneGraph.load(loadTrack1);
        }
        /*
        if(m.type == "lobby_update_player_connected") {
                if(lobbyNum == 0) {
                    //Just joined. Need to populate list   
                    lobbyNum = m.num;
                    for(let i = 0; i < lobbyNum; i++) {
                        const stripHeight = 5;
                        const playerStrip = new UIPanel(0,12 - stripHeight/2 - (i) *stripHeight, stripHeight * 4, stripHeight, [`textures/player_${i + 1}.png`]);
                        UILayer.unshift(playerStrip);
                    } 
                } else {
                    //Only add one player to lobby.
                    lobbyNum++;
                    const stripHeight = 5;
                    const playerStrip = new UIPanel(0,12 - stripHeight/2 - (lobbyNum - 1) *stripHeight, stripHeight * 4, stripHeight, [`textures/player_${lobbyNum}.png`]);
                    UILayer.unshift(playerStrip);
                }
        }
        */
    };

    const lobbyPlayerPanel = new UIPanel(0, 2, 20, 20, ["textures/lobby_players_panel.png"]);
    const beginButton = new UIPanel(5, -11, 3*4, 3, ["textures/begin_button_0.png", "textures/begin_button_1.png"]);
    beginButton.update = function() {
        if(this.mouseHovering) {
            this.textureIndex = 1;
        } else {
            this.textureIndex = 0;
        }

        if (currentGamepad.isPressed("A")) {
            beginButton.whenClicked();
        }
    }
    beginButton.whenClicked = function() {
        if(Client.connected) {
            Client.webSocket.send(JSON.stringify({
                type:"relay_all",
                relay:{
                    type:"initiate_load_track_1"
                }
            }));
        }
    }

    UILayer.push(beginButton);
    UILayer.push(lobbyPlayerPanel);
}


document.addEventListener("click", function () {
    audio.audioContext.resume().then(() => {
        // console.log("Playback resumed successfully");
    });
});
