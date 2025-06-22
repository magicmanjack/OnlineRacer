/*
Camera points towards the -z axis into the screen.
X axis to the right.
Y axis upwards.
origin bottom left.
*/
let camera = new Camera([0, 0, 0], [0, 0, 0]);

let tire;

function init() {
    tire = new SceneNode();
    tire.scaleBy(5, 5, 5);
    tire.translate(0, 0, -30);
    tire.rotate(Math.PI/2, 0, 0);
    tire.update = () => {tire.rotate(0, 0.1, 0.1);};
    tire.mesh = new Mesh(["models/wheel.obj"], "textures/wheel.png");
    sceneGraph.root.addChild(tire);
}