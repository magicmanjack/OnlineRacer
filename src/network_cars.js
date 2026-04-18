let networkCars; // A mapping between player Ids and car objects.
let clientCar; // The target car to have information sent to the server.
let allClientsLoaded; // A boolean flips to true when each client has finished loading into a track.

let networkUpdate; //An function that gets called every frame.

let lobbySize;
let playersReady;
let playersFinished;



function initRaceNetworking() {
    /* 
        Sets the network code to request and recieve information about
        the other players cars.
    */
    allClientsLoaded = false;
    playersReady = 0;
    lobbySize = 0;
    networkCars = new Map(); // Refresh/or init mapping.
    playersFinished = [];

    Client.webSocket.send(JSON.stringify({
        type:"get_car_states",
        returnId:Client.id
    }));
    Client.webSocket.send(JSON.stringify({
        type:"get_lobby_size"
    }))
    Client.state = "waiting_for_lobby_size";

    Client.onMessage = (e) => {
        const msg = JSON.parse(e.data);
        
        switch(msg.type) {
            
            case "get_car_states":
                Client.webSocket.send(JSON.stringify({
                    type: "add_car",
                    id: Client.id,
                    transform: {
                        translation: clientCar.node.translation,
                        rotation: clientCar.node.rotation,
                        scale: clientCar.node.scale
                    },
                    destinationId: msg.returnId
                }));
                break;
            
            case "add_car": {
                //attach player node to scene root.
                let netCar = new Car();
                netCar.node.translation = msg.transform.translation;
                netCar.node.rotation = msg.transform.rotation;
                netCar.node.scale = msg.transform.scale;
                
                sceneGraph.root.addChild(netCar.node);
                netCar.node.tag = "car";
                const collider = new CollisionPlane();
                netCar.node.addCollisionPlane(collider);
                collider.scale = [2, 1, 3];

                const carModel = new SceneNode();

                let g1, g2; // Particle generators
                //Adding mesh as seperate scene node to easily add animation to model while keeping base transformation simple.
                carModel.addMesh(["models/car/car.fbx"]).then(() => {
                    //Changes car texture based on player ID.
                    if(msg.id > 1) {
                        loadTextureAsync(`textures/car/car_player_${msg.id}.png`).then((texture) => {
                            carModel.getChild("Cube").mesh.texture = texture;
                        });
                    }

                    //Add spark particle generators to wings
                    g1 = new ParticleGenerator("/textures/default.png");
                    g2 = new ParticleGenerator("/textures/default.png");
                    g1.maxParticles = 100;
                    g2.maxParticles = 100;
                    g1.emitAmount = 3;
                    g2.emitAmount = 3;
                    g1.enable = false;
                    g2.enable = false;
                    let gInit = (p) => {
                        //Move opposite car direction
                        //Car dir
                        //TODO: get rid of spacing between spawn
                        const sparkVel = 3.0;
                        const randStrength = 2.0;
                        const randInfluence = [Math.random() * randStrength - randStrength/2, Math.random() * randStrength - randStrength/2, Math.random() * randStrength - randStrength/2]
                        const carDir = vec.rotate([0, 0, -1 * netCar.velocityXZ + sparkVel], 0, netCar.node.rotation[1], 0);
                        
                        p.velocity = vec.add(carDir, randInfluence);
                        
                        p.size = [1.5, 1.5];
                        p.ttl = 60;
                    }
                    let gUpdate = (p) => {
                        p.position = vec.add(p.position, p.velocity);
                        p.size = vec.scale(0.95, p.size);
                    }
                    g1.particleInit = gInit;
                    g1.particleUpdate = gUpdate;
                    g2.particleInit = gInit;
                    g2.particleUpdate = gUpdate;
                    carModel.getChild("wing_left").addParticleGenerator(g1);

                    carModel.getChild("wing_right").addParticleGenerator(g2);
                
                
                });
                carModel.name = "carModel";
                netCar.node.addChild(carModel);

                netCar.node.update = () => {
                    netCar.node.getChild("carModel").translation = [
                        0,
                        CAR_HOVER_AMPLITUDE * Math.cos(2*Math.PI*CAR_HOVER_FREQUENCY*performance.now()/1000),
                        0
                    ];

                    //First layer booster
                    const booster1 = netCar.node.getChildByMesh("booster_1");
                    
                    if(booster1) {
                        const a = 0.05;
                        const f = 8;
                        const vibration = a * Math.sin(2 * Math.PI * performance.now() * f / 1000);

                        const minScale = 0.3;
                        
                        const scale = Math.min((1 - minScale) * Math.abs(netCar.velocityXZ) / TERMINAL_VEL + minScale + vibration, 1);
                        
                        booster1.scale = [scale, scale, scale];
                    }
                    
                    //Second layer booster
                    const booster2 = netCar.node.getChildByMesh("booster_2");
                    if(booster2) {
                        const a = 0.05;
                        const f = 8;
                        const vibration = a * Math.sin(2 * Math.PI * performance.now() * f / 1000);

                        const scale = Math.min(Math.abs(netCar.velocityXZ) / TERMINAL_VEL + vibration, 1);
                        booster2.scale = [scale, scale, scale];
                    }
                    netCar.node.collisionStep();

                    netCar.node.colliders.forEach((c) => {
                        if (c.collided) {

                            const collisions = c.collisions;
                            collisions.forEach((collision) => {
                                const t = collision.sceneNode.tag;
                                const c = collision.sceneNode;

                                if (t == "obstacle") {
                                    for (let i = 0; i < 4; i++) {
                                        const obstacleShard = new SceneNode();
                                        const obstacleMesh = c.getChildren("mesh")[0].mesh;

                                        obstacleShard.mesh = obstacleMesh.reuse();
                                        obstacleShard.scaleBy(0.5, 0.5, 0.5);
                                        obstacleShard.translation = [...netCar.node.translation];
                                        obstacleShard.rotation = [...c.rotation];
                                        sceneGraph.root.addChild(obstacleShard);
                                        let netCarDir = vec.rotate([0, 0, -1], c.rotation[0], c.rotation[1], c.rotation[2]);
                                        let carDirNorm = vec.normalize([netCarDir[0], 0, netCarDir[2]]);
                                        let baseAngle = Math.atan2(carDirNorm[2], carDirNorm[0]);
                                        let angle = baseAngle + ((i - 1.5) * Math.PI / 4) + Math.random() * (Math.PI / 8);
                                        let speed = 5 + Math.random() * 2;
                                        let velocityVec = [
                                            Math.cos(angle) * speed + Math.random() * 2,
                                            2 + Math.random() * 2 + Math.random() * 2,
                                            Math.sin(angle) * speed + Math.random() * 2
                                        ];

                                        let frames = 40;
                                        obstacleShard.update = function () {
                                            this.translate(velocityVec[0], velocityVec[1], velocityVec[2]);
                                            velocityVec[1] -= 0.3;
                                            frames--;
                                            if (frames <= 0) {
                                                this.remove();
                                            }
                                        };

                                    }
                                    c.remove();
                                }
                            });
                        }
                    });
                    
                    //TODO need to calculate the car roll. Idea rotate up vector and calculate angle with true up vector
                    const carW = mat.to3x3(carModel.world); 
                    //TODO: use carW to rotate vec3.up to set apparentUp
                    const apparentUp = mat.multiplyVec(carW, vec3.up);
                    const roll = Math.acos(vec.dot(vec3.up, apparentUp) / vec.magnitude(apparentUp));
                    
                    //TODO once car roll calculated, enabling particle generators should be as in main track code.
                    //Car spark animations
                    
                    if(roll > MAX_CAR_ROLL / 2 && netCar.drifting && netCar.node.translation[1] == track.groundLevel) {
                        g1.enable = true;
                    } else {
                        g1.enable = false;
                    }

                    if(roll < -1 * MAX_CAR_ROLL / 2 && netCar.drifting && netCar.node.translation[1] == track.groundLevel) {
                        g2.enable = true;
                    } else {
                        g2.enable = false;
                    }
                };

                networkCars.set(msg.id, netCar);
                break;
            }

            case "lobby_size":
                
                if(Client.state == "waiting_for_lobby_size") {
                    lobbySize += msg.size;
                    Client.state = "waiting_for_scene_ready";
                }
                break;

            case "car_update": {
                const c = networkCars.get(msg.id);
                if (c) {
                    c.node.translation = msg.transform.translation;
                    c.node.rotation = msg.transform.rotation;
                    c.node.scale = msg.transform.scale;
                    c.velocityXZ = msg.velocity;
                    const carModel = c.node.getChild("carModel");
                    if(carModel) {
                        carModel.translation = msg.modelTransform.translation;
                        carModel.rotation = msg.modelTransform.rotation;
                        carModel.scale = msg.modelTransform.scale;
                    }
                    c.drifting = msg.input.drifting;
                }
                break;
            }

            case "player_ready":{
                playersReady++;
                break;
            }

            case "lobby_update_player_disconnected":
                networkCars.get(msg.id).node.remove();
                networkCars.set(msg.id, null);
                const i = playersFinished.indexOf(msg.id);
                if(i >= 0) {
                    playersFinished.splice(i, 1);
                }
                lobbySize--;
                break;

            case "player_finished":
                leaderboard.add(msg.playerID, msg.timeFinished);
                playersFinished.push(msg.playerID);
                break;

            case "load_next_track":
                if(Client.state != "loading_next_track") {
                    Client.state = "loading_next_track";
                }
                break;

        }
    };

    networkUpdate = function() {

        //TODO: when playersReady == lobbySize init sequence.
        //Check if server side "player_ready" is added.
        
        //console.log(Client.state);

        function getCarModelTransform() {
            /*
                Gets the transform of the car model node, which is a child node of the car scene node.
            */
            const carModel = clientCar.node.getChild("carModel");
            if(carModel) {
                return {
                    translation:carModel.translation,
                    rotation:carModel.rotation,
                    scale:carModel.scale,
                }
            } else {
                /* 
                    Not loaded in yet
                */
                return {
                    translation:[0, 0, 0],
                    rotation:[0, 0, 0],
                    scale:[1, 1, 1],
                }
            }
        }

        switch(Client.state) {
            case "waiting_for_scene_ready":
                if(sceneGraph.ready()) {
                    Client.webSocket.send(JSON.stringify({
                        type:"player_ready"
                    }));
                    playersReady++;
                    Client.state = "waiting_for_all_ready";
                }
                break;
            case "waiting_for_all_ready":
                //
                //console.log(`playersReady ${playersReady}, lobbysize ${lobbySize}`);
                if(playersReady == lobbySize) {
                    allClientsLoaded = true;
                    Client.state = "racing";
                }
                break;
            case "racing":
                
                break;
            case "race_finished":
                toggleHUD = false;
                if(playersFinished.length == lobbySize) {
                    //Signal for 'next race' button to show
                    
                    nextRaceButton = new UIPanel(4, -6, 8, 2, ["textures/default.png"]);
                    nextRaceButton.update = () => {
                        if (Client.state === "waiting" && currentGamepad.isPressed("A")) {
                            nextRaceButton.whenClicked();
                        }
                    }
                    nextRaceButton.whenClicked = () => {
                        Client.webSocket.send(JSON.stringify({
                            type:"relay_all",
                            relay:{
                                type:"load_next_track"
                            }
                        }));
                    };
                    UILayer.unshift(nextRaceButton);
                    Client.state = "waiting";
                }
                break;
            case "loading_next_track":
                loadTrack(0);
                leaderboard.reset();
                break;
                
        }

        Client.webSocket.send(JSON.stringify({
            type:"car_update",
            id:Client.id,
            transform:{
                translation:clientCar.node.translation,
                rotation:clientCar.node.rotation,
                scale:clientCar.node.scale,
            },
            modelTransform:getCarModelTransform(),
            velocity:clientCar.velocityXZ,
            input:{
                drifting:clientCar.drifting,
            }
        }));
    }


}

function sendRaceFinished(timetaken) {
    Client.state = "race_finished";
    //Need to communicate to other players
    Client.webSocket.send(JSON.stringify({
        type:"relay_all",
        relay:{
            type:"player_finished",
            playerID: Client.id,
            timeFinished: timetaken
        }
    }));
}


