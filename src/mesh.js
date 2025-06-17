class Mesh {

    #modelLocation
    #viewLocation
    #projectionLocation
    #positionAttribute
    #textureCoordLocation

    #positionBuffer;
    #textureCoordsBuffer;
    #indexBuffer;
    #texture;

    #rotation = [0, 0, 0];
    #translation = [0, 0, 0];
    #scale = [0, 0, 0];

    #vertices = [];
    #indices = [];
    #textureCoords = [];

    #canRender = false;


    constructor(gl, modelFileNames, textureName="/textures/default.png") {
        
        //Compile shaders
        this.program = createProgram(gl, "shaders/textured.vert", "shaders/textured.frag");

        //Getting variable locations.
        this.#modelLocation = gl.getUniformLocation(this.program, "u_model");
        this.#viewLocation = gl.getUniformLocation(this.program, "u_view");
        this.#projectionLocation = gl.getUniformLocation(this.program, "u_projection");
        this.#positionAttribute = gl.getAttribLocation(this.program, "a_position");
        this.#textureCoordLocation = gl.getAttribLocation(this.program, "a_texcoord");

        Promise.all([loadModel(modelFileNames).then(this.loadVertices), this.loadTextureAsync(textureName)])
        .then(() => {
            this.#canRender = true;
        });
        
        
    }

    loadVertices = (model) => {
        /*
            TODO: need to fix loading files with multiple mesh declarations.
        */

        //console.log(JSON.stringify(model));
        for(let i = 0; i < model.meshes.length; i++) {
            this.#vertices = this.#vertices.concat(model.meshes[i].vertices);
            this.#textureCoords = model.meshes[i].texturecoords[0];

            for(let j = 0; j < model.meshes[i].faces.length; j++) {
                //converts array of [[1, 2, 3], [4, 5, 6]] to a 1D array.
                for(let k = 0; k < 3; k++) {
                    this.#indices.push(model.meshes[i].faces[j][k]);
                }
            }

        }
        
        // Setting up vertex, textcoords, and indices array.
        this.#positionBuffer = gl.createBuffer();
        this.#textureCoordsBuffer = gl.createBuffer();
        this.#indexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.#positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.#vertices), gl.STATIC_DRAW);


        gl.bindBuffer(gl.ARRAY_BUFFER, this.#textureCoordsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.#textureCoords), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.#indices), gl.STATIC_DRAW);

    };

    loadTextureAsync = (textureName) => {
        
        return new Promise( (resolve, reject) => {
            let img = new Image();
            img.src = textureName;
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image.'));
        }).then((img) => {
            this.#texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.#texture);
            //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

            //Need to the y-axis in the src data because textures are stored internally flipped vertically.
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); 
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            
            const isPowOf2 = (value) => (value & (value - 1)) === 0;

            if(isPowOf2(img.width) && isPowOf2(img.height)) {
                //Can use mipmapping.
                 gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                //Cannot use mipmapping and can only use clamp to edge and nearest or linear filtering.

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }


        })

    };

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
            gl.uniformMatrix4fv(this.#modelLocation, false, this.model());
            gl.uniformMatrix4fv(this.#viewLocation, false, cam.createView());
            gl.uniformMatrix4fv(this.#projectionLocation, false, mat.transpose(mat.projection(50, 50, 50.0, 800)));

            gl.enableVertexAttribArray(this.#positionAttribute);
            gl.enableVertexAttribArray(this.#textureCoordLocation);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.#positionBuffer);
                const size = 3;
                const type = gl.FLOAT;
                const normalize = false;
                const stride = 0;
                const offset = 0;

            gl.vertexAttribPointer(this.#positionAttribute, size, type, normalize, stride, offset);

            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.#textureCoordsBuffer);
            gl.vertexAttribPointer(this.#textureCoordLocation, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#indexBuffer);

            gl.bindTexture(gl.TEXTURE_2D, this.#texture);
            gl.drawElements(gl.TRIANGLES, this.#indices.length, gl.UNSIGNED_SHORT, 0);
        }

    }
}