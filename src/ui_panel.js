let UILayer = [];

function removeUIPanel(UIPanel) {
    /* 
        Removes a UIPanel from the UILayer.
    */

    for(let i = 0; i < UILayer.length; i++) {
        if(UILayer[i] == UIPanel) {
            UILayer.splice(i, 1);
        }
    }
}

class UIPanel {

    /*
        Represents a simple square panel that can be added to the UI layer.
        Renders with a specified texture.
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
    textures = [];
    textureIndex;

    // callback function 
    whenClicked;
    mouseHovering = false;
    update;

    loaded;

    static shader;

    constructor(x, y, w, h, textures) {

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
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ];

        this.textures = new Array(textures.length);
        this.textureIndex = 0;

        for(let i = 0; i < textures.length; i++) {
            loadTextureAsync(textures[i]).then((texture) => {
                if(i == textures.length - 1) {
                    this.loaded = true;
                }
                this.textures[i] = texture;
            });
        }

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

    checkMouseHover() {
        /*
            Returns true if the mouse pointer is hovering over the panel.
        */
        //TODO: get transformed points. Get mouse postion in terms of NDC space. Check collision using traditional box method.

        function perspectiveDivide(vec4) {
            return [vec4[0]/vec4[3], vec4[1]/vec4[3], vec4[2]/vec4[3], 1];
        }

        const proj = mat.projection(Camera.main.displayWidth, Camera.main.displayHeight, Camera.main.zNear, Camera.main.zFar);
        const v = this.vertices;
        const ll = perspectiveDivide(mat.multiplyVec(proj, [v[0], v[1], v[2], 1]));
        const rl = perspectiveDivide(mat.multiplyVec(proj, [v[3], v[4], v[5], 1]));
        const lu = perspectiveDivide(mat.multiplyVec(proj, [v[6], v[7], v[8], 1]));
        const ru = perspectiveDivide(mat.multiplyVec(proj, [v[9], v[10], v[11], 1]));

        const mx = input.mouseXNorm; // Normalized mouse coordinates (to the window size) -1 to 1.
        const my = input.mouseYNorm;
        
        if(mx >= ll[0] && mx <= rl[0] && my <= lu[1] && my >= ll[1]) {
            this.mouseHovering = true;
            if(input.mouseClicked) {
                //console.log("Button clicked!");
                if(typeof this.whenClicked == "function") {
                    this.whenClicked();
                }
            }
        } else {
            this.mouseHovering = false;
        }
    }

    render(cam) {
        if(this.loaded) {
            gl.useProgram(UIPanel.shader);
            gl.uniformMatrix4fv(this.projectionLocation, false, mat.transpose(mat.projection(cam.displayWidth, cam.displayHeight, cam.zNear, cam.zFar)));
            this.ext.bindVertexArrayOES(this.vao);
            gl.bindTexture(gl.TEXTURE_2D, this.textures[this.textureIndex]);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertices.length/3);
        }  
    }

}