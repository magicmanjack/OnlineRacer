class Camera {

    /*
        Camera points towards the -z axis into the screen.
        X axis to the right.
        Y axis upwards.
        origin bottom left.
    */

    //track1 load position [0, 10, 15], [0, 0, 0]

    static cameras = [new Camera([0, 0, 15], [0, 0, 0])]; // Can switch between different cameras by setting main to them.
    static main = Camera.cameras[0];

    constructor(translation, rotation) {
        this.translation = translation;
        this.rotation = rotation;
        this.displayWidth = 25;
        this.displayHeight = 25;
        this.zNear = 25;
        this.zFar = 3500;
        this.projection = mat.projection(this.displayWidth, this.displayHeight, this.zNear, this.zFar);
    }

    translate(tx, ty, tz) {
        
        this.translation[0] += tx;
        this.translation[1] += ty;
        this.translation[2] += tz;
    }

    rotate(rx, ry, rz) {
        
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
        /* rotates the camera around the axis with the angle provided */
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

    createView() {
        let r = this.rotation;
        let t = this.translation;
        let ir = [-r[0], -r[1], -r[2]];
        let it = [-t[0], -t[1], -t[2]];

        let inverseRotMat = mat.multiply(mat.multiply(mat.rotateX(ir[0]), mat.rotateY(ir[1])), mat.rotateZ(ir[2])); 
        return mat.multiply(inverseRotMat, mat.translate(it[0], it[1], it[2]));
        
    }

    updatePerspective() {
        this.projection = mat.projection(this.displayWidth, this.displayHeight, this.zNear, this.zFar);
    }

    getBoundingBox(sceneNode, project=true) {
        /*Returns the bounding box of the provided sceneNode from the perspective
        of the camera in the form of [u, r, d ,l] (up, right, down, left) 
        Note: the coordinates are in normalized device space [-1, 1].
        If project is set to false, perspective projection is not used and the coordinates
        are just from the view point of the camera. */

        if(sceneNode.mesh == null) {
            console.error("Could not get bounding box from sceneNode without mesh");
            return;
        }
        
        const mvp = mat.chain([project ? this.projection : mat.identity(), this.createView(), sceneNode.world]);

        const vertices = sceneNode.mesh.vertices;
        
        let smallestX = Number.POSITIVE_INFINITY;
        let smallestY = Number.POSITIVE_INFINITY;
        let biggestX = Number.NEGATIVE_INFINITY;
        let biggestY = Number.NEGATIVE_INFINITY;

        for(let i = 0; i < vertices.length; i+=3) {
            let vertex = [...vertices.slice(i, i+3), 1];

            vertex = mat.multiplyVec(mvp, vertex);
            vertex = vec4.perspectiveDivide(vertex);
            
            if(vertex[0] > biggestX) {
                biggestX = vertex[0];
            }
            if(vertex[0] < smallestX) {
                smallestX = vertex[0];
            }
            if(vertex[1] > biggestY) {
                biggestY = vertex[1];
            }
            if(vertex[1] < smallestY) {
                smallestY = vertex[1];
            }
        }

        return [biggestY, biggestX, smallestY, smallestX];
    }
}