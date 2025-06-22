class Plane {

    constructor() {

        this.rotation = [0, 0, 0];
        this.translation = [0, 0, 0];
        
        //Compile shaders
        this.program = createProgram("shaders/vertexShader.vert", "shaders/fragmentShader.frag");

        //Getting variable locations.
        this.modelLocation = gl.getUniformLocation(this.program, "u_model");
        this.viewLocation = gl.getUniformLocation(this.program, "u_view");
        this.projectionLocation = gl.getUniformLocation(this.program, "u_projection");
        this.positionAttribute = gl.getAttribLocation(this.program, "a_position");

        // Setting up vertex array.
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices()), gl.STATIC_DRAW);
        
    }

    vertices() {
        return [
            -0.5, -0.5, 0.0,
            -0.5, 0.5, 0.0,
            0.5, -0.5, 0.0,
            0.5, 0.5, 0.0
        ];
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

    model() {
        //Returns the model matrix of this plane.
        let rx = this.rotation[0];
        let ry = this.rotation[1];
        let rz = this.rotation[2];
        let tx = this.translation[0];
        let ty = this.translation[1];
        let tz = this.translation[2];

        return mat.transpose(mat.multiply(mat.translate(tx, ty, tz), mat.rotate(rx, ry, rz)));
    }

    render(cam) {

        gl.useProgram(this.program);
        gl.uniformMatrix4fv(this.modelLocation, false, this.model());
        gl.uniformMatrix4fv(this.viewLocation, false, cam.createView());
        gl.uniformMatrix4fv(this.projectionLocation, false, mat.transpose(mat.projection()));
        gl.enableVertexAttribArray(this.positionAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

        const size = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        gl.vertexAttribPointer(this.positionAttribute, size, type, normalize, stride, offset);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    }

}