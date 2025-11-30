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


    parent;
    children;

    name;
    tag = "default";

    translation;
    rotation;
    scale;
    world;

    mesh;
    collisionPlane;
    update;

    // Used to keep track of the mesh loading progress on track load time.
    static numMeshes = 0;
    static numLoadedMeshes = 0;

    static collidables = [];


    constructor() {
        this.parent = null; // Assumed to be root node until added as child node.
        this.children = [];

        this.translation = [0, 0, 0];
        this.rotation = [0, 0, 0];
        this.scale = [1, 1, 1];
        this.world = mat.identity();
        this.mesh = null;
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
        this.rotation[0] += rx;
        this.rotation[1] += ry;
        this.rotation[2] += rz;
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
                        parent.sceneNode.addCollisionPlane(new CollisionPlane(model.meshes[child.node.meshes[0]]));
                        parent.sceneNode.collisionPlane.translation = mat.getTranslationVector(child.node.transformation);
                        parent.sceneNode.collisionPlane.scale = mat.getScaleVector(child.node.transformation);
                        parent.sceneNode.collisionPlane.rotation = mat.getRotationVector(child.node.transformation);
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

    addCollisionPlane(collisionPlane) {
        collisionPlane.parent = this;
        this.collisionPlane = collisionPlane;
    }

    collisionStep() {
        /*  
            Runs the collision detection methods.
            This is meant to be called after all movements are done,
            and then after the call, collision can be checked.
        */

        if (this.collisionPlane) {
            let local = this.calculateLocal(this);
            let parentWorld = this.parent ? this.parent.world : mat.identity(); // returns identity if parent is root.
            let world = mat.multiply(parentWorld, local);
            this.collisionPlane.model = mat.multiply(world, this.calculateLocal(this.collisionPlane));
            this.collisionPlane.checkCollisions(SceneNode.collidables);
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

        if (this.collisionPlane) {
            this.collisionPlane.model = mat.multiply(this.world, this.calculateLocal(this.collisionPlane));
        }

        this.children.forEach((child) => { child.updateChildren() });

    }

    remove() {
        this.parent.removeChild(this);
        for (let i = 0; i <= SceneNode.collidables.length; i++) {
            if (SceneNode.collidables[i] === this.collisionPlane) {
                SceneNode.collidables.splice(i, 1);
            }
        }
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

        if (debug && this.collisionPlane) {
            this.collisionPlane.render(Camera.main);
        }
        if (this.mesh) {
            this.mesh.render(Camera.main);
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
    load: function(loadCallback) {
        /*Clears the scene heirarchy and UI and then calls back
        the provided callback function*/
        UILayer = [];
        this.root = new SceneNode();
        SceneNode.numMeshes = 0;
        SceneNode.numLoadedMeshes = 0;

        loadCallback();
    },
    ready: function() {
        /* Returns true if the number of meshes loaded matches
        the number of meshes to load.*/
        //console.log(`${SceneNode.numLoadedMeshes}/${SceneNode.numMeshes}`);
        return SceneNode.numMeshes == SceneNode.numLoadedMeshes;
    }
};
