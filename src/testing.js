/* Code that is used for testing functionality*/

function loadCollisionTest() {
    debug = true;
    Camera.main.translation = [0, 30, 0];
    Camera.main.rotation = [-Math.PI/2, 0, 0];
    const sandbox = new SceneNode();
    sandbox.addMesh(["models/sandbox.fbx"]).then(() => {
        sandbox.scale = [0.01, 0.01, 0.01];
        sandbox.translation = [5, 0, 1];
    });
    
    const object = new SceneNode();
    object.addMesh(["models/cube.obj"]);
    object.translation = [-2, 1, 2];
    object.rotation = [0, Math.PI/4,0];
    const objectCollider = new CollisionPlane();
    objectCollider.translation = [0, 1.5, 0];

    object.addCollisionPlane(objectCollider);
    const player = new SceneNode();
    player.addMesh(["models/cube.obj"]);
    player.translation = [0, 1, 10];
    const c = new CollisionPlane();
    c.translation = [0, 5, 0];
    c.scale = [1.5, 1.5, 1.5];
    player.addCollisionPlane(c);
    player.name = "player";

    player.update = () => {
        Camera.main.translation = vec.add(player.translation, [0, 30, 0]);
        if(input.up) {
            player.translate(0, 0, -0.1);
        }

        if(input.down) {
            player.translate(0, 0, 0.1);
        }

        if(input.left) {
            player.translate(-0.1, 0, 0);
        }


        if(input.right) {
            player.translate(0.1, 0, 0);
        }

        player.collisionStep();
        
    }

    
    sceneGraph.root.addChild(sandbox);
    sceneGraph.root.addChild(object);
    sceneGraph.root.addChild(player);

}

function loadHillTest() {
    debug = true;
    Camera.main.translation = [30, 20, 30];
    Camera.main.rotation = [-Math.PI/8, Math.PI/4, 0];
    const map = new SceneNode();
    map.addMesh(['models/hilltest.fbx']);
    map.scale = [2, 2, 2];
    const normals = new GroundNormals("textures/hill_test_normals.png", map, 51.2);

    const player = new SceneNode();
    player.addMesh(['models/cube.obj']);
    player.translation = [0, 10, 20];
    let yVel = 0;
    let groundLevel = 1;
    player.update = () => {
        
        const norm = normals.getNormalAt(player.translation[0], player.translation[2]);
        
        const grav = 0.1;
        const stepLength = 0.5;
        
        if(input.up) {

            let zd = -stepLength;
            let yd = 0;
            
            if(norm[1] != 1) {
                //ground gradient not flat
                
                const a = vec.angle(norm, [0, 0, -1]);
                if(a < Math.PI/2) {
                    //Going down hill
                    zd =  -stepLength * Math.cos(Math.PI/2 - a);
                    yd =  -stepLength * Math.sin(Math.PI/2 - a);
                    
                } else {
                    //going up

                    zd =  -stepLength * Math.cos(a - Math.PI/2);
                    yd =  stepLength * Math.sin(a - Math.PI/2);
                }

                groundLevel += yd;
            }
            
            player.translate(0, yd, zd);
        }
        if(input.down) {
            
            let zd = stepLength;
            let yd = 0;
            
            if(norm[1] != 1) {
                //ground gradient not flat
                
                const a = vec.angle(norm, [0, 0, 1]);
                if(a < Math.PI/2) {
                    //Going down hill
                    zd =  stepLength * Math.cos(Math.PI/2 - a);
                    yd =  -stepLength * Math.sin(Math.PI/2 - a);
                    
                } else {
                    //going up

                    zd =  stepLength * Math.cos(a - Math.PI/2);
                    yd =  stepLength * Math.sin(a - Math.PI/2);
                }

                groundLevel += yd;
            }
            
            player.translate(0, yd, zd);
        }

        yVel -= grav;
        player.translate(0, yVel, 0);
        if(player.translation[1] < groundLevel) {
            player.translation[1] = groundLevel;
            yVel = 0;
        }
    }

    sceneGraph.root.addChild(map);
    sceneGraph.root.addChild(player);
}

function loadHillTest2() {

    let heightMapDisplay = new UIPanel(8, 1, 10, 7.68, ["textures/brands_hatch_heights.png"]);
    let playerMarker = new UIPanel(5, 1, 0.5, 0.5, ["textures/default.png"]);
    UILayer.push(playerMarker);
    UILayer.push(heightMapDisplay);

    let groundHeights;
    let allClientsLoaded = true;
    toggleHUD = true;

    let car;
    let playerID;
    let networkCars = new Map();

    const startWidth = 25;
    const startHeight = 25;

    // Initialize camera with proper aspect ratio
    const canvas = document.getElementById("c");
    const aspectRatio = canvas.width / canvas.height;
    Camera.main.displayHeight = startHeight;
    Camera.main.displayWidth = startHeight * aspectRatio;
    Camera.main.translation = [0, 0, 15];
    Camera.main.rotation = [0, 0, 0];

    let cameraRotationY = 0;
    let cameraLagFactor = 0.1;

    car = new Car();

    let carYVelocity = 0;
    let rotateSpeed = 0;

    let carRoll = 0;
    let carYaw = 0;

    let carRotationY = 0;

    speedo.maxSpeed = TERMINAL_VEL;
    let terminalVelocity = TERMINAL_VEL;

    let acceleration = ACCELERATION;

    let boostTimer = 0;

    let groundLevel = 90;

    let startTimer = false;
    let startTime = 0;
    let finalTime = 0;
    let lastStartLineCollision = false;

    let controlsDisabled = true;

    let checkpointStack = [];
    let requiredCheckpoints = ["checkpoint.001", "checkpoint.002"];

    let lapCount = 1;
    let gameFinished = false;

    audio.reset();

    // Timer display functions
    function formatTime(milliseconds) {
        const totalSeconds = milliseconds / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const centiseconds = Math.floor((totalSeconds % 1) * 100);
        return `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
    }

    function updateTimerDisplay() {
        const timerDisplay = document.getElementById("timer-display");

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
        const lapCounter = document.getElementById("lap-counter");
        lapCounter.textContent = `${lapCount}/${NUM_LAPS}`;
    }

    function getCheckpointNumber(checkpointName) {
        return parseInt(checkpointName.slice(-1));
    }

    function allCheckpointsPassed() {
        if (
            checkpointStack.length === requiredCheckpoints.length &&
            checkpointStack.every(
                (val, idx) => val === requiredCheckpoints[idx]
            )
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
        return x >= 0
            ? ((1.2 * x - 1.2) / (1 + Math.abs(1.2 * x - 1.2)) + 0.55) / 1.5
            : (-1 * ((0.5 * -x - 5) / (1 + Math.abs(0.5 * -x - 5)) + 0.9)) /
                  0.12222;
    }

    const boostSfxEle = audio.loadAudio("sfx_boost");
    const obstacleCrashSfxEle = audio.loadAudio("sfx_obstacle_crash");
    const nextLapReachedSfxEle = audio.loadAudio("sfx_next_lap_reached");
    const raceFinishedSfxEle = audio.loadAudio("sfx_race_finished");

    car.node.update = () => {
        
        // Input handling
        if (!controlsDisabled) {
            // Acceleration
            if (input.up || currentGamepad.isHeld("RT")) {
                if (input.up) {
                    car.velocityXZ += acceleration;
                } else {
                    car.velocityXZ +=
                        acceleration * currentGamepad.getRightTriggerValue();
                }
            }

            // Deceleration
            if (input.down || currentGamepad.isHeld("LT")) {
                if (input.down) {
                    car.velocityXZ -= BREAK_FRICTION;
                } else {
                    car.velocityXZ -=
                        BREAK_FRICTION * currentGamepad.getLeftTriggerValue();
                }

                if (car.velocityXZ < MAX_REVERSE_VEL) {
                    car.velocityXZ = MAX_REVERSE_VEL;
                }
            }

            if (input.drift || currentGamepad.isHeld("X")) {
                car.velocityXZ -= DRIFT_FRICTION;
            }

            // Car Movement
            // Using one big if-else statement so only one block can run at a time
            if (Math.abs(car.velocityXZ) > 0.5) {
                // Analog Movement
                const absLeftXAxis = Math.abs(currentGamepad.getLeftXAxis());
                if (currentGamepad.getLeftXAxis() < -0.15) {
                    
                    carRotationY += rotateSpeed * absLeftXAxis;

                    //car animation logic
                    if (car.velocityXZ > 0) {
                        carRoll += CAR_ROLL_ANGULAR_ACC;
                        if (carRoll > MAX_CAR_ROLL) {
                            carRoll = MAX_CAR_ROLL;
                        }
                        if (currentGamepad.isHeld("X")) {
                            carYaw -= CAR_YAW_ANGULAR_ACC;
                            if (carYaw < -MAX_CAR_YAW) {
                                carYaw = -MAX_CAR_YAW;
                            }
                        }
                    }
                } else if (currentGamepad.getLeftXAxis() > 0.15) {
                    
                    carRotationY -= rotateSpeed * absLeftXAxis;

                    //car animation logic
                    if (car.velocityXZ > 0) {
                        carRoll -= CAR_ROLL_ANGULAR_ACC;
                        if (carRoll < -MAX_CAR_ROLL) {
                            carRoll = -MAX_CAR_ROLL;
                        }
                        if (currentGamepad.isHeld("X")) {
                            carYaw += CAR_YAW_ANGULAR_ACC;
                            if (carYaw > MAX_CAR_YAW) {
                                carYaw = MAX_CAR_YAW;
                            }
                        }
                    }
                }
                // Digital Movement
                else if (input.left || currentGamepad.isHeld("DPad-Left")) {
                    const r = input.drift
                        ? rotateSpeed * DRIFT_TURN_FACTOR
                        : rotateSpeed;
                    
                    carRotationY += r; //* currentGamepad.getLeftXAxis(); // disabled since this breaks the camera

                    //car animation logic
                    if (car.velocityXZ > 0) {
                        carRoll += CAR_ROLL_ANGULAR_ACC;
                        if (carRoll > MAX_CAR_ROLL) {
                            carRoll = MAX_CAR_ROLL;
                        }

                        if (input.drift) {
                            carYaw -= CAR_YAW_ANGULAR_ACC;
                            if (carYaw < -MAX_CAR_YAW) {
                                carYaw = -MAX_CAR_YAW;
                            }
                        }
                    }
                } else if (
                    input.right ||
                    currentGamepad.isHeld("DPad-Right")
                ) {
                    const r = input.drift
                        ? rotateSpeed * DRIFT_TURN_FACTOR
                        : rotateSpeed;
                    
                    carRotationY -= r; //* currentGamepad.getLeftXAxis(); // disabled since this breaks the camera

                    //car animation logic
                    if (car.velocityXZ > 0) {
                        carRoll -= CAR_ROLL_ANGULAR_ACC;

                        if (carRoll < -MAX_CAR_ROLL) {
                            carRoll = -MAX_CAR_ROLL;
                        }
                    }

                    if (input.drift) {
                        carYaw += CAR_YAW_ANGULAR_ACC;
                        if (carYaw > MAX_CAR_YAW) {
                            carYaw = MAX_CAR_YAW;
                        }
                    }
                }
            }

            // Independent Camera Rotation (used for testing)
            // if (currentGamepad.getRightXAxis() < -0.15) {
            //     carRotationY -= rotateSpeed * -currentGamepad.getRightXAxis();
            // }
            // if (currentGamepad.getRightXAxis() > 0.15) {
            //     carRotationY += rotateSpeed * currentGamepad.getRightXAxis();
            // }
        }

        //Car animations
        car.node.getChild("carModel").rotation = [0, 0, -carRoll];
        car.node.getChild("carModel").rotateRelative(0, -carYaw, 0);

        carRoll *= CAR_ROLL_REDUCE_FACTOR;
        carYaw *= CAR_YAW_REDUCE_FACTOR;
        car.node.getChild("carModel").translation = [
            0,
            CAR_HOVER_AMPLITUDE *
                Math.cos(
                    (2 * Math.PI * CAR_HOVER_FREQUENCY * performance.now()) /
                        1000
                ),
            0,
        ];
        //Car boost animation
        //First layer booster
        const booster1 = car.node.getChildByMesh("booster_1");

        if (booster1) {
            const a = 0.05;
            const f = 8;
            const vibration =
                a * Math.sin((2 * Math.PI * performance.now() * f) / 1000);

            const minScale = 0.3;
            const scale = Math.min(
                ((1 - minScale) * Math.abs(car.velocityXZ)) / TERMINAL_VEL +
                    minScale +
                    vibration,
                1
            );

            booster1.scale = [scale, scale, scale];
        }
        //Second layer booster
        const booster2 = car.node.getChildByMesh("booster_2");
        if (booster2) {
            const a = 0.05;
            const f = 8;
            const vibration =
                a * Math.sin((2 * Math.PI * performance.now() * f) / 1000);

            const scale = Math.min(
                Math.abs(car.velocityXZ) / TERMINAL_VEL + vibration,
                1
            );
            booster2.scale = [scale, scale, scale];
        }

        //Camera movement calculations.
        let rotationDiff = carRotationY - cameraRotationY;
        let cameraRotationStep = rotationDiff * cameraLagFactor;
        Camera.main.rotateRelative(0, cameraRotationStep, 0);
        cameraDisp = vec.subtract(
            Camera.main.translation,
            car.node.translation
        );

        newPos = vec.rotate(cameraDisp, 0, cameraRotationStep, 0);

        Camera.main.translation = vec.add(newPos, car.node.translation);

        cameraRotationY += cameraRotationStep;

        //Accelerations

        if (car.velocityXZ > 0) {
            //Car going fowards.
            cameraLagFactor = 0.1; // Move this out
            car.velocityXZ -= FRICTION;
            if (car.velocityXZ < 0) {
                car.velocityXZ = 0;
            }
            if (car.velocityXZ > terminalVelocity) {
                if (terminalVelocity == MAGNET_TERMINAL_VEL) {
                    car.velocityXZ -= MAGNET_FRICTION * 2;
                } else {
                    car.velocityXZ -= POST_TERMINAL_FRICTION;
                }
            }
        }
        if (car.velocityXZ < 0) {
            //Car going backwards
            cameraLagFactor = 0.3;
            car.velocityXZ += FRICTION;
            if (car.velocityXZ > 0) {
                car.velocityXZ = 0;
            }
        }

        if (car.velocityXZ == 0) {
            rotateSpeed = 0;
        } else {
            rotateSpeed =
                MAX_ROTATE_SPEED * rotateSpeedFunction(car.velocityXZ);
        }

        
        carYVelocity = carYVelocity + GRAVITY;

        // Translation of the car in the new direction.
        const carDelta = vec.rotate([0, 0, -1 * car.velocityXZ], 0, carRotationY, 0);

        car.node.translate(carDelta[0], carYVelocity, carDelta[2]);
        const camDelta = carDelta;
        const camYDisp = 30;
        Camera.main.translate(camDelta[0], ((car.node.translation[1] + camYDisp) - Camera.main.translation[1])/10, camDelta[2]);
        
        playerMarker.x = 8 + (car.node.translation[0] / 50000) * 5;
        playerMarker.y = 1 + -(car.node.translation[2] / 50000) * 5;
        playerMarker.recalculateVertices();
        //console.log(groundLevel);
        
        groundLevel = groundHeights.getHeightAt(car.node.translation[0], car.node.translation[2]);
        
        if (car.node.translation[1] - 10 < groundLevel) {
            //If car phases through ground
            car.node.translation[1] = groundLevel + 10;
            carYVelocity = 0;
        }

        car.node.collisionStep(); //Check for collisions

        let currentStartLineCollision = false;

        car.node.colliders.forEach((c) => {
            if (c.collided) {
                const collisions = c.collisions;

                for (let i = 0; i < collisions.length; i++) {
                    const t = collisions[i].sceneNode.tag;
                    const p = collisions[i].sceneNode;
                    if (debug) {
                        console.log(t);
                    }
                    if (t == "wall") {
                        
                        // //A collision resulted. Add negative of delta pos to undo.
                        // let carInv = vec.scale(-1, carDelta);
                        // let camInv = vec.scale(-1, camDelta);
                        // car.velocityXZ = 0;
                        // car.node.translate(carInv[0], carYVelocity, carInv[2]);
                        // Camera.main.translate(camInv[0], camInv[1], camInv[2]);

                        //New collision code
                        
                        let MTV = collisions[i].MTV;
                        let norm = collisions[i].normal;
                        let carVelVector = vec.rotate([0, 0, -1 * car.velocityXZ], 0, carRotationY, 0);
                        let deflectAngle = vec.angle(carVelVector, norm) - Math.PI/2;

                        if(deflectAngle < Math.PI/4 && Math.abs(car.velocityXZ) >= MIN_DEFLECT_VEL) {
                            //Only for angles smaller than 45 and speeds great enough
                            let cross = vec.cross(carVelVector, norm);
                        
                            if(cross[1] > 0) {
                                carRotationY += deflectAngle;
                            } else if(cross[1] < 0) {
                                carRotationY -= deflectAngle;
                            }

                            car.velocityXZ -= WALL_FRICTION;
                            if(car.velocityXZ < MAX_REVERSE_VEL) {
                                car.velocityXZ = MAX_REVERSE_VEL;
                            }

                        } else {
                            //Lose all velocity because colliding with wall head on
                            car.velocityXZ = 0;
                        }
                        
                        car.node.translate(MTV[0], MTV[1], MTV[2]);
                        Camera.main.translate(MTV[0], MTV[1], MTV[2]);

                        
                        
                        
                    
                    } else if (t == "ramp") {
                        //collision with ramp
                        carYVelocity += (1 / 25) * Math.abs(car.velocityXZ);
                    } else if (t == "boost") {
                        boostTimer = 1;
                        boostSfxEle.play();
                    } else if (t == "start") {
                        currentStartLineCollision = true;
                    } else if (t == "obstacle" || t == "car") {
                        if (t == "obstacle") {
                            obstacleCrashSfxEle.play();
                            for (let i = 0; i < 4; i++) {
                                const obstacleShard = new SceneNode();

                                const obstacleMesh = p.getChildren("mesh")[0].mesh;

                                obstacleShard.mesh = obstacleMesh.reuse();
                                obstacleShard.scaleBy(0.5, 0.5, 0.5);
                                obstacleShard.translation = [
                                    ...car.node.translation,
                                ];
                                obstacleShard.rotation = [...p.rotation];
                                sceneGraph.root.addChild(obstacleShard);

                                let carDirNorm = vec.normalize(vec.rotate([0, 0, -1*car.velocityXZ], 0, -1*carRotationY, 0));
                                if (car.velocityXZ < 0) {
                                    carDirNorm = -carDirNorm;
                                }
                                let baseAngle = Math.atan2(
                                    carDirNorm[2],
                                    carDirNorm[0]
                                );
                                let maxAngleOffset = Math.PI / 4;
                                let angle =
                                    baseAngle +
                                    ((i - 1.5) * maxAngleOffset) / 2 +
                                    (Math.random() - 0.5) * maxAngleOffset;
                                let speed = 5 + Math.random() * 2;

                                let velocityVec = [
                                    Math.cos(angle) * speed +
                                        carDirNorm[0] *
                                            Math.abs(car.velocityXZ) *
                                            0.8,
                                    2 + Math.random() * 3,
                                    Math.sin(angle) * speed +
                                        carDirNorm[2] *
                                            Math.abs(car.velocityXZ) *
                                            0.8,
                                ];

                                let frames = 40;
                                obstacleShard.update = function () {
                                    this.translate(
                                        velocityVec[0],
                                        velocityVec[1],
                                        velocityVec[2]
                                    );
                                    velocityVec[1] -= 0.3;
                                    frames--;
                                    if (frames <= 0) {
                                        this.remove();
                                    }
                                };
                            }
                            p.remove();
                        }
                        if (car.velocityXZ <= 8.5 && t == "car") {
                            // potential logic for rebounding off of collided cars
                            // if (t == "car") {
                            //     let carInv = vec.scale(-1, carDelta);
                            //     let camInv = vec.scale(-1, camDelta);
                            //     let scale = 5;
                            //     car.velocityXZ = - 1 / 10 * car.velocityXZ;
                            //     car.node.translate(scale * carInv[0], carYVelocity, scale * carInv[2]);
                            //     camera.translate(scale * camInv[0], camInv[1], scale * camInv[2]);
                            // }
                            break;
                        }
                        controlsDisabled = true;
                        let speed = Math.abs(car.velocityXZ);
                        // proprotional to speed makes spinning quicker when you move slower, proportional to inverse speed makes spinning quicker when you move faster
                        let rotationFrames = Math.min(
                            60,
                            Math.round((30 * 15) / speed)
                        );
                        let direction = Math.random();
                        let rotationStep = (4 * Math.PI) / rotationFrames;
                        if (direction < 0.5) {
                            rotationStep = -1 * rotationStep;
                        }

                        if (!car.spinning) {
                            car.spinning = true;
                            car.spinFramesLeft = rotationFrames;
                            car.originalUpdate = car.node.update;
                            car.node.update = function () {
                                if (car.spinFramesLeft > 0) {
                                    carRotationY += rotationStep;
                                    // Slow down the car drastically while spinning
                                    car.velocityXZ *= 0.95;
                                    car.spinFramesLeft--;
                                    if (car.spinFramesLeft == 0) {
                                        car.velocityXZ = 0;
                                    }
                                } else {
                                    car.spinning = false;
                                    // Restore the original update function after spinning
                                    car.node.update = car.originalUpdate;
                                    if (!gameFinished) {
                                        controlsDisabled = false;
                                    }
                                }
                                car.originalUpdate && car.originalUpdate.call(this);
                            };
                        }
                    } else if (
                        t == "magnet" &&
                        car.node.translation[1] < groundLevel + 1
                    ) {
                        terminalVelocity = MAGNET_TERMINAL_VEL;
                        if (Math.abs(car.velocityXZ) > 2) {
                            acceleration = ACCELERATION / 2;
                        } else {
                            acceleration = ACCELERATION; // to prevent the car from getting stuck
                        }
                    } else if (t == "checkpoint") {
                        const checkpointName = p.name;
                        let checkpointNumber = getCheckpointNumber(checkpointName);
                        if (!checkpointStack.includes(checkpointName)) {
                            if (
                                checkpointStack.length == 0 &&
                                checkpointNumber == 1
                            ) {
                                checkpointStack.push(checkpointName);
                            } else if (
                                checkpointStack.length != 0 &&
                                checkpointNumber ==
                                    getCheckpointNumber(
                                        checkpointStack[checkpointStack.length - 1]
                                    ) +
                                        1
                            ) {
                                checkpointStack.push(checkpointName);
                            }
                        } else if (
                            checkpointStack.includes(
                                "checkpoint.00" + (checkpointNumber + 1)
                            )
                        ) {
                            checkpointStack.pop();
                        }
                    }
                }
            } else {
                terminalVelocity = TERMINAL_VEL;
                acceleration = ACCELERATION;
            }

        });

        // Handle start line collision only on transition from not colliding to colliding
        if (currentStartLineCollision && !lastStartLineCollision) {
            if (lapCount == NUM_LAPS) {
                if (allCheckpointsPassed()) {
                    //Race finished.
                    finalTime = Date.now() - startTime;
                    startTimer = false;
                    controlsDisabled = true;
                    gameFinished = true;

                    //TODO: Alert other players:
                    sendRaceFinished(finalTime);
                    leaderboard.show();

                    raceFinishedSfxEle.play();
                }
            } else if (allCheckpointsPassed()) {
                lapCount++;
                updateLapCounter();

                nextLapReachedSfxEle.play();
            }
            resetCheckpoints();
        }

        lastStartLineCollision = currentStartLineCollision;

        // Update timer display every frame
        updateTimerDisplay();

        // Update speedometer every frame
        updateSpeedometer(car.velocityXZ);

        // logic for boost pads:
        if (boostTimer > 0) {
            if (car.velocityXZ < BOOST_TERMINAL_VEL) {
                car.velocityXZ += POST_TERMINAL_FRICTION;
                /* Cancels out POST_TERMINAL_FRICTION so that the car can keep accelerating
                past the normal terminalVelocity
                */
            }
            boostTimer += 1;
            if (boostTimer >= 60) {
                boostTimer = 0;
            }
        }

        // Apply car rotation to actual sceneNode
        car.node.rotation = [0, carRotationY + Math.PI, 0];

        // Update Camera.main zoom with velocity while maintaining aspect ratio
        const canvas = document.getElementById("c");
        const aspectRatio = canvas.width / canvas.height;
        const zoomHeight = startHeight + car.velocityXZ * 0.5;
        Camera.main.displayHeight = zoomHeight;
        Camera.main.displayWidth = zoomHeight * aspectRatio;

        //Update leaderboard
        leaderboard.update();
    };

    const carModel = new SceneNode();
    //Adding mesh as seperate scene node to easily add animation to model while keeping base transformation simple.
    carModel.addMesh(["models/car.fbx"]).then(() => {
        //Changes car texture based on player ID.
        if(Client.id > 1) {
            loadTextureAsync(`textures/car_player_${Client.id}.png`).then((texture) => {
                carModel.getChild("Cube").mesh.texture = texture;
            });
        }
       
    });
    carModel.name = "carModel";
    car.node.addChild(carModel);

    const c = new CollisionPlane();
    car.node.addCollisionPlane(c);
    c.scale = [2, 1, 3];

    ground = new SceneNode();
    
    ground.addMesh(["models/track02.fbx"]).then(() => {
        startLine = ground.getChild("startline");
        startLine.tag = "start";

        /*
        for(let i = 1; i <= 111; i++ ) {
            ground.getChild(`railing.${String(i).padStart(3, '0')}`).tag = "wall";
        }
        */

        ground.getChildren("solid").forEach((element) => {
            element.tag = "wall";
        });

        /*
        for(let i = 1; i <= 24; i++) {
            ground.getChild(`cube.${String(i).padStart(3, '0')}`).tag = "wall";
        }
        */

        ground.getChildren("magnetpad").forEach((e) => {
            e.tag = "magnet";
        });

        ground.getChildren("ramp").forEach((e) => {
            e.tag = "ramp";
        });

        ground.getChildren("obstacle").forEach((e) => {
            e.tag = "obstacle";
            const meshChild = e.getChildren("mesh")[0];
            meshChild.update = () => {
                meshChild.rotate(0, 0.1, 0.07);
            };
        });

        ground.getChildren("boost").forEach((e) => {
            e.tag = "boost";
        });

        ground.getChildren("checkpoint").forEach((e) => {
            e.tag = "checkpoint";
            // Preserve the original name from the 3D model for checkpoint identification
            if (!e.name) {
                e.name = e.tag; // Fallback if name isn't set
            }
        });

        car.node.scaleBy(3, 3, 3);
        car.node.rotate(0, Math.PI, 0);

        Camera.main.rotate(CAMERA_DOWN_TILT, 0, 0);

        //Car spawn point. Position needs to be linked to Client.id
        //Start line assumed to be oriented so that it is pointing in the -z direction.
        const spawnSeperation = 40;

        sceneGraph.preCalcMatrices(startLine);
        const startLinePos = mat.getTranslationVector(startLine.world);

        car.node.translation = vec.add(
            [startLinePos[0], 0, startLinePos[2]],
            [-3 * spawnSeperation + spawnSeperation * 0, groundLevel, 0]
        );

        Camera.main.translation = vec.add(car.node.translation, [0, 10, 100]);
        //Camera.main.rotation = [-Math.PI/2, 0, 0];
        groundHeights = new GroundHeights("textures/brands_hatch_heights.png", ground.getChild("ground"), 11360/2);
        sceneGraph.preCalcMatrices(ground);
    });
    
    ground.translate(0, 0, 0);
    
    sceneGraph.root.addChild(car.node);
    sceneGraph.root.addChild(ground); 
    

    // Traffic light code
    const light = new UIPanel(10, 5, 5, 10, [
        "textures/light_off.png",
        "textures/light_red.png",
        "textures/light_orange.png",
        "textures/light_green.png",
    ]);

    const raceMusicChoices = [
        "music_race01",
        "music_race02",
        "music_race03",
        "music_race04",
        "music_race05",
        "music_race06",
    ];

    // Choose a random music track
    const raceMusicEle = audio.loadAudio(
        raceMusicChoices[Math.floor(Math.random() * raceMusicChoices.length)]
    );
    raceMusicEle.load();

    const redLightSfxEle = audio.loadAudio("sfx_red_light");
    const orangeLightSfxEle = audio.loadAudio("sfx_orange_light");
    const greenLightSfxEle = audio.loadAudio("sfx_green_light");

    let frameCounter = 0;
    let bufferInput = 0; // stops the player from holding forward input to get a free boost at race start
    light.update = function () {
        const ti = this.textureIndex;
        const timePassed = () => frameCounter / UPDATES_PER_SECOND;

        if (allClientsLoaded) {
            switch (ti) {
                case 0: {
                    if (timePassed() > 2) {
                        // Switch to Red
                        this.textureIndex++;
                        frameCounter = 0;
                        redLightSfxEle.play();
                    }
                    break;
                }
                case 1: {
                    if (timePassed() > 2) {
                        // Switch to Orange
                        this.textureIndex++;
                        frameCounter = 0;
                        orangeLightSfxEle.play();
                    }
                    break;
                }
                case 2: {
                    if (timePassed() > 2) {
                        // Switch to Green
                        // Start the race!
                        this.textureIndex++;
                        frameCounter = 0;
                        startTime = Date.now();
                        leaderboard.timeOffset = startTime;
                        finalTime = 0;
                        startTimer = true;
                        controlsDisabled = false;
                        greenLightSfxEle.play();
                        raceMusicEle.play();
                    }
                    break;
                }
                case 3: {
                    if (
                        (input.up || currentGamepad.isPressed("RT")) &&
                        boostTimer <= 0 &&
                        timePassed() < 0.25
                    ) {
                        // TODO: Check for a button press instead of held button to avoid easy free boosts
                        boostTimer = 0.1;
                        boostSfxEle.play();
                        break;
                    } else if (timePassed() > 2) {
                        // Disable countdown UI
                        UILayer.splice(UILayer.indexOf(this), 1);
                    }
                    break;
                }
            }
            frameCounter++;
        }
    };
    UILayer.push(light);

    function finishedLoading(bufferList) {
        // Create two sources and play them both together.
        var source1 = context.createBufferSource();
        source1.buffer = bufferList[0];

        source1.connect(context.destination);
        source1.noteOn(0);
    }

    clientCar = car;
    //initRaceNetworking();
}
