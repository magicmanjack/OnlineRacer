/*
    Implements a particle system.
    Create a particle generator,
    Assign a particle textures,
    Attach to sceneNode
*/

class ParticleGenerator {
    constructor(textureFileName) {
        this.emitAmount = 10;
        this.maxParticles = 100;
        this.enable = true;

        this.particles = [];

        this.shader = createProgram("shaders/particles/particle.vert", "shaders/particles/particle.frag");
        this.vao = ext.createVertexArrayOES();

        this.viewUniform = gl.getUniformLocation(this.shader, "u_view");
        this.projectionUniform = gl.getUniformLocation(this.shader, "u_projection");
        this.vertexAttribute = gl.getAttribLocation(this.shader, "a_position");
        this.textureCoordAttribute = gl.getAttribLocation(this.shader, "a_texcoord");
        this.positionUniform = gl.getUniformLocation(this.shader, "u_emitter_world_pos");
        this.offsetUniform = gl.getUniformLocation(this.shader, "u_offset");
        this.sizeUniform = gl.getUniformLocation(this.shader, "u_size");
        

        this.position = [0.0, 0.0, 0.0];

        this.vertices = [
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
            -0.5, 0.5, 0.0,
            0.5, 0.5, 0.0
        ];
        

        this.textureCoords = [
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ];

        this.loaded = false;
        loadTextureAsync(textureFileName).then((t) => {
            this.texture = t;
            this.loaded = true;
        });

        this.setupVAO();
    }

    setupVAO() {
        //Sets up the vertex array object. 
        this.vertexBuffer = gl.createBuffer();
        this.textureCoordBuffer = gl.createBuffer();

        ext.bindVertexArrayOES(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        const size = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        
        gl.enableVertexAttribArray(this.vertexAttribute);
        gl.vertexAttribPointer(this.vertexAttribute, size, type, normalize, stride, offset);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textureCoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.textureCoordAttribute);
        gl.vertexAttribPointer(this.textureCoordAttribute, 2, type, normalize, stride, offset);

        ext.bindVertexArrayOES(null);
    }

    update() {
        if(this.parent) {
            this.position = mat.getTranslationVector(this.parent.world);
        }
        
        //Generate new particles, update current particles, and kill off old ones


        //Remove old particles if over max
        if(this.enable) {
            if(this.particles.length + this.emitAmount > this.maxParticles) {
                const nRemove = (this.particles.length + this.emitAmount) - this.maxParticles;
                this.particles.splice(0, nRemove); 
            }
            for(let i = 0; i < this.emitAmount; i++) {
                const p = {
                    position: [0, 0, 0],
                    velocity: [0, 0, 0],
                    size: [1,1],
                    ttl:-1
                };
                if(this.particleInit && typeof this.particleInit == "function") {
                    this.particleInit(p)
                }
                this.particles.push(p);
            }
        }

        for(let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            p.ttl--;

            if(p.ttl == 0) {
                //kill off
                this.particles.splice(i, 1);
                i--;
                continue;
            }

            //update
        
            if(this.particleUpdate && typeof this.particleUpdate == "function") {
                this.particleUpdate(p);
            }
            
        }

    }

    render(cam) {
        if(this.loaded && this.particles.length >0) {
            gl.useProgram(this.shader);
            
            gl.uniformMatrix4fv(this.projectionUniform, false, mat.transpose(mat.projection(cam.displayWidth, cam.displayHeight, cam.zNear, cam.zFar)));
            gl.uniformMatrix4fv(this.viewUniform, false, mat.transpose(cam.createView()));
            gl.uniform3fv(this.positionUniform, new Float32Array(this.position));

            ext.bindVertexArrayOES(this.vao);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            this.particles.forEach((p) => {
                
                gl.uniform3fv(this.offsetUniform, new Float32Array(p.position));
                gl.uniform2fv(this.sizeUniform, new Float32Array(p.size));
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertices.length/3);

            });
            
        }
    }
}

