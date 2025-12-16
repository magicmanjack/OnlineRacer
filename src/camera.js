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

    createView() {
        let r = this.rotation;
        let t = this.translation;
        let ir = [-r[0], -r[1], -r[2]];
        let it = [-t[0], -t[1], -t[2]];

        let inverseRotMat = mat.multiply(mat.multiply(mat.rotateX(ir[0]), mat.rotateY(ir[1])), mat.rotateZ(ir[2])); 
        return mat.multiply(inverseRotMat, mat.translate(it[0], it[1], it[2]));
        
    }
}