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

const gravity = -0.1;

function init() {
    camera.translate(0, 10, 0);
    camera.displayWidth = startWidth;
    camera.displayHeight = startHeight;
    tire = new SceneNode();
    tire.scaleBy(3, 3, 3);
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

    function rotateSpeedFunction(x) {
        return x >= 0 ? ((1.2 * x - 1.2) / (1 + Math.abs(1.2 * x - 1.2)) + 0.55) / 1.5 :
            -1 * ((0.5 * -x - 5) / (1 + Math.abs(0.5 * -x - 5)) + 0.9) / 0.12222;
    }

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

            tireDirection = mat3x3.multiplyVec(mat3x3.rotate(0, rotateSpeed, 0), tireDirection)
        }
        if (input.right && Math.abs(velocity) > 0.5) {
            tire.rotate(0, -rotateSpeed, 0);
            tireRotationY -= rotateSpeed;

            tireDirection = mat3x3.multiplyVec(mat3x3.rotate(0, -rotateSpeed, 0), tireDirection)
        }

        let rotationDiff = tireRotationY - cameraRotationY;
        let cameraRotationStep = rotationDiff * cameraLagFactor;
        camera.rotate(0, cameraRotationStep, 0);
        cameraDisp = vec.subtract(camera.translation, tire.translation)

        newPos = mat3x3.multiplyVec(mat3x3.rotate(0, cameraRotationStep, 0), cameraDisp);

        camera.translation = vec.add(newPos, tire.translation)

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

        let newTireDirection = vec.scale(velocity, tireDirection);
        tireYVelocity = tireYVelocity + gravity;
        tire.translate(newTireDirection[0], tireYVelocity, newTireDirection[2]);
        camera.translate(newTireDirection[0], newTireDirection[1], newTireDirection[2]);

        if (tire.translation[1] < 0) {
            tire.translation = [tire.translation[0], 0, tire.translation[2]]
        }

        camera.displayWidth = startWidth + velocity * 0.5;
        camera.displayHeight = startHeight + velocity * 0.5;
    };
    tire.mesh = new Mesh(["models/car.obj"], "textures/car.png");

    ground = new SceneNode();
    ground.mesh = new Mesh(["models/ground.obj"], "textures/track.png");
    ground.translate(0, -15, -50);
    ground.scaleBy(500, 500, 500);

    sceneGraph.root.addChild(tire);
    sceneGraph.root.addChild(ground);
}