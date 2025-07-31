const UILayer = [];

class UIPanel {

    /*
        Represents a simple square panel that can be added to the UI layer.
        Renders with a specified texture and utilizes orthographic projection.
        Because of the ortho projection, the coordinates of the bounding box are
        proportional to the view port x/y space. This allows for easy checking of
        whether the mouse pointer intersects with a box. The coordinates of the panel
        are in normalized space (e.g. [-1..1, -1...1]).
     */

    projectionLocation;

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
        const z = -30.0;

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

        this.projectionLocation = gl.getUniformLocation(UIPanel.shader, "u_projection");
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

    checkMouseHover(pointerX, pointerY) {
        /*
            Returns true if the mouse pointer is hovering over the panel.
        */
        //TODO: get transformed points. Get mouse postion in terms of NDC space. Check collision using traditional box method.

        const proj = mat.projection(Camera.main.displayWidth, Camera.main.displayHeight, Camera.main.zNear, Camera.main.zFar);
        const v = this.vertices;
        const ll = mat.multiplyVec(proj, [v[0], v[1], v[2], 1]);
        const rl = mat.multiplyVec(proj, [v[3], v[4], v[5], 1]);
        const lu = mat.multiplyVec(proj, [v[6], v[7], v[8], 1]);
        const ru = mat.multiplyVec(proj, [v[9], v[10], v[11], 1]);

        

    }

    render(cam) {
        if(this.loaded) {
            gl.useProgram(UIPanel.shader);
            gl.uniformMatrix4fv(this.projectionLocation, false, mat.transpose(mat.projection(cam.displayWidth, cam.displayHeight, cam.zNear, cam.zFar)));
            this.ext.bindVertexArrayOES(this.vao);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertices.length/3);
        }  
    }

}