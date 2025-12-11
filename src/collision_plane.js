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
    collided;
    collisionMTV;
    collisionNormal;
    debugDrawBuffer;

    parent;

    loaded = false;

    static lineShader;

    constructor(collider) {
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
        this.colorToggleLocation = gl.getUniformLocation(CollisionPlane.lineShader, "u_toggle");
        
        if(collider === undefined) {
            //Load defaults.
            loadModelFile(["models/square_collider.obj"]).then((model) => {this.loadVertices(model.meshes[0])}).then(() => {
                this.loaded = true;
            });
        } else {
            //Load collider
            this.loadVertices(collider);
            this.loaded = true;
        }

        this.translation = [0, 0, 0];
        this.rotation = [0, 0, 0];
        this.scale = [1, 1, 1];
        
        this.collisions = [];
        this.collisionMTV = [0, 0, 0];
        this.collisionNormal = [0, 0, 0];

        SceneNode.collidables.push(this);
    }  

    loadVertices = (mesh) => {
        
        // Loads vertices from mesh.faces and mesh.vertices
        for(let i = 0; i < mesh.faces.length; i++) {
           //For each face

           for(let j = 0; j < mesh.faces[i].length; j++) {
                //For each vertex index of a face
                this.vertices = this.vertices.concat(mesh.vertices.slice(mesh.faces[i][j] * 3, mesh.faces[i][j] * 3 + 3));     
           }
           
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

        const thisAxes = []; // axis should be normals of each edge.
        const otherAxes = [];
        
        const verts = transformVerts(this.model, this.vertices);
        const otherVerts = transformVerts(other.model, other.vertices);
        
        /*Fill the axes array with the edge normals */
        for(let i = 0; i < verts.length; i++) {
            const p1 = verts[i];
            const p2 = i+1 < verts.length ? verts[i+1] : verts[0]; 
            
            
            if(vec.magnitude(vec.subtract(p1, p2)) == 0) {
                // In the case that the points refer to the same point, do not generate normal.
                continue;
            }
            
            

            const edge = vec.subtract(p1, p2);
            const norm = vec.normalize(vec.perp(edge));
            
            thisAxes.push(norm);
        }

        for(let i = 0; i < otherVerts.length; i++) {
            const p1 = otherVerts[i];
            const p2 = i+1 < otherVerts.length ? otherVerts[i+1] : otherVerts[0]; 

            if(vec.magnitude(vec.subtract(p1, p2)) == 0) {
                // In the case that the points refer to the same point, do not generate normal.
                continue;
            }

            const edge = vec.subtract(p1, p2);
            const norm = vec.normalize(vec.perp(edge));

            otherAxes.push(norm); 
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

        const getOverlap = (proj1, proj2) => {
            //Returns the overlap of the two projections.
            if(proj1.max > proj2.max) {
                // proj1 is on right and proj2 on left
                return proj2.max - proj1.min;
            } else {
                // proj2 is on right and proj1 on left
                return -1* (proj1.max - proj2.min);
            }
        

        }

        let smallestOverlap = Number.POSITIVE_INFINITY;
        let smallestOverlapAxis = null;

        for(let i = 0; i < otherAxes.length; i++) {
            const axis = otherAxes[i];
            const proj = projectVerts(axis, verts);
            const otherProj = projectVerts(axis, otherVerts);
            
            if(!overlaps(proj, otherProj)) {
                this.collisionMTV = [0, 0, 0];
                return false;
            }

            //Does overlap
            if(Math.abs(getOverlap(proj, otherProj)) < Math.abs(smallestOverlap)) {
                smallestOverlap = getOverlap(proj, otherProj);
                smallestOverlapAxis = axis;
            }

        }

        this.collisionNormal = vec.scale(smallestOverlap>0?1:-1, [smallestOverlapAxis[0], 0, smallestOverlapAxis[1]]);

        for(let i = 0; i < thisAxes.length; i++) {
            const axis = thisAxes[i];
            const proj = projectVerts(axis, verts);
            const otherProj = projectVerts(axis, otherVerts);
            
            if(!overlaps(proj, otherProj)) {
                this.collisionMTV = [0, 0, 0];
                return false;
            }

            //Does overlap
            if(Math.abs(getOverlap(proj, otherProj)) < Math.abs(smallestOverlap)) {
                smallestOverlap = getOverlap(proj, otherProj);
                smallestOverlapAxis = axis;
            }

        }
        
        //Calculate MTV
        
        this.collisionMTV = vec.scale(smallestOverlap, [smallestOverlapAxis[0], 0, smallestOverlapAxis[1]]);
        
        return true;

    }

    checkCollisions(collidables) {
        /*
            iterate through a list of objects to check collisions for and call collides(other).
            If collides(other), then add to collision list. This implementation is designed for
            one moving object only, if checking collisions for multiple moving objects, the behaviour is
            undefined.
        */
            this.collided = false;
            this.collisions = [];
            collidables.forEach(other => {
                if(other === this) {
                    return;
                }
                if(this.loaded && other.loaded) {
                    
                    if(this.collides(other)) {
                        
                        this.collisions.push({
                            sceneNode: other.parent,
                            MTV: this.collisionMTV,
                            normal: this.collisionNormal
                        });
                        this.collided = true;
                    }    
                }
            });

    }

    render(cam) {
        if(this.loaded) {
            gl.useProgram(CollisionPlane.lineShader);
            gl.uniform1i(this.colorToggleLocation, this.collided ? 1 : 0);
            gl.uniformMatrix4fv(this.modelLocation, false, mat.transpose(this.model));
            gl.uniformMatrix4fv(this.viewLocation, false, mat.transpose(cam.createView()));
            gl.uniformMatrix4fv(this.projectionLocation, false, mat.transpose(mat.projection(cam.displayWidth, cam.displayHeight, cam.zNear, cam.zFar)));

            this.ext.bindVertexArrayOES(this.vao);
            gl.drawArrays(gl.LINE_LOOP, 0, this.vertices.length / 3);
            this.ext.bindVertexArrayOES(null);

            if(this.collided) {
                gl.uniformMatrix4fv(this.modelLocation, false, mat.transpose(mat.identity()));
                //Draw MTV
                this.collisions.forEach((collision) => {

                    gl.uniform1i(this.colorToggleLocation, 1); //Toggles red color
                    if(!this.debugDrawBuffer) {
                        this.debugDrawBuffer = gl.createBuffer();
                    }
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.debugDrawBuffer);
                    const t = mat.getTranslationVector(this.model);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...t, collision.MTV[0] + t[0],collision.MTV[1] + t[1], collision.MTV[2] + t[2]]), gl.STATIC_DRAW);

                    const size = 3;
                    const type = gl.FLOAT;
                    const normalized = false;
                    const stride = 0;
                    const offset = 0;

                    gl.enableVertexAttribArray(this.positionAttribute);
                    gl.vertexAttribPointer(this.positionAttribute, size, type, normalized, stride, offset);
                    gl.drawArrays(gl.LINE_LOOP, 0, 2)

                    gl.uniform1i(this.colorToggleLocation, 0); //Toggles green color
                    if(!this.debugDrawBuffer) {
                        this.debugDrawBuffer = gl.createBuffer();
                    }
                    
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...t, collision.normal[0] + t[0],collision.normal[1] + t[1], collision.normal[2] + t[2]]), gl.STATIC_DRAW);

                    gl.enableVertexAttribArray(this.positionAttribute);
                    gl.vertexAttribPointer(this.positionAttribute, size, type, normalized, stride, offset);
                    gl.drawArrays(gl.LINE_LOOP, 0, 2)

                    
                })
                
            }
        }
    }
}