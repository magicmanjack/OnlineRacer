/*
Camera points towards the -z axis into the screen.
X axis to the right.
Y axis upwards.
origin bottom left.
*/
let camera = new Camera([0, 10, 15], [0, 0, 0]);

let tire;

const startWidth = 25;
const startHeight = 25;

let width = startWidth;
let height = startHeight;

const gravity = -0.1;

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
    tire = new SceneNode();
    tire.scaleBy(5, 5, 5);
    tire.translate(0, 100, -50);
    tire.rotate(Math.PI / 2, 0, 0);

    let tireDirection = [0, 0, -1];
    let velocity = 0;
    let tireYVelocity = 0;
    let rotateSpeed = 0;
    let maxRotateSpeed = 0.05;

    let tireRotationY = 0;
    let cameraRotationY = 0;
    let cameraLagFactor = 0.1;

    tire.update = () => {
        if (input.up) {
            velocity += 0.4;
            if (velocity > 17) {
                velocity = 17;
            }
        }
        if (input.down) {
            velocity -= 0.6;
            if (velocity < -4) {
                velocity = -4;
            }
        }
        if (input.left && Math.abs(velocity) > 0.5) {
            tire.rotate(0, rotateSpeed, 0);
            tireRotationY += rotateSpeed;

            tireDirection.push(1)
            tireDirection = mat.multiplyVec(mat.rotate(0, rotateSpeed, 0), tireDirection)
            tireDirection.pop()
        }
        if (input.right && Math.abs(velocity) > 0.5) {
            tire.rotate(0, -rotateSpeed, 0);
            tireRotationY -= rotateSpeed;

            tireDirection.push(1)
            tireDirection = mat.multiplyVec(mat.rotate(0, -rotateSpeed, 0), tireDirection)
            tireDirection.pop()
        }

        let rotationDiff = tireRotationY - cameraRotationY;
        let cameraRotationStep = rotationDiff * cameraLagFactor;
        camera.rotate(0, cameraRotationStep, 0);
        cameraDisp = mat.subtract(camera.translation, tire.translation)
        cameraDisp.push(1)
        newPos = mat.multiplyVec(mat.rotate(0, cameraRotationStep, 0), cameraDisp);
        newPos.pop();
        camera.translation = mat.add(newPos, tire.translation)

        cameraRotationY += cameraRotationStep;

        if (velocity > 0) {
            cameraLagFactor = 0.1;
            velocity -= 0.2;
            if (velocity < 0) {
                velocity = 0;
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

        let newTireDirection = mat.scaleVec(velocity, tireDirection);
        tireYVelocity = tireYVelocity + gravity;

        let newY = tire.translation[1] + tireYVelocity;
        if (newY < 0) {
            newY = 0;
            tireYVelocity = 0;
        }

        let proposedPosition = [tire.translation[0] + newTireDirection[0], newY, tire.translation[2] + newTireDirection[2]];

        let tireScale = [5, 5, 5];
        let cubeScale = [10, 10, 10];

        if (!checkAABBCollision(proposedPosition, tireScale, cube.translation, cubeScale)) {
            tire.translate(newTireDirection[0], tireYVelocity, newTireDirection[2]);
            camera.translate(newTireDirection[0], newTireDirection[1], newTireDirection[2]);
        }
        else {
            velocity = 0;
        }

        width = startWidth + velocity * 0.5;
        height = startHeight + velocity * 0.5;
    };
    tire.mesh = new Mesh(["models/wheel.obj"], "textures/wheel.png");

    ground = new SceneNode();
    ground.mesh = new Mesh(["models/ground.obj"], "textures/track.png");
    ground.translate(0, -5, -50);
    ground.scaleBy(500, 500, 500);

    cube = new SceneNode();
    cube.mesh = new Mesh(["models/cube.obj"], "textures/cubetexture.png");
    cube.translate(0, 5, -100);
    cube.scaleBy(10, 10, 10);

    sceneGraph.root.addChild(tire);
    sceneGraph.root.addChild(ground);
    sceneGraph.root.addChild(cube);
}