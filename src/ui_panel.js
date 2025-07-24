const UILayer = [];

class UIPanel {

    /*
        Represents a simple square panel that can be added to the UI layer.
        Renders with a specified texture and utilizes orthographic projection.
        Because of the ortho projection, the coordinates of the bounding box are
        proportional to the view port x/y space. This allows for easy checking of
        whether the mouse pointer intersects with a box.
     */

    modelLocation;
    model = mat.identity();

    x;
    y;
    w;
    h;

    positionAttribute;
    positionBuffer;
    vertices = [];

    textureCoordsLocation;
    textureCoordsBuffer;
    textureCoords = [];
    texture;

    loaded;

    static shader;

    constructor(x, y, w, h, texture) {

        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        if(!UIPanel.shader) {
            //Make sure the ui shader program is ready.
            UIPanel.shader = createProgram("shaders/ui.vert", "shaders/ui.frag");
        }

        /*
            vertices defined in the order of ll, rl, lu, ru,
        */
        const z = -1.0;

        this.vertices = [
            x - w / 2, y - h / 2, z,
            x + w / 2, y - h / 2, z,
            x - w / 2, y + h / 2, z,
            x + w / 2, y + h / 2, z
        ];

        this.textureCoords = [
            0, 1,
            1, 1,
            0, 0,
            1, 0
        ];

        loadTextureAsync(texture).then((texture) => {
            this.loaded = true;
            this.texture = texture;
        });

        //Create a vao that will store rendering state.
        this.ext = gl.getExtension("OES_vertex_array_object");
        this.vao = this.ext.createVertexArrayOES();

        this.modelLocation = gl.getUniformLocation(UIPanel.shader, "u_model");
        this.positionAttribute = gl.getAttribLocation(UIPanel.shader, "a_position");
        this.textureCoordsLocation = gl.getAttribLocation(UIPanel.shader, "a_texcoord");

        /* Buffering data time */

        this.positionBuffer = gl.createBuffer();
        this.textureCoordsBuffer = gl.createBuffer();

        this.ext.bindVertexArrayOES(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        const size = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        gl.enableVertexAttribArray(this.positionAttribute);
        gl.vertexAttribPointer(this.positionAttribute, size, type, normalize, stride, offset);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textureCoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.textureCoordsLocation);
        gl.vertexAttribPointer(this.textureCoordsLocation, 2, type, normalize, stride, offset);


    }

    render() {
        if(this.loaded) {
            gl.useProgram(UIPanel.shader);
            gl.uniformMatrix4fv(this.modelLocation, false, mat.transpose(this.model));
            this.ext.bindVertexArrayOES(this.vao);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertices.length/3);
        }  
    }

}