let networkCars; // A mapping between player Ids and car objects.
let clientCar; // The target car to have information sent to the server.

function loadNetworkCars() {
    /* 
        Sets the network code to request and recieve information about
        the other players cars.
    */
    networkCars = new Map(); // Refresh/or init mapping.

    Client.webSocket.send(JSON.stringify({
        type:"get_car_states",
        returnId:Client.id
    }));
    Client.webSocket.send(JSON.stringify({
        type: "add_car",
        id: Client.id,
        transform: {
            translation: clientCar.translation,
            rotation: clientCar.rotation,
            scale: clientCar.scale
        }
    }));

    Client.onMessage = (e) => {
        const msg = JSON.parse(e.data);
        switch(msg.type) {
            case "get_car_states":
                Client.webSocket.send(JSON.stringify({
                    type: "add_car",
                    id: Client.id,
                    transform: {
                        translation: clientCar.translation,
                        rotation: clientCar.rotation,
                        scale: clientCar.scale
                    },
                    destinationId: msg.returnId
                }));
                break;
            
            case "add_car": {
                //attach player node to scene root.
                let p = new SceneNode();
                p.translation = msg.transform.translation;
                p.rotation = msg.transform.rotation;
                p.scale = msg.transform.scale;
                p.addMesh(["models/car.obj", "models/car.mtl"]);
                sceneGraph.root.addChild(p);
                p.tag = "car";
                p.addCollisionPlane(new CollisionPlane());
                p.collisionPlane.scale = [2, 1, 3];
                p.update = () => {
                    p.collisionStep();
                    if (p.collisionPlane.collided) {
                        const collisions = p.collisionPlane.collisions;
                        collisions.forEach((collider) => {
                            const t = collider.parent.tag;
                            const c = collider.parent;

                            if (t == "obstacle") {
                                for (let i = 0; i < 4; i++) {
                                    const obstacleShard = new SceneNode();
                                    const obstacleMesh = c.getChildren("mesh")[0].mesh;

                                    obstacleShard.mesh = obstacleMesh.reuse();
                                    obstacleShard.scaleBy(2, 2, 2);
                                    obstacleShard.translation = [...p.translation];
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
                };

                networkCars.set(msg.id, p);
                break;
            }

            case "car_update": {
                const c = networkCars.get(msg.id);
                c.translation = msg.transform.translation;
                c.rotation = msg.transform.rotation;
                c.scale = msg.transform.scale;

                break;
            }

            case "lobby_update_player_disconnected":
                networkCars.get(msg.id).remove();
                networkCars.set(msg.id, null);
                break;
        }
    };
}

function carNetworkStep() {
    /*
        Updates the clients car state over the network to
        the other players. Call within update method after updating.
    */
    const msg = {
        type:"car_update",
        id:Client.id,
        transform:{
            translation:clientCar.translation,
            rotation:clientCar.rotation,
            scale:clientCar.scale
        }
    }
    Client.webSocket.send(JSON.stringify(msg));
}


