class Mesh {

    parent;

    modelLocation
    viewLocation
    projectionLocation
    positionAttribute
    textureCoordLocation

    positionBuffer;
    textureCoordsBuffer;
    indexBuffer;
    texture;

    model = mat.identity();

    vertices = [];
    indices = [];
    textureCoords = [];

    name;
    loaded = false;

    static defaultShader;


    constructor(mesh, material, shader=Mesh.defaultShader) {

        if(!shader && !Mesh.defaultShader) {
            Mesh.defaultShader = createProgram("shaders/textured.vert", "shaders/textured.frag");
            this.shader = Mesh.defaultShader;
        } else {
            this.shader = shader;
        }
        

        //Create vertex array object that stores this meshes rendering state.
        this.ext = gl.getExtension("OES_vertex_array_object");
        this.vao = this.ext.createVertexArrayOES();


        //Getting variable locations.
        this.modelLocation = gl.getUniformLocation(this.shader, "u_model");
        this.viewLocation = gl.getUniformLocation(this.shader, "u_view");
        this.projectionLocation = gl.getUniformLocation(this.shader, "u_projection");
        this.positionAttribute = gl.getAttribLocation(this.shader, "a_position");
        this.textureCoordLocation = gl.getAttribLocation(this.shader, "a_texcoord");
        if(debug) {
            console.log(`loading mesh ${mesh.name}`);
        }
        this.name = mesh.name;
        this.loadMeshData(mesh);
        this.loadMaterialData(material);
        
    }

    loadMeshData = (mesh) => {
        /*
            TODO: need to fix loading files with multiple mesh declarations.
        */

        //console.log(JSON.stringify(mesh, null, 2));
        //console.log(model.rootnode.children[0].transformation);
        //console.log(mat.getRotationVector(model.rootnode.children[0].transformation));

        
        this.vertices = this.vertices.concat(mesh.vertices);
        
        this.textureCoords = mesh.texturecoords[0];

        for (let j = 0; j < mesh.faces.length; j++) {
            //converts array of [[1, 2, 3], [4, 5, 6]] to a 1D array.
            for (let k = 0; k < 3; k++) {
                this.indices.push(mesh.faces[j][k]);
            }
        }


        // Setting up vertex, textcoords, and indices array.
        this.positionBuffer = gl.createBuffer();
        this.textureCoordsBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();

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
        gl.enableVertexAttribArray(this.textureCoordLocation);
        gl.vertexAttribPointer(this.textureCoordLocation, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

    };

    loadMaterialData = (material) => {
        let foundTextureName = false;
        for(let i = 0; i < material.properties.length; i++) {
            const p = material.properties[i];
            if(p.key == "$tex.file") {
                foundTextureName = true;
                loadTextureAsync(`textures/${p.value}`).then((texture) => {
                    this.loaded = true;
                    this.texture = texture;
                });
                break;
            }
        }
        
        if(!foundTextureName) {
            loadTextureAsync("textures/default.png").then((texture) => {
                    this.loaded = true;
                    this.texture = texture;
            });
        }
    }

    reuse = () => {
        /*
            Shallow copies every thing except the model matrix.
            This allows for reusing mesh data but drawing it in different positions.
        */
        const cloned = Object.create(this);
        cloned.model = Array.from(this.model);
        return cloned;
    }

    render(cam) {

        if (this.loaded) {
            gl.useProgram(this.shader);
            gl.uniformMatrix4fv(this.modelLocation, false, mat.transpose(this.model));
            gl.uniformMatrix4fv(this.viewLocation, false, mat.transpose(cam.createView()));
            gl.uniformMatrix4fv(this.projectionLocation, false, mat.transpose(mat.projection(cam.displayWidth, cam.displayHeight, cam.zNear, cam.zFar)));

            this.ext.bindVertexArrayOES(this.vao);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        }

    }
}