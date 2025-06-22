/*
Camera points towards the -z axis into the screen.
X axis to the right.
Y axis upwards.
origin bottom left.
*/
let camera = new Camera([0, 10, 15], [0, 0, 0]);

let tire;

function init() {
    camera.translate(0, 10, 0);
    tire = new SceneNode();
    tire.scaleBy(5, 5, 5);
    tire.translate(0, 0, -50);
    tire.rotate(Math.PI / 2, 0, 0);

    let tireDirection = [0, 0, -1];
    let velocity = 0;
    let rotateSpeed = 0;
    let maxRotateSpeed = 0.05;

    function rotateSpeedFunction(x) {
        return x >= 0 ? ((1.2 * x - 1.2) / (1 + Math.abs(1.2 * x - 1.2)) + 0.55) / 1.5 :
            -1 * ((0.5 * -x - 5) / (1 + Math.abs(0.5 * -x - 5)) + 0.9) / 0.12222;
    }

    tire.update = () => {
        if (input.up) {
            velocity += 0.3;
            if (velocity > 17) {
                velocity = 17;
            }
        }
        if (input.down) {
            velocity -= 0.5;
            if (velocity < -3) {
                velocity = -3;
            }
        }
        if (input.left && Math.abs(velocity) > 0.5) {
            tire.rotate(0, rotateSpeed, 0);
            camera.rotate(0, rotateSpeed, 0);
            cameraDisp = mat.subtract(camera.translation, tire.translation)
            cameraDisp.push(1)
            newPos = mat.multiplyVec(mat.rotate(0, rotateSpeed, 0), cameraDisp);
            newPos.pop();
            camera.translation = mat.add(newPos, tire.translation)

            tireDirection.push(1)
            tireDirection = mat.multiplyVec(mat.rotate(0, rotateSpeed, 0), tireDirection)
            tireDirection.pop()
        }
        if (input.right && Math.abs(velocity) > 0.5) {
            tire.rotate(0, -rotateSpeed, 0);
            camera.rotate(0, -rotateSpeed, 0);
            cameraDisp = mat.subtract(camera.translation, tire.translation)
            cameraDisp.push(1)
            newPos = mat.multiplyVec(mat.rotate(0, -rotateSpeed, 0), cameraDisp);
            newPos.pop();
            camera.translation = mat.add(newPos, tire.translation)

            tireDirection.push(1)
            tireDirection = mat.multiplyVec(mat.rotate(0, -rotateSpeed, 0), tireDirection)
            tireDirection.pop()
        }

        newTireDirection = mat.scaleVec(velocity, tireDirection);
        tire.translate(newTireDirection[0], newTireDirection[1], newTireDirection[2]);
        camera.translate(newTireDirection[0], newTireDirection[1], newTireDirection[2]);
        if (velocity > 0) {
            velocity -= 0.1;
            if (velocity < 0) {
                velocity = 0;
            }
        }
        if (velocity < 0) {
            velocity += 0.1;
            if (velocity > 0) {
                velocity = 0;
            }
        }

        if (velocity == 0) {
            rotateSpeed = 0;
        } else {
            rotateSpeed = maxRotateSpeed * rotateSpeedFunction(velocity);
        }
    };
    tire.mesh = new Mesh(["models/wheel.obj"], "textures/wheel.png");

    ground = new SceneNode();
    ground.mesh = new Mesh(["models/ground.obj"], "textures/track.png");
    ground.translate(0, -15, -50);
    ground.scaleBy(500, 500, 500);

    sceneGraph.root.addChild(tire);
    sceneGraph.root.addChild(ground);
}