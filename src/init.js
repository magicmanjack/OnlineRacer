const uiStartXPos = 15;

function init() {
    ignitionScreen();

}

function ignitionScreen() {
    //Need to call menu after click
    const ignitionBarrel = new UIPanel(0, 0, 10, 10, ["textures/menu/ignition_0.png", "textures/menu/ignition_1.png", "textures/menu/ignition_2.png"]);
    UILayer.push(ignitionBarrel);
    ignitionBarrel.transparent = true;
    ignitionBarrel.update = function() {
        if(this.mouseHovering) {
            this.textureIndex = 1;
        } else {
            this.textureIndex = 0;
        }
    }
    ignitionBarrel.whenClicked = function() {
        this.textureIndex = 2;
        let ticks = 0;
        ignitionBarrel.update = () => {
            ticks++;
            if(ticks/updatesPerSecond == 2) {
                sceneGraph.reset();
                loadMenu();
            }
        }
    }
}

function loadAudioSettings() {
    const volumeControl = document.querySelector("#volume");

    if (volumeControl !== null) {
        volumeControl.value = localStorage.getItem("volume");
    }
}



function loadMenu() {
    loadAudioSettings();
    // Initialize camera with proper aspect ratio

    const menuMusicEle = audio.loadAudio("sounds/menu_music.mp3");
    menuMusicEle.play(true);
    const canvas = document.getElementById('c');
    const aspectRatio = canvas.width / canvas.height;
    Camera.main.displayHeight = 25;
    Camera.main.displayWidth = 25 * aspectRatio;

    const propXLoc = -37.5;
    const carYLoc = -10;

    const car = new SceneNode();
    car.translation = [propXLoc, carYLoc, -80];
    car.scale = [5, 5, 5];
    car.update = () => {
        
    }
    //car.translation
    car.addMesh(["models/car/car.fbx"]);
    
    //1st layer booster
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
    backdrop.addMesh(["models/menu/backdrop.fbx"]);
    backdrop.translation = [propXLoc, carYLoc - 10, -80]
    backdrop.scale = [0.2, 0.2, 0.2];

    const background = new SceneNode();
    background.addMesh(["models/menu/menubackground.fbx"]);
    background.translation = [propXLoc, carYLoc + 5, -80];
    background.scale = [2, 2, 2];
    background.update = () => {
        const factor = 0.0625;
        background.rotate(0.05 * factor, 0.025 * factor, 0.0125 * factor);
    };

    // Game Title
    const gameTitleTxt = new UIPanel(0, 11, 20, 6, ["textures/menu/blank.png"]);
    gameTitleTxt.transparent = true;
    gameTitleTxt.addText("OnlineRacer", 112, "Verdana", "black");
    UILayer.push(gameTitleTxt);
    
    // Play Online button
    const playOnlineBtn = new UIPanel(uiStartXPos, 3, 20, 6, ["textures/menu/connect_button_bg_0.png", "textures/menu/connect_button_bg_1.png"]);
    playOnlineBtn.addText("Play Online", 84);
    playOnlineBtn.whenClicked = function() {

        Client.onOpen = (e) => {
            loadLobby();
        };
        
        Client.connect();
        playOnlineBtn.removeText();
        connectingScreen();
    };
    playOnlineBtn.update = function() {
        if(this.mouseHovering) {
            this.textureIndex = 1;
        } else {
            this.textureIndex = 0;
        }

        // if (currentGamepad.isHeld("A")) {
        //     playOnlineBtn.whenClicked();
        // }
    }
    UILayer.push(playOnlineBtn);

    const playOfflineBtn = new UIPanel(uiStartXPos, -6, 20, 6, ["textures/menu/offline_button_bg_0.png", "textures/menu/offline_button_bg_1.png"]);
    playOfflineBtn.addText("Play Offline", 84);
    playOfflineBtn.whenClicked = function() {
        // TODO: Implement offline mode functionality
        console.log("Play Offline has been clicked");
    };
    playOfflineBtn.update = function() {
        if(this.mouseHovering) {
            this.textureIndex = 1;
        } else {
            this.textureIndex = 0;
        }

        // if (currentGamepad.isHeld("A")) {
        //     playOfflineBtn.whenClicked();
        // }
    }
    UILayer.push(playOfflineBtn);

    sceneGraph.root.addChild(car);
    sceneGraph.root.addChild(backdrop);
    sceneGraph.root.addChild(background);
}

function connectingScreen() {
    clearUIPanel();
    UILayer.push(new UIPanel(uiStartXPos, 0, 3*4, 3, ["textures/menu/connecting.png"]));
}

function loadLobby() {
    clearUIPanel();
    const idToUIPanel = new Map();

    Client.onMessage = (e) => {
        const m = JSON.parse(e.data);

        /*
            If freshly joining lobby.
        */
        if(m.type == "set_id") {
            const id = m.id;
            const stripHeight = 5;
            const playerStrip = new UIPanel(uiStartXPos,12 - stripHeight/2 - (id - 1) * stripHeight, stripHeight * 4, stripHeight, [`textures/menu/player_${id}.png`, 'textures/menu/you.png']);
            let frameCounter = 0;
            playerStrip.update = function() {
                frameCounter++;
                const timePassed = frameCounter / updatesPerSecond;
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
                    const playerStrip = new UIPanel(uiStartXPos,12 - stripHeight/2 - (id - 1) * stripHeight, stripHeight * 4, stripHeight, [`textures/menu/player_${id}.png`]);
                    idToUIPanel.set(id, playerStrip);
                    UILayer.unshift(playerStrip);
            });
        }

        /* If other players join lobby. */

        if(m.type == "lobby_update_player_connected") {
            const id = m.id;
            const stripHeight = 5;
            const playerStrip = new UIPanel(uiStartXPos,12 - stripHeight/2 - (id - 1) * stripHeight, stripHeight * 4, stripHeight, [`textures/menu/player_${id}.png`, 'textures/menu/you.png']);
            idToUIPanel.set(id, playerStrip);
            UILayer.unshift(playerStrip);
        }

        if(m.type == "lobby_update_player_disconnected") {
            console.log("player disconnected");
            removeUIPanel(idToUIPanel.get(m.id));
        }

        if(m.type == "initiate_load_track_1") {
            Client.synchronizeServerTime().then(() => {
                loadTrack(0);
            });
        }
        /*
        if(m.type == "lobby_update_player_connected") {
                if(lobbyNum == 0) {
                    //Just joined. Need to populate list   
                    lobbyNum = m.num;
                    for(let i = 0; i < lobbyNum; i++) {
                        const stripHeight = 5;
                        const playerStrip = new UIPanel(uiStartXPos,12 - stripHeight/2 - (i) *stripHeight, stripHeight * 4, stripHeight, [`textures/player_${i + 1}.png`]);
                        UILayer.unshift(playerStrip);
                    } 
                } else {
                    //Only add one player to lobby.
                    lobbyNum++;
                    const stripHeight = 5;
                    const playerStrip = new UIPanel(uiStartXPos,12 - stripHeight/2 - (lobbyNum - 1) *stripHeight, stripHeight * 4, stripHeight, [`textures/player_${lobbyNum}.png`]);
                    UILayer.unshift(playerStrip);
                }
        }
        */
    };

    const lobbyPlayerPanel = new UIPanel(uiStartXPos, 2, 20, 20, ["textures/menu/lobby_players_panel.png"]);
    // const beginButton = new UIPanel(5, -11, 3*4, 3, ["textures/menu/begin_button_0.png", "textures/menu/begin_button_1.png"]);
    const beginButton = new UIPanel(uiStartXPos, -11, 3*4, 3, ["textures/menu/begin_button_bg_0.png", "textures/menu/begin_button_bg_1.png"]);
    beginButton.addText("Begin", 40);
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
            beginButton.removeText();
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

document.querySelector("#volume").addEventListener("change", (e) => {
    localStorage.setItem("volume", e.target.value);
});