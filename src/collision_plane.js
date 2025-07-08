class CollisionPlane {

    modelLocation
    viewLocation
    projectionLocation
    positionAttribute
    positionBuffer;

    model = mat.identity();
    vertices = [];
    indices = [];

    translation;
    rotation;
    scale;

    canRender = false;

    static lineShader;

    constructor() {
        if(!CollisionPlane.lineShader) {
            CollisionPlane.lineShader = createProgram("shaders/passthrough.vert", "shaders/line.frag");
        }

        //VAO to store rendering state.
        this.ext = gl.getExtension("OES_vertex_array_object");
        this.vao = this.ext.createVertexArrayOES();
    
        this.modelLocation = gl.getUniformLocation(CollisionPlane.lineShader, "u_model");
        this.viewLocation = gl.getUniformLocation(CollisionPlane.lineShader, "u_view");
        this.projectionLocation = gl.getUniformLocation(CollisionPlane.lineShader, "u_projection");
        this.positionAttribute = gl.getAttribLocation(CollisionPlane.lineShader, "a_position");
    
        loadModel(["models/square_collider.obj"]).then(this.loadVertices).then(() => {
            this.canRender = true;
        });

        this.translation = [0, 0, 0];
        this.rotation = [0, 0, 0];
        this.scale = [0, 0, 0];
    }  

    loadVertices = (model) => {
        
        for(let i = 0; i < model.meshes.length; i++) {
            this.vertices = this.vertices.concat(model.meshes[i].vertices);
        }

        this.positionBuffer = gl.createBuffer();
        
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
    }

    render(cam) {
        if(this.canRender) {
            gl.useProgram(CollisionPlane.lineShader);
            gl.uniformMatrix4fv(this.modelLocation, false, mat.transpose(this.model));
            gl.uniformMatrix4fv(this.viewLocation, false, mat.transpose(cam.createView()));
            gl.uniformMatrix4fv(this.projectionLocation, false, mat.transpose(mat.projection(cam.displayWidth, cam.displayHeight, cam.zNear, cam.zFar)));

            this.ext.bindVertexArrayOES(this.vao);
            gl.drawArrays(gl.LINE_LOOP, 0, this.vertices.length / 3);
        }
    }
}