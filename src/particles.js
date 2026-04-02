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
        this.interpolate = false; /* Whether or not the generator interpolates positions of 
        particle spawns between the position of the last update and this update */
        this.interpolationDelta = 0.4; // The gap between particle spawns if interpolate is set to true

        this.particles = [];

        this.shader = createProgram("shaders/particles/particle.vert", "shaders/particles/particle.frag");
        this.vao = ext.createVertexArrayOES();

        this.viewUniform = gl.getUniformLocation(this.shader, "u_view");
        this.projectionUniform = gl.getUniformLocation(this.shader, "u_projection");
        this.vertexAttribute = gl.getAttribLocation(this.shader, "a_position");
        this.textureCoordAttribute = gl.getAttribLocation(this.shader, "a_texcoord");
        this.offsetUniform = gl.getUniformLocation(this.shader, "u_offset");
        this.sizeUniform = gl.getUniformLocation(this.shader, "u_size");
        

        this.emitterPosition = [0.0, 0.0, 0.0];
        this.emitterLastPosition = this.emitterPosition;

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
            this.emitterPosition = mat.getTranslationVector(this.parent.world);
        }
        
        //Generate new particles, update current particles, and kill off old ones


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

        //Remove old particles if over max. TODO fix to work with interpolation
        if(this.enable) {

            
            if(this.interpolate) {
                //Interpolated spawning (spawn along the path between emitterLastPosition and emitterPosition)
                
                
                const p0 = {
                    position: this.emitterPosition,
                    velocity: [0, 0, 0],
                    size:[1, 1],
                    ttl:-1
                }

                if(this.particleInit && typeof this.particleInit == "function") {
                    this.particleInit(p0)
                }

                const p1 = this.particles.length == 0 ? p0 : this.particles[this.particles.length - 1];

                const nSpawns = Math.max(Math.floor(vec.magnitude(vec.subtract(this.emitterLastPosition, this.emitterPosition)) / this.interpolationDelta) - 1, 1);
                
                if(this.particles.length + nSpawns > this.maxParticles) {
                    const nRemove = (this.particles.length + this.emitAmount) - this.maxParticles;
                    this.particles.splice(0, nRemove); 
                }

                const deltaValues = {
                    pos: vec.scale(1/nSpawns, vec.subtract(p1.position, p0.position)),
                    vel: vec.scale(1/nSpawns, vec.subtract(p1.velocity, p0.velocity)),
                    size: vec.scale(1/nSpawns, vec.subtract(p1.size, p0.size)),
                    ttl: (p1.ttl - p0.ttl) * 1/nSpawns
                } // The deltas between each interpolated point
                
                

                //NOTICED BUG! MAKING JUMPS BY LENGTHS SUCH AS 20
                
                for(let i = nSpawns; i >= 0; i--) {
                    
                    const p = {
                        position: vec.add(p0.position, vec.scale(i, deltaValues.pos)),
                        velocity: vec.add(p0.velocity, vec.scale(i, deltaValues.vel)),
                        size: vec.add(p0.size, vec.scale(i, deltaValues.size)),
                        ttl: p0.ttl + deltaValues.ttl * i
                    }
                    
                    this.particles.push(p);
                
                }
            } else {
                //Standard spawning
                if(this.particles.length + this.emitAmount > this.maxParticles) {
                    const nRemove = (this.particles.length + this.emitAmount) - this.maxParticles;
                    this.particles.splice(0, nRemove); 
                }
                for(let i = 0; i < this.emitAmount; i++) {
                    const p = {
                        position: this.emitterPosition,
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
        }

        this.emitterLastPosition = this.emitterPosition;

    }

    spawn(n = 1) {
        /*For manually spawning particles */
        //TODO: Cull old particles if hitting max limit

        if(this.parent) {
            this.emitterPosition = mat.getTranslationVector(this.parent.world);
        }
        for(let i = 0; i < n; i++) {
            const p = {
                position: this.emitterPosition,
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

    render(cam) {
        if(this.loaded && this.particles.length >0) {
            gl.useProgram(this.shader);
            
            gl.uniformMatrix4fv(this.projectionUniform, false, mat.transpose(mat.projection(cam.displayWidth, cam.displayHeight, cam.zNear, cam.zFar)));
            gl.uniformMatrix4fv(this.viewUniform, false, mat.transpose(cam.createView()));

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

