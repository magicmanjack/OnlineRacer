let UILayer = [];

function removeUIPanel(UIPanel) {
    /* 
        Removes a UIPanel from the UILayer.
    */

    for(let i = 0; i < UILayer.length; i++) {
        if(UILayer[i] == UIPanel) {
            UILayer[i].removeText();
            UILayer.splice(i, 1);
        }
    }
}

function clearUIPanel() {
    for (const element of UILayer) {
        element.removeText();
    }
    UILayer = [];
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
    textures;
    textureIndex;

    // callback function 
    whenClicked;
    whenFocused; // Only called when ui focused upon mouse selection. If the mouse clicks off the UI component, whenFocused is no longer called.
    mouseHovering = false;
    update;
    id = 1;
    static #focused = [];

    loaded;

    static shader;

    canvas;
    textCtx;
    textContent;
    textTex;
    size;
    font;
    fillStyle;

    jersey15font = new FontFace("jersey15", "url('https://fonts.gstatic.com/s/jersey15/v4/_6_9EDzuROGsUuk2TWjiZYAg.woff2')");

    constructor(x, y, w, h, textures=null) {

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
        const z = -1 * Camera.main.zNear - 0.1;
        this.z = z;
        
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

        this.textureIndex = 0;
        
        if(textures && textures.length > 0) {

            this.textures = new Array(textures.length);

            for(let i = 0; i < textures.length; i++) {
                loadTextureAsync(textures[i]).then((texture) => {
                    if(i == textures.length - 1) {
                        this.loaded = true;
                    }
                    this.textures[i] = texture;
                });
            }
        } else {
            this.loaded = true;
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

    recalculateVertices() {
        /*
            Recalculates the vertices of the panel and loads them into an OpenGL array buffer.
        */
        const x = this.x;
        const y = this.y;
        const z = this.z; 
        const w = this.w;
        const h = this.h;

        this.vertices = [
            x - w / 2, y - h / 2, z,
            x + w / 2, y - h / 2, z,
            x - w / 2, y + h / 2, z,
            x + w / 2, y + h / 2, z
        ];

        // Load into buffer

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
        
        this.ext.bindVertexArrayOES(null);
    }

    checkMouseHover() {
        /*
            Returns true if the mouse pointer is hovering over the panel.
        */
        //TODO: get transformed points. Get mouse postion in terms of NDC space. Check collision using traditional box method.

        const proj = mat.projection(Camera.main.displayWidth, Camera.main.displayHeight, Camera.main.zNear, Camera.main.zFar);
        const v = this.vertices;
        const ll = vec4.perspectiveDivide(mat.multiplyVec(proj, [v[0], v[1], v[2], 1]));
        const rl = vec4.perspectiveDivide(mat.multiplyVec(proj, [v[3], v[4], v[5], 1]));
        const lu = vec4.perspectiveDivide(mat.multiplyVec(proj, [v[6], v[7], v[8], 1]));
        const ru = vec4.perspectiveDivide(mat.multiplyVec(proj, [v[9], v[10], v[11], 1]));

        const mx = input.mouseXNorm; // Normalized mouse coordinates (to the window size) -1 to 1.
        const my = input.mouseYNorm;
        
        if(mx >= ll[0] && mx <= rl[0] && my <= lu[1] && my >= ll[1]) {
            this.mouseHovering = true;
            if(input.mouseClicked) {
                this.hasFocus = true;
                UIPanel.#focused.push(this);
                //console.log("Button clicked!");
                if(typeof this.whenClicked == "function") {
                    this.whenClicked();
                }
            } 
        } else {
            if(input.mouseClicked) {
                this.hasFocus = false;
                UIPanel.#focused = UIPanel.#focused.filter(ui => ui != this); // Remove from focused list
                this.whenLostFocus && typeof(this.whenLostFocus) === "function" && this.whenLostFocus();
            }
            this.mouseHovering = false;
        }

        if(this.hasFocus && this.textInput) {
            //Check input events for keyboard key input

            input.events.forEach((e) => {
                const alphabetical = /^[A-Za-z]$/;
                if(e.type == "keydown") {
                    //If a valid input character
                    if( alphabetical.test(e.key)) {
                        //First check if the text fits
                        const metrics = this.textCtx.measureText(this.textContent + e.key);
                        
                        const scaleFactor = Camera.main.displayWidth / this.textCtx.canvas.width;
                        
                        if(metrics.width * scaleFactor <= this.w ) {
                            this.textContent += e.key;
                        }
                    } else if (e.key == "Backspace") {
                        this.textContent = this.textContent.slice(0, this.textContent.length - 1);
                    }
                }
            })
        }
    }

    addTextInput(size=this.h, font="jersey15, monospace", fillStyle="white") {
        this.addText("", size, font, fillStyle);
        this.textInput = true;
    }

    removeTextInput() {
        removeText();
        this.textInput = false;
    }

    addText(content, size=this.h, font="jersey15, monospace", fillStyle="white") {
        /*
            Adds text as a texture (which in turn uses a canvas HTML element)
            The default font size is 54px as that fits with the green connect background texture
        */

        // Create new canvas element
        this.canvas = document.createElement("canvas");
        this.textCtx = this.canvas.getContext("2d");
        document.getElementById("gameContainer").appendChild(this.canvas);

        this.size = size;
        this.font = font;
        this.fillStyle = fillStyle;

        // Set text properties
        this.textContent = content;
        this.textCtx.canvas.width = gl.canvas.width;
        this.textCtx.canvas.height = gl.canvas.height;
        this.textCtx.textAlign = "center";
        this.textCtx.textBaseline = "middle";
        this.textCtx.font = `${this.size * this.textCtx.canvas.width / 10}px ${this.font}`;
        this.jersey15font.load().then((font) => {
            document.fonts.add(font);
            //Calculate the pixel size of the font if the size is in world units
            const scaleFactor = this.textCtx.canvas.height / Camera.main.displayHeight;
            
            this.textCtx.font = `${this.size * scaleFactor}px jersey15`;
        });
        this.textCtx.fillStyle = fillStyle;
        this.textCtx.fillText(this.textContent, -1000, -1000);
        // Why (-1000, -1000)?
        // =================== 
        // So we don't see the text's starting position before it gets moved 

        // // Create texture for text
        // this.textTex = gl.createTexture();
        // gl.bindTexture(gl.TEXTURE_2D, this.textTex);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textCtx.canvas);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    removeText() {
        if (this.canvas) {
            this.canvas.remove();
        }
        gl.deleteTexture(this.textTex);
    }

    render(cam) {
        if(this.loaded) {
            gl.useProgram(UIPanel.shader);
            let location = mat.transpose(mat.projection(cam.displayWidth, cam.displayHeight, cam.zNear, cam.zFar));
            gl.uniformMatrix4fv(this.projectionLocation, false, location);
            this.ext.bindVertexArrayOES(this.vao);

            if(this.textures) {
                gl.bindTexture(gl.TEXTURE_2D, this.textures[this.textureIndex]);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertices.length/3);
            }


            if (this.textCtx !== undefined) {
                // place the text at the correct position 
                // TODO: convert this to use recalculateVertices()

                 // convert from clip space to pixels
                this.textCtx.clearRect(0, 0, this.textCtx.canvas.width, this.textCtx.canvas.height);

                location = mat.multiplyVec(mat.projection(cam.displayWidth, cam.displayHeight, cam.zNear, cam.zFar), [this.x, this.y, this.z, 1]);

                location[0] /= location[3];
                location[1] /= location[3];

                const pixelX = (location[0] * 0.5 + 0.5) * gl.canvas.width;
                const pixelY = (location[1] * -0.5 + 0.5) * gl.canvas.height;

                this.textCtx.canvas.width = gl.canvas.width;
                this.textCtx.canvas.height = gl.canvas.height;
                this.textCtx.textAlign = "center";
                this.textCtx.textBaseline = "middle";
                
                //Size is in world units so calculate font pixel size
                const scaleFactor = this.textCtx.canvas.height / Camera.main.displayHeight;
                this.textCtx.font = `${this.size * scaleFactor}px ${this.font}`;
                this.textCtx.shadowColor = "black";
                this.textCtx.shadowBlur = 3;
                this.textCtx.fillStyle = this.fillStyle;
                this.textCtx.fillText(this.textContent, pixelX, pixelY);
            }
        }
    }

    static getFocused() {
        return this.#focused;
    }

}