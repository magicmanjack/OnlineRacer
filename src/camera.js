class Camera {

    /*
        Camera points towards the -z axis into the screen.
        X axis to the right.
        Y axis upwards.
        origin bottom left.
    */

    static main = new Camera([0, 0, 15], [0, 0, 0]);
    //track1 load position [0, 10, 15], [0, 0, 0]

    constructor(translation, rotation) {
        this.translation = translation;
        this.rotation = rotation;
        this.displayWidth = 25;
        this.displayHeight = 25;
        this.zNear = 25;
        this.zFar = 2000;
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

    createView() {
        let r = this.rotation;
        let t = this.translation;
        let ir = [-r[0], -r[1], -r[2]];
        let it = [-t[0], -t[1], -t[2]];

        let inverseRotMat = mat.multiply(mat.multiply(mat.rotateX(ir[0]), mat.rotateY(ir[1])), mat.rotateZ(ir[2])); 
        return mat.multiply(inverseRotMat, mat.translate(it[0], it[1], it[2]));
        
    }
}