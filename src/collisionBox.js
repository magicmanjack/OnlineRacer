class CollisionBox {

    modelLocation
    viewLocation
    projectionLocation
    positionAttribute
    positionBuffer;
    indexBuffer;

    model = mat.identity();
    vertices = [];
    indices = [];

    translation;
    rotation;
    scale;

    canRender = false;

    static lineShader;

    constructor(modelFileName) {
        if(!CollisionBox.lineShader) {
            CollisionBox.lineShader = createProgram("shaders/passthrough.vert", "shaders/line.frag");
        }

        //VAO to store rendering state.
        this.ext = gl.getExtension("OES_vertex_array_object");
        this.vao = this.ext.createVertexArrayOES();
    
        this.modelLocation = gl.getUniformLocation(CollisionBox.lineShader, "u_model");
        this.viewLocation = gl.getUniformLocation(CollisionBox.lineShader, "u_view");
        this.projectionLocation = gl.getUniformLocation(CollisionBox.lineShader, "u_projection");
        this.positionAttribute = gl.getAttribLocation(CollisionBox.lineShader, "a_position");
    
        loadModel([modelFileName]).then(this.loadVertices).then(() => {
            this.canRender = true;
        });

        this.translation = [0, 0, 0];
        this.rotation = [0, 0, 0];
        this.scale = [0, 0, 0];
    }  

    loadVertices = (model) => {
        for(let i = 0; i < model.meshes.length; i++) {
            this.vertices = this.vertices.concat(model.meshes[i].vertices);

            for(let j = 0; j < model.meshes[i].faces.length; j++) {
                /*converts array of [[1, 2, 3], [4, 5, 6]] to a 1D array of
                    [1, 2, 3, 1, 4, 5, 6, 4]
                */
                for (let k = 0; k < 3; k++) {
                    this.indices.push(model.meshes[i].faces[j][k]);
                }
                this.indices.push(model.meshes[i].faces[j][0]);
            }
        }

        this.positionBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
        
        this.ext.bindVertexArrayOES(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        const size = 3;
        const type = gl.FLOAT;
        const normalized = false;
        const stride = 0;
        const offset = 0;

        gl.enableVertexAttribArray(this.positionAttribute);
        gl.vertexAttribPointer(this.positionAttribute, size, type, normalized, stride, offset);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
    }

    render(cam) {
        if(this.canRender) {
            gl.useProgram(CollisionBox.lineShader);
            gl.uniformMatrix4fv(this.modelLocation, false, mat.transpose(this.model));
            gl.uniformMatrix4fv(this.viewLocation, false, mat.transpose(cam.createView()));
            gl.uniformMatrix4fv(this.projectionLocation, false, mat.transpose(mat.projection(cam.displayWidth, cam.displayHeight, cam.zNear, cam.zFar)));

            this.ext.bindVertexArrayOES(this.vao);
            gl.drawElements(gl.LINE_STRIP, this.indices.length, gl.UNSIGNED_SHORT, 0);
        }
    }
}