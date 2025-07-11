class Camera {

    constructor(translation, rotation) {
        this.translation = translation;
        this.rotation = rotation;
        this.displayWidth = 25;
        this.displayHeight = 25;
        this.zNear = 25;
        this.zFar = 1500;
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

        return mat.multiply(mat.rotate(ir[0], ir[1], ir[2]), mat.translate(it[0], it[1], it[2]));
        
    }
}