let toggleHUD = false;

const CAMERA_REL_CAR = [0, 50*0.8, 110*0.8];
const CAMERA_DOWN_TILT = -0.2;  

const NUM_LAPS = 3;

function loadTrack1() {
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

    let cameraRotationY = 0;
    let cameraLagFactor = 0.1;  

    car = new Car();

    let carDirection = vec.rotate([0, 0, -1], 0, 0, 0);
    
    let carYVelocity = 0;
    let rotateSpeed = 0;

    let carRoll = 0;

    let carRotationY = 0;

    speedo.maxSpeed = TERMINAL_VEL;
    let terminalVelocity = TERMINAL_VEL;

    let acceleration = ACCELERATION;

    let boostTimer = 0;

    let groundLevel = 5;

    let startTimer = false;
    let startTime = 0;
    let finalTime = 0;
    let lastStartLineCollision = false;

    let controlsDisabled = true;

    let checkpointStack = [];
    let requiredCheckpoints = ["checkpoint.001", "checkpoint.002"];

    let lapCount = 1;
    let gameFinished = false;

    var musicBuffer = null;
    var soundBuffer = null;
    var audioContext = new AudioContext();

    function loadAudio(elementId, volume = 0.15) {
        // Load file from audio element
        const audioElement = document.getElementById(elementId);
        const track = audioContext.createMediaElementSource(audioElement);

        // Set default volume
        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume;

        // Add modifier based on volume slider (0% to 200% of default volume value)
        const volumeControlGainNode = audioContext.createGain();
        volumeControlGainNode.gain.value = volume;
        const volumeControl = document.querySelector("#volume");
        volumeControl.addEventListener("input", () => {
            volumeControlGainNode.gain.value = volumeControl.value;
        });

        track.connect(gainNode).connect(volumeControlGainNode).connect(audioContext.destination);

        return audioElement;
    }

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

    const boostSfxEle = loadAudio("sfx_boost");
    const obstacleCrashSfxEle = loadAudio("sfx_obstacle_crash");

    car.node.update = () => {
        // Input handling
        if (!controlsDisabled) {

            // Acceleration
            if (input.up || currentGamepad.isPressed("RT")) {
                if (input.up) {
                    car.velocityXZ += acceleration;
                }
                else {
                    car.velocityXZ += acceleration * currentGamepad.getRightTriggerValue();
                }
            }

            // Deceleration
            if (input.down || currentGamepad.isPressed("LT")) {
                if (input.down) {
                    car.velocityXZ -= 0.9;
                } else {
                    car.velocityXZ -= 0.9 * currentGamepad.getLeftTriggerValue();
                }

                if (car.velocityXZ < -4) {
                    car.velocityXZ = -4;
                }
            }

            // Car Movement
            // Using one big if-else statement so only one block can run at a time
            if (Math.abs(car.velocityXZ) > 0.5) {
                
                // Analog Movement
                const absLeftXAxis = Math.abs(currentGamepad.getLeftXAxis());
                if (currentGamepad.getLeftXAxis() < -0.15) {
                    car.node.rotate(0, rotateSpeed * absLeftXAxis, 0);
                    carRotationY += rotateSpeed * absLeftXAxis;

                    carDirection = vec.rotate(carDirection, 0, rotateSpeed * absLeftXAxis, 0);

                    //car animation logic
                    if(car.velocityXZ > 0) {
                        carRoll += CAR_ROLL_ANGULAR_ACC;
                        if(carRoll > MAX_CAR_ROLL) {
                            carRoll = MAX_CAR_ROLL;
                        }
                    }
                }
                else if (currentGamepad.getLeftXAxis() > 0.15) {
                    car.node.rotate(0, -rotateSpeed * absLeftXAxis, 0);
                    carRotationY -= rotateSpeed * absLeftXAxis;

                    carDirection = vec.rotate(carDirection, 0, -rotateSpeed * absLeftXAxis, 0);

                    //car animation logic
                    if(car.velocityXZ > 0) {
                        carRoll -= CAR_ROLL_ANGULAR_ACC;
                        if(carRoll < -MAX_CAR_ROLL) {
                            carRoll = -MAX_CAR_ROLL;
                        }
                    }

                }
                // Digital Movement
                else if ((input.left || currentGamepad.isPressed("DPad-Left"))) {
                    car.node.rotate(0, rotateSpeed, 0);
                    carRotationY += rotateSpeed; //* currentGamepad.getLeftXAxis(); // disabled since this breaks the camera
                    carDirection = vec.rotate(carDirection, 0, rotateSpeed, 0);

                    //car animation logic
                    if(car.velocityXZ > 0) {
                        carRoll += CAR_ROLL_ANGULAR_ACC;
                        if(carRoll > MAX_CAR_ROLL) {
                            carRoll = MAX_CAR_ROLL;
                        }
                    }
                }
                else if ((input.right || currentGamepad.isPressed("DPad-Right"))) {
                    car.node.rotate(0, -rotateSpeed, 0);
                    carRotationY -= rotateSpeed; //* currentGamepad.getLeftXAxis(); // disabled since this breaks the camera
                    carDirection = vec.rotate(carDirection, 0, -rotateSpeed, 0);

                    //car animation logic
                    if(car.velocityXZ > 0) {
                        carRoll -= CAR_ROLL_ANGULAR_ACC;
                        
                        if(carRoll < -MAX_CAR_ROLL) {
                            carRoll = -MAX_CAR_ROLL;
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
        carRoll *= CAR_ROLL_REDUCE_FACTOR;
        car.node.getChild("carModel").translation = [
            0,
            CAR_HOVER_AMPLITUDE * Math.cos(2*Math.PI*CAR_HOVER_FREQUENCY*performance.now()/1000),
            0];
        //Car boost animation
        //First layer booster
        const booster1 = car.node.getChildByMesh("booster_1");
        
        if(booster1) {
            const a = 0.05;
            const f = 8;
            const vibration = a * Math.sin(2 * Math.PI * performance.now() * f / 1000);

            const minScale = 0.3;
            const scale = Math.min((1 - minScale) * Math.abs(car.velocityXZ) / TERMINAL_VEL + minScale + vibration, 1);
            
            booster1.scale = [scale, scale, scale];
        }
        //Second layer booster
        const booster2 = car.node.getChildByMesh("booster_2");
        if(booster2) {
            const a = 0.05;
            const f = 8;
            const vibration = a * Math.sin(2 * Math.PI * performance.now() * f / 1000);

            const scale = Math.min(Math.abs(car.velocityXZ) / TERMINAL_VEL + vibration, 1);
            booster2.scale = [scale, scale, scale];
        }
        
        
        //Camera movement calculations.
        let rotationDiff = carRotationY - cameraRotationY;
        let cameraRotationStep = rotationDiff * cameraLagFactor;
        Camera.main.rotate(0, cameraRotationStep, 0);
        cameraDisp = vec.subtract(Camera.main.translation, car.node.translation);

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
                if(terminalVelocity == MAGNET_TERMINAL_VEL) {
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
            rotateSpeed = MAX_ROTATE_SPEED * rotateSpeedFunction(car.velocityXZ);
        }

        let newcarDirection = vec.scale(car.velocityXZ, carDirection);
        carYVelocity = carYVelocity + GRAVITY;

        

        // Translation of the car in the new direction.
        const carDelta = [newcarDirection[0], carYVelocity, newcarDirection[2]];
        car.node.translate(carDelta[0], carDelta[1], carDelta[2]);
        const camDelta = [
            newcarDirection[0],
            newcarDirection[1],
            newcarDirection[2],
        ];
        Camera.main.translate(camDelta[0], camDelta[1], camDelta[2]);

        if (car.node.translation[1] < groundLevel) {
            //If car phases through ground
            car.node.translation[1] = groundLevel;
            carYVelocity = 0;
        }

        car.node.collisionStep(); //Check for collisions

        let currentStartLineCollision = false;

        if (car.node.collisionPlane.collided) {
            const collisions = car.node.collisionPlane.collisions;

            for (let i = 0; i < collisions.length; i++) {
                const t = collisions[i].parent.tag;
                const p = collisions[i].parent;
                if(debug) {
                    console.log(t);
                }
                if (t == "wall") {
                    //A collision resulted. Add negative of delta pos to undo.
                    let carInv = vec.scale(-1, carDelta);
                    let camInv = vec.scale(-1, camDelta);
                    car.velocityXZ = 0;
                    car.node.translate(carInv[0], carYVelocity, carInv[2]);
                    Camera.main.translate(camInv[0], camInv[1], camInv[2]);
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
                            obstacleShard.scaleBy(20, 20, 20);
                            obstacleShard.translation = [...car.node.translation];
                            obstacleShard.rotation = [...p.rotation];
                            sceneGraph.root.addChild(obstacleShard);

                            let carDirNorm = vec.normalize([
                                carDirection[0],
                                0,
                                carDirection[2],
                            ]);
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
                                    carDirNorm[0] * Math.abs(car.velocityXZ) * 0.8,
                                2 + Math.random() * 3,
                                Math.sin(angle) * speed +
                                    carDirNorm[2] * Math.abs(car.velocityXZ) * 0.8,
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
                                car.node.rotate(0, rotationStep, 0);
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
                } else if (t == "magnet" && car.node.translation[1] < groundLevel + 1) {
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
                    leaderboard.add(Client.id, finalTime);
                    leaderboard.show();

                }
            } else if (allCheckpointsPassed()) {
                lapCount++;
                updateLapCounter();
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
    carModel.addMesh(["models/car.fbx"]);
    carModel.name = "carModel";
    car.node.addChild(carModel);

    car.node.addCollisionPlane(new CollisionPlane());
    car.node.collisionPlane.scale = [2, 1, 3];

    ground = new SceneNode();
    ground.addMesh(["models/track01_new.fbx"]).then(() => {
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
        car.node.rotate(0, Math.PI + startLine.rotation[1], 0);
        
        Camera.main.rotate(CAMERA_DOWN_TILT, startLine.rotation[1], 0);

        //Car spawn point. Position needs to be linked to Client.id
        //Start line assumed to be oriented so that it is pointing in the -z direction.
        const spawnSeperation = 40;
        car.node.translation = vec.add(
            [startLine.translation[0], 0, startLine.translation[2]],
            [-3 * spawnSeperation + spawnSeperation * Client.id, groundLevel, 0]
        );

        Camera.main.translation = vec.add(
            car.node.translation, 
            CAMERA_REL_CAR
        );
 
    });

    ground.translate(0, -5, -50);

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
    const raceMusicEle = loadAudio(raceMusicChoices[Math.floor(Math.random() * raceMusicChoices.length)]);

    const redLightSfxEle = loadAudio("sfx_red_light");
    const orangeLightSfxEle = loadAudio("sfx_orange_light");
    const greenLightSfxEle = loadAudio("sfx_green_light");

    let frameCounter = 0;
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
                    if (timePassed() > 2) {
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
    initRaceNetworking();
}
