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
            p.addMesh(["models/car.obj"]);
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
    //debug = true;

    camera.translate(0, 10, 0);
    camera.displayWidth = startWidth;
    camera.displayHeight = startHeight;
    car = new SceneNode();
    car.scaleBy(3, 3, 3);
    car.translate(0, 100, -50);
    car.rotate(0, Math.PI, 0);


    const gravity = -0.1;

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

    function rotateSpeedFunction(x) {
        return x >= 0 ? ((1.2 * x - 1.2) / (1 + Math.abs(1.2 * x - 1.2)) + 0.55) / 1.5 :
            -1 * ((0.5 * -x - 5) / (1 + Math.abs(0.5 * -x - 5)) + 0.9) / 0.12222;
    }

    car.update = () => {

        // Input handling
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

        //

        let rotationDiff = carRotationY - cameraRotationY;
        let cameraRotationStep = rotationDiff * cameraLagFactor;
        camera.rotate(0, cameraRotationStep, 0);
        cameraDisp = vec.subtract(camera.translation, car.translation)

        newPos = mat3x3.multiplyVec(mat3x3.rotate(0, cameraRotationStep, 0), cameraDisp);

        camera.translation = vec.add(newPos, car.translation)

        cameraRotationY += cameraRotationStep;

        //Accelerations

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

        
        // Translation of the car in the new direction.
        const carDelta = [newcarDirection[0], carYVelocity, newcarDirection[2]];
        car.translate(carDelta[0], carDelta[1], carDelta[2]);
        const camDelta = [newcarDirection[0], newcarDirection[1], newcarDirection[2]];
        camera.translate(camDelta[0], camDelta[1], camDelta[2]);

        if(car.translation[1] < 0) {
            //If car phases through ground
            car.translation[1] = 0;
            carYVelocity = 0;
        }

        car.collisionStep(); //Check for collisions

        if(car.collisionPlane.collided) {
            const collisions = car.collisionPlane.collisions;
            
            for(let i = 0; i < collisions.length; i++) {

                const t = collisions[i].parent.tag;

                if(t == "wall") {
                    //A collision resulted. Add negative of delta pos to undo.
                    let carInv = vec.scale(-1, carDelta);
                    let camInv = vec.scale(-1, camDelta);
                    velocity = 0;
                    car.translate(carInv[0], carInv[1], carInv[2]);
                    camera.translate(camInv[0], camInv[1], camInv[2]);

                } else if (t == "ramp") {
                    //collision with ramp
                    carYVelocity += 1/20 * velocity;
                }
            }
        }

        /*
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
        */

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
    car.addMesh(["models/car.obj"]);
    car.addCollisionPlane(new CollisionPlane());
    car.collisionPlane.scale = [2, 1, 3];

    ground = new SceneNode();
    ground.addMesh(["models/track01.obj", "models/track01.mtl"])
    ground.translate(0, -5, -50);
    ground.scaleBy(500, 500, 500);

    cube = new SceneNode();
    cube.addMesh(["models/cube.obj"]);
    cube.tag = "wall";
    cube.translate(0, 5, -100);
    cube.scaleBy(10, 10, 10);
    cube.addCollisionPlane(new CollisionPlane());

    ramp = new SceneNode();
    ramp.addMesh(["models/ramp.obj"]);
    ramp.translate(50, -5, -100);
    ramp.scaleBy(10, 2, 10);
    ramp.tag = "ramp";
    ramp.addCollisionPlane(new CollisionPlane());

    sceneGraph.root.addChild(car);
    sceneGraph.root.addChild(ground);
    sceneGraph.root.addChild(cube);
    sceneGraph.root.addChild(ramp);

    Client.connect();
}