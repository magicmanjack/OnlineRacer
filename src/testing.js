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