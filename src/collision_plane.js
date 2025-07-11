class CollisionPlane {

    modelLocation
    viewLocation
    projectionLocation
    positionAttribute
    positionBuffer;

    model = mat.identity();
    vertices = [];


    translation;
    rotation;
    scale;

    collisions;

    canRender = false;

    loaded = false;

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
            this.loaded = true;
        });

        this.translation = [0, 0, 0];
        this.rotation = [0, 0, 0];
        this.scale = [0, 0, 0];
        
        this.collisions = [];
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

    collides(other) {
        // uses the SAT to test for collision against the other object.

        const transformVerts = (m, v) => {
             // transformed into world space then into the x/y plane
            const out = [];
            for(let i = 0; i < v.length; i+=3) {
                const p = [v[i], v[i+1], v[i+2], 1];
                const t = mat.multiplyVec(m, p);
                out.push([t[0],t[2]]);
            }
            return out;
        }

        const axes = []; // axis should be normals of each edge.
        
        const verts = transformVerts(this.model, this.vertices);
        const otherVerts = transformVerts(other.model, other.vertices);
        
        /*Fill the axes array with the edge normals */
        for(let i = 0; i < verts.length; i++) {
            const p1 = verts[i];
            const p2 = i+1 < verts.length ? verts[i+1] : verts[0]; 
            
            const edge = vec.subtract(p1, p2);
            const norm = vec.normalize(vec.perp(edge));
            
            axes.push(norm);
        }

        for(let i = 0; i < otherVerts.length; i++) {
            const p1 = otherVerts[i];
            const p2 = i+1 < otherVerts.length ? otherVerts[i+1] : otherVerts[0]; 

            const edge = vec.subtract(p1, p2);
            const norm = vec.normalize(vec.perp(edge));

            axes.push(norm); 
        }

        /* Check for seperating axes */

        const projectVerts = (axis, v) => {
            
            const proj = {
                min: vec.dot(axis, v[0]),
                max: vec.dot(axis, v[0])
            };

            for(let i = 0; i < v.length; i++) {
                const p = vec.dot(axis, v[i]);
                
                if(p < proj.min) {
                    proj.min = p;
                } else if(p > proj.max) {
                    proj.max = p;
                }
            }

            return proj;

        }

        const overlaps = (proj1, proj2) => {
            return (proj1.max >= proj2.min &&
                proj1.min <= proj2.max);
        }

        for(let i = 0; i < axes.length; i++) {
            const axis = axes[i];
            const proj = projectVerts(axis, verts);
            const otherProj = projectVerts(axis, otherVerts);
            
            if(!overlaps(proj, otherProj)) {
                return false;
            }
        }

        return true;

    }

    checkCollisions(collidables) {
        /*
            iterate through a list of objects to check collisions for and call collides(other).
            If collides(other), then add to collision list. This implementation is designed for
            one moving object only, if checking collisions for multiple moving objects, the behaviour is
            undefined.
        */

            collidables.forEach(other => {
                if(this.loaded && other.loaded) {
                    
                    if(this.collides(other)) {
                        console.log("COLLISION!");
                    }    
                }
            });

    }

    render(cam) {
        if(this.loaded) {
            gl.useProgram(CollisionPlane.lineShader);
            gl.uniformMatrix4fv(this.modelLocation, false, mat.transpose(this.model));
            gl.uniformMatrix4fv(this.viewLocation, false, mat.transpose(cam.createView()));
            gl.uniformMatrix4fv(this.projectionLocation, false, mat.transpose(mat.projection(cam.displayWidth, cam.displayHeight, cam.zNear, cam.zFar)));

            this.ext.bindVertexArrayOES(this.vao);
            gl.drawArrays(gl.LINE_LOOP, 0, this.vertices.length / 3);
        }
    }
}