/*
Scene graph:
Used to calculate what model matrix should be 
if an object is translating and rotating relative to a parent.

        scene root
    child 1, child 2
child 3

scene root model: identity.
child 1 model: root model * child 1 model.
child 3 model: root model * child 1 model * child 3 model.

Need to update the tree once per update cycle.
Need to process object movement before calculating model matrix.
*/

class SceneNode {

    // Used to keep track of the mesh loading progress on track load time.
    static numMeshes = 0;
    static numLoadedMeshes = 0;

    static collidables = []; // Used as a store for all collidable objects in the scene
    


    constructor() {
        this.parent = null; // Assumed to be root node until added as child node.
        this.children = [];

        this.translation = [0, 0, 0];
        this.rotation = [0, 0, 0];
        this.scale = [1, 1, 1];
        this.world = mat.identity();
        this.mesh = null;
        this.tag = "default";
        
        this.colliders = [];
        this.fineGrainedCollision = false; // If enabled, collision detection is more accurate (more intensive)
        this.fineGrainedCollisionInterval = 2.0;
    }

    translate(tx, ty, tz) {
        this.translation[0] += tx;
        this.translation[1] += ty;
        this.translation[2] += tz;
    }

    scaleBy(sx, sy, sz) {
        this.scale[0] = sx;
        this.scale[1] = sy;
        this.scale[2] = sz;
    }

    rotate(rx, ry, rz) {
        /*
            Simply applies the change angles around each axis to the rotation vector.
        */
        this.rotation[0] += rx;
        this.rotation[1] += ry;
        this.rotation[2] += rz;
    }

    rotateRelative(rx, ry, rz) {
        /*
            Applies a rotation after the current rotation.
        */
        const newRot = mat.rotate(rx, ry, rz);
        const originalRot = mat.rotate(this.rotation[0], this.rotation[1], this.rotation[2]);

        const result = mat.multiply(newRot, originalRot);

        //Save new resulting rotation vector
        this.rotation = mat.getRotationVector(result);

    }

    rotateOnAxis(axis, angle) {
        /* rotates the scene node around the axis with the angle provided */
        const newRot = mat.rotateAround(axis, angle);
        const originalRot = mat.rotate(this.rotation[0], this.rotation[1], this.rotation[2]);

        this.rotation = mat.getRotationVector(mat.multiply(newRot, originalRot));
    }

    rotateLocal(rx, ry, rz) {
        /* Rotates on the objects local axes in its local coordinate system
        as opposed to global axis rotation */
        
        //Calculation of new reference frame
        const localX = vec.rotate(vec3.right, this.rotation[0], this.rotation[1], this.rotation[2]);
        const localY = vec.rotate(vec3.up, this.rotation[0], this.rotation[1], this.rotation[2]);
        const localZ = vec.rotate(vec3.backward, this.rotation[0], this.rotation[1], this.rotation[2]);

        //Rotate around X, then Y, then Z
        this.rotateOnAxis(localX, rx);
        this.rotateOnAxis(localY, ry);
        this.rotateOnAxis(localZ, rz);
    }

    calculateLocal(o) {
        //Calculates the model matrix of this transformable object according to its translation and rotation.
        let rx = o.rotation[0];
        let ry = o.rotation[1];
        let rz = o.rotation[2];
        let tx = o.translation[0];
        let ty = o.translation[1];
        let tz = o.translation[2];
        let sx = o.scale[0];
        let sy = o.scale[1];
        let sz = o.scale[2];

        return mat.multiply(mat.translate(tx, ty, tz), mat.multiply(mat.rotate(rx, ry, rz), mat.scale(sx, sy, sz)));
    }

    addChild(node) {
        node.parent = this;
        this.children.push(node);
    }

    addMesh(fileNames) {
        /*
            Uses Assimpjs to load in meshes and properly set up scene heirarchy.
            Returns promise that resolves when meshes are loaded.
        */
        SceneNode.numMeshes++;
        return loadModelFile(fileNames).then((model) => {
            /*
                Recursively search the node tree.
            */
            const nodeQueue = [{node : model.rootnode, sceneNode: this}];

            while(nodeQueue.length > 0) {
                const parent = nodeQueue.shift();

                if(parent.node.children === undefined) {
                    continue;
                }

                for(let c = 0; c < parent.node.children.length; c++) {
                    const childSceneNode = new SceneNode();
                    const child = {node: parent.node.children[c], sceneNode: childSceneNode};
                

                    if(child.node.name.startsWith("collider")) {
                        /*
                            child is a collider and must be handled accordingly.
                        */
                        const c = new CollisionPlane(model.meshes[child.node.meshes[0]]);
                        parent.sceneNode.addCollisionPlane(c);
                        c.translation = mat.getTranslationVector(child.node.transformation);
                        c.scale = mat.getScaleVector(child.node.transformation);
                        c.rotation = mat.getRotationVector(child.node.transformation);
                        continue;
                    }
                    nodeQueue.push(child);

                    childSceneNode.name = child.node.name;
                    childSceneNode.translation = mat.getTranslationVector(child.node.transformation);
                    childSceneNode.scale = mat.getScaleVector(child.node.transformation);
                    childSceneNode.rotation = mat.getRotationVector(child.node.transformation);
                    /*
                        Mesh data is structured as such
                        Mesh:
                            materialIndex
                            vertices
                            normals
                            texcoords
                            faces
                        
                        Materials are structured as such
                        material:
                            properties:
                                [
                                    ...
                                    ...
                                    {
                                        key: "$tex.file"
                                        value: "wheel.png"
                                    }
                                ]
                    */
                    if(child.node.meshes !== undefined) {
                        /*
                            Child is not a mesh. May be a camera or lightsource
                            or empty or other.
                        */
                        const mesh = model.meshes[child.node.meshes[0]]; 
                        const material = model.materials[mesh.materialindex];
                        childSceneNode.mesh = new Mesh(mesh, material);
                        childSceneNode.mesh.parent = parent.sceneNode;
                        
                    }
                    
                    parent.sceneNode.addChild(childSceneNode);
                }
            }
            SceneNode.numLoadedMeshes++;
        });
    }

    addParticleGenerator(p) {
        p.parent = this;
        this.particleGenerator = p;
    }

    addCollisionPlane(collisionPlane) {
        collisionPlane.parent = this;
        this.colliders.push(collisionPlane);
        collisionPlane.model = mat.multiply(this.world, this.calculateLocal(collisionPlane));
    }

    collisionStep() {
        /*  
            Runs the collision detection methods.
            This is meant to be called after all movements are done,
            and then after the call, collision can be checked.
        */
        if(this.fineGrainedCollision) {
            /* 
                The idea behind fine grained collision is:
                    - Find the path between the last position of this scenenode
                    and the current position.
                    - Starting from the last position, move along the path at a specified small (fine) interval,
                    at each point check for collision.
                    - If there is a collision, exit the search.
                    - The MTV is saved for each collider. Calculate the vector between the current position of the
                    scenenode and the position where the search ended. Add this vector to each MTV to produce the correct results.

            */
            const lastPos = mat.getTranslationVector(this.world);

            const currentPos = mat.getTranslationVector(mat.multiply(this.parent.world, mat.translate(this.translation[0], this.translation[1], this.translation[2])));
            
            //Flatten
            lastPos[1] = 0;
            currentPos[1] = 0;

            const path = vec.subtract(currentPos, lastPos);

            const pathNormal = vec.magnitude(path) == 0 ? [0, 0, 0] : vec.normalize(path);

            const nIntervals = Math.max(Math.floor(vec.magnitude(path) / this.fineGrainedCollisionInterval), 1);

            let collidedYet = false;

            for(let i = 1; i <= nIntervals; i++) {

                //Calculate interval translation along path
                const iT = vec.scale(i * this.fineGrainedCollisionInterval, pathNormal);

                this.colliders.forEach((c) => {

                    //Apply interval translation
                    c.model = mat.multiply(mat.translate(iT[0], iT[1], iT[2]), mat.multiply(this.world, this.calculateLocal(c)));
                    c.checkCollisions(SceneNode.collidables);

                    if(c.collided && !collidedYet) {
                        collidedYet = true;
                    }
                });

                if(collidedYet) {
                    //Time to exit
                    //Calculate offset from end of path and add to each MTV
                    const offset = vec.subtract(vec.add(iT, lastPos), currentPos);
                    this.colliders.forEach((c) => {
                        //Apply offset to MTV
                        c.collisions.forEach((collision) => {
                            collision.MTV = vec.add(collision.MTV, offset);
                        })
                    });
                    break;
                }
            } 

        } else {
            this.colliders.forEach((c) => {
                
                let local = this.calculateLocal(this);
                let parentWorld = this.parent ? this.parent.world : mat.identity(); // returns identity if parent is root.
                let world = mat.multiply(parentWorld, local);
                c.model = mat.multiply(world, this.calculateLocal(c));
                c.checkCollisions(SceneNode.collidables);
            
            });
        }

    }

    updateChildren() {

        if (typeof this.update === "function") {
            this.update();
        }

        let local = this.calculateLocal(this);
        let parentWorld = this.parent ? this.parent.world : mat.identity(); // returns identity if parent is root.

        this.world = mat.multiply(parentWorld, local);

        if (this.mesh) {
            this.mesh.model = this.world;
        }
        

        this.colliders.forEach((c) => {
            c.model = mat.multiply(this.world, this.calculateLocal(c));
        });

        if(this.particleGenerator) {
            this.particleGenerator.update();
        }

        this.children.forEach((child) => { child.updateChildren() });

    }

    remove() {
        this.parent.removeChild(this);
        this.colliders.forEach((c) => {
            for (let i = 0; i <= SceneNode.collidables.length; i++) {

                if (SceneNode.collidables[i] === c) {
                    SceneNode.collidables.splice(i, 1);
                    i--; // To prevent skipping over the next element as the array gets smaller
                }

            }        
        });
        
    }

    removeChild(child) {
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i] === child) {
                this.children.splice(i, 1);
            }
        }
    }

    getChildByMesh(meshName) {
        /*
            Recursively searches the child node tree for the node
            with the mesh named meshName and returns it if found.
            Returns null if not.
        */
        for(let i = 0; i < this.children.length; i++) {
            const c = this.children[i];
            if(c.mesh !== null && c.mesh.name == meshName) {
                return c;
            }

            const rec = c.getChildByMesh(meshName);
            if(rec) {
                return rec;
            }
        }
        return null;
    }

    getChild(name) {
        /*
            Gets a child node by its name
        */
        for(let i = 0; i < this.children.length; i++) {
            const c = this.children[i];
            if(c.name !== undefined && c.name === name) {
                return c;
            }

            const rec = c.getChild(name);
            if(rec) {
                return rec;
            }
        }
        return null;
    }

    getChildren(prefix, matching=[]) {
        /* 
            Gets and returns a list of children that start with the given prefix.
        */
        for(let i = 0; i < this.children.length; i++) {
            const c = this.children[i];
            if(c.name !== undefined && c.name.startsWith(prefix)) {
                matching.push(c);
            }

            c.getChildren(prefix, matching);
        }
        
        return matching;

    }

    render() {

        if (debug) {
            this.colliders.forEach((c) => {
                c.render(Camera.main);
            });
            
        }
        if (this.mesh) {
            this.mesh.render(Camera.main);
        }

        if(this.particleGenerator) {
            this.particleGenerator.render(Camera.main);
        }

        this.children.forEach((child) => { child.render() });
    }
}

const sceneGraph = {
    root: new SceneNode(),
    updateScene: function () {
        this.root.updateChildren();
    },
    renderScene: function () {
        this.root.render();
    },
    reset: function() {
        /*Clears the scene heirarchy and UI*/
        UILayer = [];
        this.root = new SceneNode();
        SceneNode.numMeshes = 0;
        SceneNode.numLoadedMeshes = 0;
        SceneNode.collidables = [];
    },
    ready: function() {
        /* Returns true if the number of meshes loaded matches
        the number of meshes to load.*/
        //console.log(`${SceneNode.numLoadedMeshes}/${SceneNode.numMeshes}`);
        return SceneNode.numMeshes == SceneNode.numLoadedMeshes;
    },
    preCalcMatrices: function(node=this.root) {
        /* Calculates all the rotation matrices in the sceneGraph which
        should be done prior to the first update. Otherwise the matrices will
        only get calculated only once it is a nodes turn to update. */
        let local = node.calculateLocal(node);
        let parentWorld = node.parent ? node.parent.world : mat.identity(); // returns identity if parent is root.

        node.world = mat.multiply(parentWorld, local);

        if (node.mesh) {
            node.mesh.model = node.world;
        }

        node.colliders.forEach((c) => {
            c.model = mat.multiply(node.world, node.calculateLocal(c));
        });

        node.children.forEach((child) => { this.preCalcMatrices(child)});
    }
};
