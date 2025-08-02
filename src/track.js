let toggleHUD = false;


function loadTrack1() {
    debug = false;
    toggleHUD = true;

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

    // Initialize camera with proper aspect ratio
    const canvas = document.getElementById('c');
    const aspectRatio = canvas.width / canvas.height;
    Camera.main.displayHeight = startHeight;
    Camera.main.displayWidth = startHeight * aspectRatio;

    Camera.main.translation = [0, 10, 15];

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

    let controlsDisabled = true;

    let checkpointStack = [];
    let requiredCheckpoints = ["checkpoint.001", "checkpoint.002"];

    let numLaps = 1;
    let gameFinished = false;

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

        if (startTimer) {
            const elapsed = Date.now() - startTime;
            timerDisplay.textContent = formatTime(elapsed);
        } else {
            if (finalTime > 0) {
                // Timer has been stopped, show final time
                timerDisplay.textContent = formatTime(finalTime);
            } else {
                // Timer hasn't started yet
                timerDisplay.textContent = "00:00.00";
            }
        }
    }

    function updateLapCounter() {
        const lapCounter = document.getElementById('lap-counter');
        lapCounter.textContent = `${numLaps}/3`;
    }

    function getCheckpointNumber(checkpointName) {
        return parseInt(checkpointName.slice(-1));
    }

    function allCheckpointsPassed() {
        if (
            checkpointStack.length === requiredCheckpoints.length &&
            checkpointStack.every((val, idx) => val === requiredCheckpoints[idx])
        ) {
            return true;
        } else {
            return false;
        }
    }

    function resetCheckpoints() {
        checkpointStack = [];
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
        Camera.main.rotate(0, cameraRotationStep, 0);
        cameraDisp = vec.subtract(Camera.main.translation, car.translation)

        newPos = vec.rotate(cameraDisp, 0, cameraRotationStep, 0);

        Camera.main.translation = vec.add(newPos, car.translation)

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
        Camera.main.translate(camDelta[0], camDelta[1], camDelta[2]);

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
                    Camera.main.translate(camInv[0], camInv[1], camInv[2]);

                } else if (t == "ramp") {
                    //collision with ramp
                    carYVelocity += 1 / 25 * Math.abs(velocity);
                } else if (t == "boost") {
                    boostTimer = 1;
                } else if (t == "start") {
                    currentStartLineCollision = true;
                } else if (t == "obstacle" || t == "car") {
                    if (t == "obstacle") {

                        for (let i = 0; i < 4; i++) {
                            const obstacleShard = new SceneNode();

                            const obstacleMesh = p.getChildren("mesh")[0].mesh;

                            obstacleShard.mesh = obstacleMesh.reuse();
                            obstacleShard.scaleBy(2, 2, 2);
                            obstacleShard.translation = [...car.translation];
                            obstacleShard.rotation = [...p.rotation];
                            sceneGraph.root.addChild(obstacleShard);

                            let carDirNorm = vec.normalize([carDirection[0], 0, carDirection[2]]);
                            if (velocity < 0) {
                                carDirNorm = -carDirNorm;
                            }
                            let baseAngle = Math.atan2(carDirNorm[2], carDirNorm[0]);
                            let maxAngleOffset = Math.PI / 4;
                            let angle = baseAngle + ((i - 1.5) * maxAngleOffset / 2) + (Math.random() - 0.5) * maxAngleOffset;
                            let speed = 5 + Math.random() * 2;

                            let velocityVec = [
                                Math.cos(angle) * speed + carDirNorm[0] * Math.abs(velocity) * 0.8,
                                2 + Math.random() * 3,
                                Math.sin(angle) * speed + carDirNorm[2] * Math.abs(velocity) * 0.8
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
                        p.remove();
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
                                if (!gameFinished) {
                                    controlsDisabled = false;
                                }
                            }
                            car.originalUpdate && car.originalUpdate.call(this);
                        };
                    }
                } else if (t == "magnet" && car.translation[1] < 1) {
                    terminalVelocity = 5;
                    if (Math.abs(velocity) > 2) {
                        acceleration = 0.2;
                    } else {
                        acceleration = 0.4;
                    }
                } else if (t == "checkpoint") {
                    const checkpointName = p.name;
                    let checkpointNumber = getCheckpointNumber(checkpointName);
                    if (!checkpointStack.includes(checkpointName)) {
                        if (checkpointStack.length == 0 && checkpointNumber == 1) {
                            checkpointStack.push(checkpointName);
                        } else if (checkpointStack.length != 0 && checkpointNumber == (getCheckpointNumber(checkpointStack[checkpointStack.length - 1]) + 1)) {
                            checkpointStack.push(checkpointName);
                        }
                    } else if (checkpointStack.includes("checkpoint.00" + (checkpointNumber + 1))) {
                        checkpointStack.pop();
                    }
                }
            }
        } else {
            terminalVelocity = 17;
            acceleration = 0.4;
        }

        // Handle start line collision only on transition from not colliding to colliding
        if (currentStartLineCollision && !lastStartLineCollision) {
            if (numLaps == 3) {
                if (allCheckpointsPassed()) {
                    finalTime = Date.now() - startTime;
                    startTimer = false;
                    controlsDisabled = true;
                    gameFinished = true;
                }
            } else if (allCheckpointsPassed()) {
                numLaps++;
                updateLapCounter();
            }
            resetCheckpoints();
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

        // Update Camera.main zoom with velocity while maintaining aspect ratio
        const canvas = document.getElementById('c');
        const aspectRatio = canvas.width / canvas.height;
        const zoomHeight = startHeight + velocity * 0.5;
        Camera.main.displayHeight = zoomHeight;
        Camera.main.displayWidth = zoomHeight * aspectRatio;

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

        /*
        for(let i = 1; i <= 111; i++ ) {
            ground.getChild(`railing.${String(i).padStart(3, '0')}`).tag = "wall";
        }
        */


        ground.getChildren("railing").forEach(element => {
            element.tag = "wall";
        });

        /*
        for(let i = 1; i <= 24; i++) {
            ground.getChild(`cube.${String(i).padStart(3, '0')}`).tag = "wall";
        }
        */

        ground.getChildren("cube").forEach((e) => { e.tag = "wall" });

        ground.getChildren("magnetpad").forEach((e) => { e.tag = "magnet" });

        ground.getChildren("ramp").forEach((e) => { e.tag = "ramp" });

        ground.getChildren("obstacle").forEach(e => {
            e.tag = "obstacle";
            const meshChild = e.getChildren("mesh")[0];
            meshChild.update = () => {
                meshChild.rotate(0, 0.1, 0.07);
            };
        });

        ground.getChildren("boost").forEach(e => {
            e.tag = "boost";
        });

        ground.getChildren("checkpoint").forEach(e => {
            e.tag = "checkpoint";
            // Preserve the original name from the 3D model for checkpoint identification
            if (!e.name) {
                e.name = e.tag; // Fallback if name isn't set
            }
        });

        car.scaleBy(3, 3, 3);
        car.rotate(0, Math.PI + startLine.rotation[1], 0);
        cameraDist = vec.rotate([0, 0, 50], startLine.rotation[0], startLine.rotation[1], startLine.rotation[2]);
        Camera.main.rotate(0, startLine.rotation[1], 0);
        car.translation = vec.add(vec.add(startLine.translation, vec.rotate([0, 0, 50], startLine.rotation[0], startLine.rotation[1], startLine.rotation[2])), [15, 0, 0]);
        Camera.main.translate(car.translation[0] + cameraDist[0] + 4.3, 10, car.translation[2] + cameraDist[2]);
    });


    ground.translate(0, -5, -50);

    sceneGraph.root.addChild(car);
    sceneGraph.root.addChild(ground);


    // Traffic light code
    const light = new UIPanel(10, 5, 5, 10, ["textures/light_red.png", "textures/light_orange.png", "textures/light_green.png"]);
    
    let frameCounter = 0;
    light.update = function() {
        const ti = this.textureIndex;
        const timePassed = () => frameCounter/UPDATES_PER_SECOND;

        switch(ti) {
            case 0: {
                if(timePassed() > 7) {
                    this.textureIndex++;
                    frameCounter = 0;
                }
                break;
            }
            case 1: {
                if(timePassed() > 2) {
                    this.textureIndex++;
                    frameCounter = 0;
                    startTime = Date.now();
                    finalTime = 0;
                    startTimer = true;
                    controlsDisabled = false;
                }
                break;
            }
            case 2: {
                if(timePassed() > 2) {
                    UILayer.splice(UILayer.indexOf(this), 1);
                }
                break;
            }
        }
        frameCounter++;
    };
    UILayer.push(light);

    Client.connect();
}