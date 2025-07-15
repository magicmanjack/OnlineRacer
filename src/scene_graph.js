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

    tag = "default";

    translation;
    rotation;
    scale;
    world;

    mesh;
    collisionPlane;
    update;

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

    render() {

        if (debug && this.collisionPlane) {
            this.collisionPlane.render(camera);
        }
        if (this.mesh) {
            this.mesh.render(camera);
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
    }
};
