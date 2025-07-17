/*
Camera points towards the -z axis into the screen.
X axis to the right.
Y axis upwards.
origin bottom left.
*/
let camera = new Camera([0, 10, 15], [0, 0, 0]);

let car;
let playerID;
let networkCars = new Map();

const startWidth = 25;
const startHeight = 25;

Client.onOpen = (e) => {
    const msg = {
        type: "get_unique_id",
    };
    Client.webSocket.send(JSON.stringify(msg));
};

Client.onMessage = (e) => {
    const msg = JSON.parse(e.data);
    switch (msg.type) {
        case "set_id":
            playerID = msg.id;
            Client.webSocket.send(JSON.stringify({
                type: "add_player",
                player: {
                    id: playerID,
                    translation: car.translation,
                    rotation: car.rotation,
                    scale: car.scale
                }
            }));
            break;
        case "add_player": {
            //attach player node to scene root.
            let p = new SceneNode();
            p.translation = msg.player.translation;
            p.rotation = msg.player.rotation;
            p.scale = msg.player.scale;
            p.addMesh(["models/car.obj", "models/car.mtl"]);
            sceneGraph.root.addChild(p);
            p.tag = "car";
            p.addCollisionPlane(new CollisionPlane());

            networkCars.set(msg.player.id, p);

            break;
        }
        case "player_update": {
            const c = networkCars.get(msg.player.id);
            c.translation = msg.player.translation;
            c.rotation = msg.player.rotation;
            c.scale = msg.player.scale;

            break;
        }
        case "remove_player": {
            networkCars.get(msg.id).remove();
            networkCars.set(msg.id, null);
            break;
        }
    }
};

function init() {
    //debug = true;

    // Initialize camera with proper aspect ratio
    const canvas = document.getElementById('c');
    const aspectRatio = canvas.width / canvas.height;
    camera.displayHeight = startHeight;
    camera.displayWidth = startHeight * aspectRatio;

    car = new SceneNode();

    const gravity = -0.1;

    let carDirection = vec.rotate([0, 0, -1], 0, 0.25, 0);
    let velocity = 0;
    let carYVelocity = 0;
    let rotateSpeed = 0;
    let maxRotateSpeed = 0.05;

    let carRotationY = 0;
    let cameraRotationY = 0;
    let cameraLagFactor = 0.1;

    let terminalVelocity = 17;
    let acceleration = 0.4;
    let friction = 0.2;
    let boostTimer = 0;

    let startTimer = false;
    let startTime = 0;
    let finalTime = 0;
    let lastStartLineCollision = false;

    let controlsDisabled = false;

    // Timer display functions
    function formatTime(milliseconds) {
        const totalSeconds = milliseconds / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const centiseconds = Math.floor((totalSeconds % 1) * 100);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    function updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        const timerStatus = document.getElementById('timer-status');

        if (startTimer) {
            const elapsed = Date.now() - startTime;
            timerDisplay.textContent = formatTime(elapsed);
            timerStatus.textContent = "Racing...";
        } else {
            if (finalTime > 0) {
                // Timer has been stopped, show final time
                timerDisplay.textContent = formatTime(finalTime);
                timerStatus.textContent = "Race finished!";
            } else {
                // Timer hasn't started yet
                timerDisplay.textContent = "00:00.00";
                timerStatus.textContent = "Ready to race!";
            }
        }
    }

    function rotateSpeedFunction(x) {
        return x >= 0 ? ((1.2 * x - 1.2) / (1 + Math.abs(1.2 * x - 1.2)) + 0.55) / 1.5 :
            -1 * ((0.5 * -x - 5) / (1 + Math.abs(0.5 * -x - 5)) + 0.9) / 0.12222;
    }

    car.update = () => {

        // Input handling
        if (!controlsDisabled) {
            if (input.up) {
                velocity += acceleration;
            }
            if (input.down) {
                velocity -= 0.9;
                if (velocity < -4) {
                    velocity = -4;
                }
            }
            if (input.left && Math.abs(velocity) > 0.5) {
                car.rotate(0, rotateSpeed, 0);
                carRotationY += rotateSpeed;

                carDirection = vec.rotate(carDirection, 0, rotateSpeed, 0);
            }
            if (input.right && Math.abs(velocity) > 0.5) {
                car.rotate(0, -rotateSpeed, 0);
                carRotationY -= rotateSpeed;

                carDirection = vec.rotate(carDirection, 0, -rotateSpeed, 0);
            }
        }


        //

        let rotationDiff = carRotationY - cameraRotationY;
        let cameraRotationStep = rotationDiff * cameraLagFactor;
        camera.rotate(0, cameraRotationStep, 0);
        cameraDisp = vec.subtract(camera.translation, car.translation)

        newPos = vec.rotate(cameraDisp, 0, cameraRotationStep, 0);

        camera.translation = vec.add(newPos, car.translation)

        cameraRotationY += cameraRotationStep;

        //Accelerations

        if (velocity > 0) {
            cameraLagFactor = 0.1;
            velocity -= friction;
            if (velocity < 0) {
                velocity = 0;
            }
            if (velocity > terminalVelocity) {
                velocity -= 0.5;
            }
        }
        if (velocity < 0) {
            cameraLagFactor = 0.3;
            velocity += 0.2;
            if (velocity > 0) {
                velocity = 0;
            }
        }

        if (velocity == 0) {
            rotateSpeed = 0;
        } else {
            rotateSpeed = maxRotateSpeed * rotateSpeedFunction(velocity);
        }

        let newcarDirection = vec.scale(velocity, carDirection);
        carYVelocity = carYVelocity + gravity;


        // Translation of the car in the new direction.
        const carDelta = [newcarDirection[0], carYVelocity, newcarDirection[2]];
        car.translate(carDelta[0], carDelta[1], carDelta[2]);
        const camDelta = [newcarDirection[0], newcarDirection[1], newcarDirection[2]];
        camera.translate(camDelta[0], camDelta[1], camDelta[2]);

        if (car.translation[1] < 0) {
            //If car phases through ground
            car.translation[1] = 0;
            carYVelocity = 0;
        }

        car.collisionStep(); //Check for collisions

        let currentStartLineCollision = false;

        if (car.collisionPlane.collided) {
            const collisions = car.collisionPlane.collisions;

            for (let i = 0; i < collisions.length; i++) {

                const t = collisions[i].parent.tag;
                const p = collisions[i].parent;

                if (t == "wall") {
                    //A collision resulted. Add negative of delta pos to undo.
                    let carInv = vec.scale(-1, carDelta);
                    let camInv = vec.scale(-1, camDelta);
                    velocity = 0;
                    car.translate(carInv[0], carYVelocity, carInv[2]);
                    camera.translate(camInv[0], camInv[1], camInv[2]);

                } else if (t == "ramp") {
                    //collision with ramp
                    carYVelocity += 1 / 15 * Math.abs(velocity);
                } else if (t == "boost") {
                    boostTimer = 1;
                } else if (t == "start") {
                    currentStartLineCollision = true;
                } else if (t == "obstacle" || t == "car") {
                    if (t == "obstacle") {
                        p.remove();

                        for (let i = 0; i < 4; i++) {
                            let obstacleShard = new SceneNode();

                            // JACK: allow for obstacleShard.mesh = obstacle.mesh to work and create multiple shards

                            obstacleShard.addMesh(['models/cube.obj']);
                            obstacleShard.scaleBy(2, 2, 2);
                            obstacleShard.translation = [...p.translation];
                            obstacleShard.rotation = [...p.rotation];
                            sceneGraph.root.addChild(obstacleShard);

                            let carDirNorm = vec.normalize([carDirection[0], 0, carDirection[2]]);
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
                    }
                    if (velocity <= 8.5 && t == "car") {
                        // potential logic for rebounding off of collided cars
                        // if (t == "car") {
                        //     let carInv = vec.scale(-1, carDelta);
                        //     let camInv = vec.scale(-1, camDelta);
                        //     let scale = 5;
                        //     velocity = - 1 / 10 * velocity;
                        //     car.translate(scale * carInv[0], carYVelocity, scale * carInv[2]);
                        //     camera.translate(scale * camInv[0], camInv[1], scale * camInv[2]);
                        // }
                        break;
                    }
                    controlsDisabled = true;
                    let speed = Math.abs(velocity);
                    // proprotional to speed makes spinning quicker when you move slower, proportional to inverse speed makes spinning quicker when you move faster
                    let rotationFrames = Math.min(60, Math.round(30 * 15 / speed));
                    let direction = Math.random();
                    let rotationStep = (4 * Math.PI) / rotationFrames;
                    if (direction < 0.5) {
                        rotationStep = -1 * rotationStep;
                    }


                    if (!car.spinning) {
                        car.spinning = true;
                        car.spinFramesLeft = rotationFrames;
                        car.originalUpdate = car.update;
                        car.update = function () {
                            if (car.spinFramesLeft > 0) {
                                car.rotate(0, rotationStep, 0);
                                // Slow down the car drastically while spinning
                                velocity *= 0.95;
                                car.spinFramesLeft--;
                                if (car.spinFramesLeft == 0) {
                                    velocity = 0;
                                }
                            } else {
                                car.spinning = false;
                                // Restore the original update function after spinning
                                car.update = car.originalUpdate;
                                controlsDisabled = false;
                            }
                            car.originalUpdate && car.originalUpdate.call(this);
                        };
                    }
                } else if (t == "magnet" && car.translation[1] < 1) {
                    terminalVelocity = 5;
                    acceleration = 0.2;
                }
            }
        } else {
            terminalVelocity = 17;
            acceleration = 0.4;
        }

        // Handle start line collision only on transition from not colliding to colliding
        if (currentStartLineCollision && !lastStartLineCollision) {
            if (!startTimer) {
                startTime = Date.now();
                finalTime = 0; // Reset final time when starting new race
                //console.log("Timer started");
                startTimer = true;
            } else {
                finalTime = Date.now() - startTime;
                const elapsed = finalTime / 1000;
                //console.log(`Timer stopped: ${elapsed.toFixed(2)} seconds`);
                startTimer = false;
            }
        }

        lastStartLineCollision = currentStartLineCollision;

        // Update timer display every frame
        updateTimerDisplay();

        // Update speedometer every frame
        updateSpeedometer(velocity);

        // logic for boost pads:
        if (boostTimer > 0) {
            if (velocity < 25) {
                velocity += 0.5;
            }
            boostTimer += 1;
            if (boostTimer >= 60) {
                boostTimer = 0;
            }
        }

        // Update camera zoom with velocity while maintaining aspect ratio
        const canvas = document.getElementById('c');
        const aspectRatio = canvas.width / canvas.height;
        const zoomHeight = startHeight + velocity * 0.5;
        camera.displayHeight = zoomHeight;
        camera.displayWidth = zoomHeight * aspectRatio;

        if (Client.connected) {
            const msg = {
                type: "player_update",
                player: {
                    translation: car.translation,
                    rotation: car.rotation,
                    scale: car.scale,
                    id: playerID
                }
            };

            Client.webSocket.send(JSON.stringify(msg));
        }
    };
    car.addMesh(["models/car.obj", "models/car.mtl"]);
    car.addCollisionPlane(new CollisionPlane());
    car.collisionPlane.scale = [2, 1, 3];

    ground = new SceneNode();
    ground.addMesh(["models/track01.fbx"]).then(() => {
        startLine = ground.getChild("startline");
        startLine.tag = "start";
        ground.getChild("railing.001").tag = "wall";
        car.scaleBy(3, 3, 3);
        car.rotate(0, Math.PI + startLine.rotation[1], 0);
        cameraDist = vec.rotate([0, 0, 50], startLine.rotation[0], startLine.rotation[1], startLine.rotation[2]);
        camera.rotate(0, startLine.rotation[1], 0);
        car.translation = vec.add(vec.add(startLine.translation, vec.rotate([0, 0, 50], startLine.rotation[0], startLine.rotation[1], startLine.rotation[2])), [15, 0, 0]);
        camera.translate(car.translation[0] + cameraDist[0] + 4.3, 10, car.translation[2] + cameraDist[2]);
    });


    ground.translate(0, -5, -50);

    cube = new SceneNode();
    cube.addMesh(["models/cube.obj"]);
    cube.tag = "wall";
    cube.translate(-415, 5, -750);
    cube.scaleBy(10, 10, 10);
    cube.addCollisionPlane(new CollisionPlane());

    ramp = new SceneNode();
    ramp.addMesh(["models/ramp.obj"]);
    ramp.translate(-375, -5, -750);
    ramp.scaleBy(10, 2, 10);
    ramp.tag = "ramp";
    ramp.addCollisionPlane(new CollisionPlane());
    ramp.rotate(0, 3 * Math.PI / 2, 0);

    boost = new SceneNode();
    boost.addMesh(["models/ramp.obj"]);
    boost.tag = "boost";
    boost.translate(-350, -5, -500);
    boost.scaleBy(10, 0.5, 10);
    boost.addCollisionPlane(new CollisionPlane());
    boost.rotate(0, 0.25, 0);

    magnet = new SceneNode();
    magnet.addMesh(["models/ramp.obj"]);
    magnet.tag = "magnet";
    magnet.translate(-350, -5, -1050);
    magnet.scaleBy(100, 0.5, 150);
    magnet.addCollisionPlane(new CollisionPlane());
    magnet.rotate(0, 0.25, 0);

    obstacle = new SceneNode();
    obstacle.addMesh(["models/cube.obj"]);
    obstacle.tag = "obstacle";
    obstacle.addCollisionPlane(new CollisionPlane());
    obstacle.scaleBy(5, 5, 5);
    obstacle.translate(-350, 0, -750);

    sceneGraph.root.addChild(car);
    sceneGraph.root.addChild(ground);
    sceneGraph.root.addChild(cube);
    sceneGraph.root.addChild(ramp);
    sceneGraph.root.addChild(boost);
    sceneGraph.root.addChild(obstacle);
    sceneGraph.root.addChild(magnet);

    Client.connect();
}