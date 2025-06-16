class Mesh {

    #rotation = [0, 0, 0];
    #translation = [0, 0, 0];
    #scale = [0, 0, 0];
    #vertices = [];
    #indices = [];
    #canRender = false;
    #positionBuffer;
    #indexBuffer;

    constructor(gl, modelFileNames) {
        
        //Compile shaders
        this.program = createProgram(gl, "shaders/vertexShader.vert", "shaders/fragmentShader.frag");

        //Getting variable locations.
        this.modelLocation = gl.getUniformLocation(this.program, "u_model");
        this.viewLocation = gl.getUniformLocation(this.program, "u_view");
        this.projectionLocation = gl.getUniformLocation(this.program, "u_projection");
        this.positionAttribute = gl.getAttribLocation(this.program, "a_position");

        loadModel(modelFileNames).then(this.#loadVertices.bind(this));
        
    }

    #loadVertices(model) {
        
        this.#vertices = model.meshes[0].vertices;
        
        for(let i = 0; i < model.meshes[0].faces.length; i++) {
            //converts array of [[1, 2, 3], [4, 5, 6]] to a 1D array.
            for(let j = 0; j < 3; j++) {
                this.#indices.push(model.meshes[0].faces[i][j]);
            }
        }
        // Setting up vertex and indices array.
        this.#positionBuffer = gl.createBuffer();
        this.#indexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.#positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.#vertices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.#indices), gl.STATIC_DRAW);
        this.#canRender = true;
    }

    translate(tx, ty, tz) {
        this.#translation[0] += tx;
        this.#translation[1] += ty;
        this.#translation[2] += tz;
    }

    scale(sx, sy, sz) {
        this.#scale[0] = sx;
        this.#scale[1] = sy;
        this.#scale[2] = sz;
    }

    rotate(rx, ry, rz) {
        this.#rotation[0] += rx;
        this.#rotation[1] += ry;
        this.#rotation[2] += rz;
    }

    model() {
        //Returns the model matrix of this plane.
        let rx = this.#rotation[0];
        let ry = this.#rotation[1];
        let rz = this.#rotation[2];
        let tx = this.#translation[0];
        let ty = this.#translation[1];
        let tz = this.#translation[2];
        let sx = this.#scale[0];
        let sy = this.#scale[1];
        let sz = this.#scale[2];

        return mat.transpose(mat.multiply(mat.translate(tx, ty, tz), mat.multiply(mat.rotate(rx, ry, rz), mat.scale(sx, sy, sz))));
    }

    update() {
        this.translate(0, 0, 0);
        this.rotate(0.01, 0.005, 0.0);
    }

    render(gl, cam) {
        if(this.#canRender) {
            gl.useProgram(this.program);
            gl.uniformMatrix4fv(this.modelLocation, false, this.model());
            gl.uniformMatrix4fv(this.viewLocation, false, cam.createView());
            gl.uniformMatrix4fv(this.projectionLocation, false, mat.transpose(mat.projection(50, 50, 50.0, 800)));
            gl.enableVertexAttribArray(this.positionAttribute);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.#positionBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#indexBuffer);

            const size = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;

            gl.vertexAttribPointer(this.positionAttribute, size, type, normalize, stride, offset);
            gl.drawElements(gl.TRIANGLES, this.#indices.length, gl.UNSIGNED_SHORT, 0);
        }

    }
}