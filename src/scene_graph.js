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
        this.visible = true;
        
        this.colliders = [];
        this.fineGrainedCollision = false; // If enabled, collision detection is more accurate (more intensive)
        this.fineGrainedCollisionInterval = 5.0;

        this.transparent = false;
        
    }

    translate(tx, ty, tz) {
        this.translation[0] += tx;
        this.translation[1] += ty;
        this.translation[2] += tz;
    }

    scaleBy(sx, sy, sz) {
        this.scale[0] *= sx;
        this.scale[1] *= sy;
        this.scale[2] *= sz;
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

    rotateTowards(rotation, t) {
        /* Given a rotation vector (rx, ry, rz), the sceneNode rotates towards the rotation
        defined by the rotation vector. the argument t (between 0 and 1) is the interpolation parameter (at t=0,
        the rotation is just the rotation of the sceneNode, and at t=1, the rotation is as provided. For
        values in between, the rotation is interpolated. */
        const toRotation = mat3x3.rotate(...rotation);
        const fromRotation = mat3x3.rotate(...this.rotation);

        //convert to quaternions
        const q1 = mat3x3.toQuaternion(fromRotation);
        const q2 = mat3x3.toQuaternion(toRotation);
        
        const q1opposite = vec.scale(-1, q1);

        let q;

        q = quaternion.slerp(q1, q2, t);

        //console.log(vec.magnitude(vec.subtract(q1, q2)));
        
        //Interpolate a quaternion between both quaternions using slerp
        
        const interpolatedRotation = quaternion.toRotationMatrix(q);
        
        this.rotation = mat.getRotationVector(mat3x3.to4x4(interpolatedRotation));


    }

    moveTowards(translation, t) {
        /* Given a translation vector and an interpolation parameter t,
        this function moves the sceneNode towards the translation.
        t represents how far along the path to move. 1 is the full distance and 0 is no distance. */
        const displacement = vec.subtract(translation, this.translation);
        this.translation = vec.add(this.translation, vec.scale(t, displacement));

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

        const meshLoadedPromise = loadModelFile(fileNames).then((model) => {
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
                

                    if(child.node.name.toLowerCase().startsWith("collider")) {
                        /*
                            child is a collider and must be handled accordingly.
                        */
                        const c = new CollisionPlane(model.meshes[child.node.meshes[0]]);
                        parent.sceneNode.addCollisionPlane(c);
                        c.translation = mat.getTranslationVector(child.node.transformation);
                        c.scale = mat.getScaleVector(child.node.transformation);
                        c.rotation = mat.getRotationVector(child.node.transformation);
                        continue;
                    } else if(child.node.name.toLowerCase().startsWith("camera")) {
                        //Is camera
                        const t = child.node.transformation;
                        //Because of FBX camera standards and how blender transfers between axis conventions we need to apply a correction
                        //Need to prerotate by the inverse of [-PI/2, 0, -PI/2] do undo the crap and then prerotate by [-Math.PI/2, 0, 0];
                        const inv = mat.inverse(mat.rotate(-Math.PI/2, 0, -Math.PI/2));
                        const corrected = mat.multiply(mat.multiply(t, inv), mat.rotate(...[-Math.PI/2, 0, 0]));
                        const camera = new Camera(mat.getTranslationVector(t), mat.getRotationVector(corrected));
                        Camera.cameras.push(camera);
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
                        childSceneNode.mesh = new Mesh();
                        const meshDir = fileNames[0].substring(0, fileNames[0].lastIndexOf("/") + 1);
                        //e.g. models/car/car.fbx becomes models/car/
                        childSceneNode.mesh.meshDir = meshDir;
                        childSceneNode.mesh.meshData = mesh;
                        childSceneNode.mesh.materialData = material;
                        childSceneNode.mesh.loadMeshData();
                        childSceneNode.mesh.loadMaterialData();
                        childSceneNode.mesh.parent = childSceneNode;
                        
                    }
                    
                    parent.sceneNode.addChild(childSceneNode);
                }
            }
            SceneNode.numLoadedMeshes++;
        });
        sceneGraph.waitOnPromise(meshLoadedPromise);
        
        return meshLoadedPromise;
    }

    addParticleGenerator(p) {
        p.parent = this;
        this.particleGenerator = p;
    }

    addCollisionPlane(collisionPlane) {
        SceneNode.numMeshes++;

        sceneGraph.waitOnPromise(collisionPlane.loadedPromise.then(() => {
            SceneNode.numLoadedMeshes++;
        }));

        collisionPlane.parent = this;
        
        if(this.markedStatic) {
            staticCollidables.push(collisionPlane);
        } else {
            this.colliders.push(collisionPlane);
        }
        
        collisionPlane.model = mat.multiply(this.world, this.calculateLocal(collisionPlane));
    }

    markAsStatic() {
        this.markedStatic = true;
        this.colliders.forEach((c) => {
            //remove from collidables list and move to staticCollidables
            SceneNode.collidables = SceneNode.collidables.filter(item => item !== c);
            staticCollidables.push(c);
        });
    }

    collisionStep() {
        /*  
            Runs the collision detection methods.
            This is meant to be called after all movements are done,
            and then after the call, collision can be checked.
        */

        if(this.fineGrainedCollision) {
            //TODO add checking from collidables list
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

                    //clear previous collisions
                    c.reset();

                    //Apply interval translation
                    c.model = mat.multiply(mat.translate(iT[0], iT[1], iT[2]), mat.multiply(this.world, this.calculateLocal(c)));
                    c.checkCollisions([...staticCollidables.getCollidables(c), ...SceneNode.collidables]);
                    
                    if(debug && debugOptions.displayNumberOfCollidables) {
                        console.log(`collidables: ${SceneNode.collidables.length}, s_collidables: ${staticCollidables.getCollidables(c).length}`);
                    }

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

            // //Now to check dynamic objects (In this configuration the dynamic objects are check using normal collision
            // this.colliders.forEach((c) => {
            //     let local = this.calculateLocal(this);
            //     let parentWorld = this.parent ? this.parent.world : mat.identity(); // returns identity if parent is root.
            //     let world = mat.multiply(parentWorld, local);
            //     c.model = mat.multiply(world, this.calculateLocal(c));
            //     c.checkCollisions(SceneNode.collidables);
            // });
        } else {
            this.colliders.forEach((c) => {
                c.reset();
                let local = this.calculateLocal(this);
                let parentWorld = this.parent ? this.parent.world : mat.identity(); // returns identity if parent is root.
                let world = mat.multiply(parentWorld, local);
                c.model = mat.multiply(world, this.calculateLocal(c));
                c.checkCollisions([...SceneNode.collidables, ...staticCollidables.getCollidables(c)]);
                if(debug && debugOptions.displayNumberOfCollidables) {
                    console.log(`collidables: ${SceneNode.collidables.length}, s_collidables: ${staticCollidables.getCollidables(c).length}`);
                }
                
            });
        }

    }

    updateChildren() {

        if (typeof this.update === "function") {
            this.update();
        }

        let local = this.calculateLocal(this);
        this.local = local;

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
        if(this.visible) {

            if (debug) {
                this.colliders.forEach((c) => {
                    c.render(Camera.main);
                });
                
            }

            if(this.transparent && this.mesh) {
                sceneGraph.transparentMeshes.push(this.mesh);
            } else if (this.mesh) {
                this.mesh.render(Camera.main);
            }

            if(this.particleGenerator) {
                this.particleGenerator.render(Camera.main);
            }

            this.children.forEach((child) => { child.render() });
        }
    }
}

function SceneGraph() {
    this.root = new SceneNode();
    this.updateScene = function() {
        if(this.ready()) {
            this.root.updateChildren();
        }
    }
    this.transparentMeshes = [];
    this.renderScene = function() {
       if(this.ready()) {
            this.root.render();
            //Now render transparent objects
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            this.transparentMeshes.forEach((nodeMesh) => {
                nodeMesh.render(Camera.main);
            });

            gl.disable(gl.BLEND);

            this.transparentMeshes = [];
        } 
    }
    this.reset = function() {
        /*Clears the scene heirarchy and UI*/
        clearUIPanel();
        this.root = new SceneNode();
        SceneNode.numMeshes = 0;
        SceneNode.numLoadedMeshes = 0;
        SceneNode.collidables = [];
        this.resetID++; // This is use when there are still unresolved promises from before the reset.
        this.waitingOn = 0;
    }
    this.resetID = 0;
    this.waitingOn = 0;
    this.waitOnPromise = function(p) {
        this.waitingOn++;
        const originalResetID = this.resetID;
        this.resourceLoadingPromises.push(p);
        p.then(() => {
            //Check if reset has occured
            if(originalResetID == this.resetID) {
                this.waitingOn--;
            }
        });
    }
    this.resourceLoadingPromises = [];
    this.afterLoaded = function(callback) {
        Promise.all(this.resourceLoadingPromises).then(() => {
            this.resourceLoadingPromises = [];
            callback()
        }); 
    }
    this.ready = function() {
        return this.waitingOn == 0;
    }

    this.preCalcMatrices = function(node=this.root) {
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


}
let sceneGraph = new SceneGraph();
