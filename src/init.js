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

const gravity = -0.1;

Client.onOpen = (e) => {
    const msg = {
        type: "get_unique_id",
    };
    Client.webSocket.send(JSON.stringify(msg));
};

Client.onMessage = (e) => {
    const msg = JSON.parse(e.data);
    switch(msg.type) {
        case "set_id":
            playerID = msg.id;
            Client.webSocket.send(JSON.stringify({
                type:"add_player",
                player:{
                    id:playerID,
                    translation: car.translation,
                    rotation: car.rotation,
                    scale: car.scale
                }
            }));
            break;
        case "add_player" :{
            //attach player node to scene root.
            let p = new SceneNode();
            p.translation = msg.player.translation;
            p.rotation = msg.player.rotation;
            p.scale = msg.player.scale;
            p.mesh = new Mesh(['models/car.obj'], 'textures/car.png');
            sceneGraph.root.addChild(p);
            
            networkCars.set(msg.player.id, p);

            break;
        }
        case "player_update":{
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

    function checkAABBCollision(aPos, aScale, bPos, bScale) {
        let aMin = [
            aPos[0] - aScale[0],
            aPos[1] - aScale[1],
            aPos[2] - aScale[2]
        ];
        let aMax = [
            aPos[0] + aScale[0],
            aPos[1] + aScale[1],
            aPos[2] + aScale[2]
        ];

        let bMin = [
            bPos[0] - bScale[0],
            bPos[1] - bScale[1],
            bPos[2] - bScale[2]
        ];
        let bMax = [
            bPos[0] + bScale[0],
            bPos[1] + bScale[1],
            bPos[2] + bScale[2]
        ];

        return (
            aMin[0] <= bMax[0] &&
            aMax[0] >= bMin[0] &&
            aMin[1] <= bMax[1] &&
            aMax[1] >= bMin[1] &&
            aMin[2] <= bMax[2] &&
            aMax[2] >= bMin[2]
        );
    }

    function rotateSpeedFunction(x) {
        return x >= 0 ? ((1.2 * x - 1.2) / (1 + Math.abs(1.2 * x - 1.2)) + 0.55) / 1.5 :
            -1 * ((0.5 * -x - 5) / (1 + Math.abs(0.5 * -x - 5)) + 0.9) / 0.12222;
    }

    camera.translate(0, 10, 0);
    camera.displayWidth = startWidth;
    camera.displayHeight = startHeight;
    car = new SceneNode();
    car.scaleBy(3, 3, 3);
    car.translate(0, 100, -50);
    car.rotate(0, Math.PI, 0);

    let carDirection = [0, 0, -1];
    let velocity = 0;
    let carYVelocity = 0;
    let rotateSpeed = 0;
    let maxRotateSpeed = 0.05;

    let carRotationY = 0;
    let cameraRotationY = 0;
    let cameraLagFactor = 0.1;

    let terminalVelocity = 17;
    let boostTimer = 0;

    car.update = () => {
        if (input.up) {
            velocity += 0.4;
        }
        if (input.down) {
            velocity -= 0.6;
            if (velocity < -4) {
                velocity = -4;
            }
        }
        if (input.left && Math.abs(velocity) > 0.5) {
            car.rotate(0, rotateSpeed, 0);
            carRotationY += rotateSpeed;

            carDirection = mat3x3.multiplyVec(mat3x3.rotate(0, rotateSpeed, 0), carDirection)
        }
        if (input.right && Math.abs(velocity) > 0.5) {
            car.rotate(0, -rotateSpeed, 0);
            carRotationY -= rotateSpeed;

            carDirection = mat3x3.multiplyVec(mat3x3.rotate(0, -rotateSpeed, 0), carDirection)
        }

        let rotationDiff = carRotationY - cameraRotationY;
        let cameraRotationStep = rotationDiff * cameraLagFactor;
        camera.rotate(0, cameraRotationStep, 0);
        cameraDisp = vec.subtract(camera.translation, car.translation)

        newPos = mat3x3.multiplyVec(mat3x3.rotate(0, cameraRotationStep, 0), cameraDisp);

        camera.translation = vec.add(newPos, car.translation)

        cameraRotationY += cameraRotationStep;

        if (velocity > 0) {
            cameraLagFactor = 0.1;
            velocity -= 0.2;
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

        let newY = car.translation[1] + carYVelocity;
        if (newY < 0) {
            newY = 0;
            carYVelocity = 0;
        }

        let proposedPosition = [car.translation[0] + newcarDirection[0], newY, car.translation[2] + newcarDirection[2]];

        let carScale = [6, 3, 10];
        let cubeScale = [10, 10, 10];
        let rampScale = [10, 2, 10];

        if (!checkAABBCollision(proposedPosition, carScale, cube.translation, cubeScale)) {
            car.translate(newcarDirection[0], carYVelocity, newcarDirection[2]);
            camera.translate(newcarDirection[0], newcarDirection[1], newcarDirection[2]);
        }
        else {
            velocity = 0;
        }

        if (!checkAABBCollision(proposedPosition, carScale, ramp.translation, rampScale)) {
            car.translate(newcarDirection[0], carYVelocity, newcarDirection[2]);
            camera.translate(newcarDirection[0], newcarDirection[1], newcarDirection[2]);
        }
        else {
            carYVelocity += velocity / 4;
            if (carYVelocity > 2) {
                carYVelocity = 2;
            }

            // logic for boost pads:
            // velocity += 0.5;
            // terminalVelocity = 25;
            // boostTimer = 1;

            car.translate(newcarDirection[0], carYVelocity, newcarDirection[2]);
            camera.translate(newcarDirection[0], newcarDirection[1], newcarDirection[2]);
        }

        // logic for boost pads:
        if (boostTimer > 0) {
            if (velocity < 25) {
                velocity += 0.5;
            }
            boostTimer += 1;
            if (boostTimer >= 60) {
                boostTimer = 0;
                terminalVelocity = 17;
            }
        }

        camera.displayWidth = startWidth + velocity * 0.5;
        camera.displayHeight = startHeight + velocity * 0.5;

        if(Client.connected) {
            const msg = {
                type:"player_update",
                player:{
                    translation: car.translation,
                    rotation: car.rotation,
                    scale:car.scale,
                    id: playerID
                }
            };

            Client.webSocket.send(JSON.stringify(msg));
        }
    };
    car.mesh = new Mesh(["models/car.obj"], "textures/car.png");

    ground = new SceneNode();
    ground.mesh = new Mesh(["models/ground.obj"], "textures/track.png");
    ground.translate(0, -5, -50);
    ground.scaleBy(500, 500, 500);

    cube = new SceneNode();
    cube.mesh = new Mesh(["models/cube.obj"], "textures/cubetexture.png");
    cube.translate(0, 5, -100);
    cube.scaleBy(10, 10, 10);

    ramp = new SceneNode();
    ramp.mesh = new Mesh(["models/ramp.obj"]);
    ramp.translate(50, -5, -100);
    ramp.scaleBy(10, 2, 10);

    sceneGraph.root.addChild(car);
    sceneGraph.root.addChild(ground);
    sceneGraph.root.addChild(cube);
    sceneGraph.root.addChild(ramp);

    Client.connect();
}