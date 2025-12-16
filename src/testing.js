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