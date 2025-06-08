const mat = {
    identity : function() {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    },
    multiply: function(a, b) {
        //Multiplies matrices a and b. (4x4)
        
        if(a.length != 16 || b.length != 16) {
            console.log("Can only multiply (4x4)*(4x4)");
            return;
        }
        
        let result = new Array(16).fill(0);
        
        for(let row = 0; row < 4; row++) {
            for(let col = 0; col < 4; col++) {
                for(let index = 0; index < 4; index++) {
                    result[row * 4 + col] += a[row*4 + index] * b[index*4 + col];
                }
            }
        }

        return result;
        
    },
    multiplyVec : function(m, x) {
        //multiplies vector x by matrix m. Only for (4x4) * (4*1).
        if(m.length != 16 || x.length != 4) {
            console.log("Must multiply only (4x4) * (4x1)");
            return;
        }

        let result = new Array(4).fill(0);

        for(let row = 0; row < 4; row++) {
            for(let index = 0; index < 4; index++) {
                result[row] += m[row * 4 + index] * x[index];
            }
        }
        return result;
    },

    translate : function(tx, ty, tz) {
        return [
            1, 0, 0, tx,
            0, 1, 0, ty,
            0, 0, 1, tz,
            0, 0, 0, 1
        ];
    },

    rotateX: function(rx) {
        return [
            1, 0, 0, 0,
            0, Math.cos(rx), -Math.sin(rx), 0,
            0, Math.sin(rx), Math.cos(rx), 0,
            0, 0, 0, 1
        ];
    },

    rotateY: function(ry) {
        return [
            Math.cos(ry), 0, Math.sin(ry), 0,
            0, 1, 0, 0,
            -Math.sin(ry), 0, Math.cos(ry), 0,
            0, 0, 0, 1
        ];
    },

    rotateZ: function(rz) {
        return [
            Math.cos(rz), -Math.sin(rz), 0, 0,
            Math.sin(rz), Math.cos(rz), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]
    },

    rotate : function(rx, ry, rz) {
        //creates rotation matrix that rotates anticlockwise about x then y, then z.
        //OpenGL uses a right handed coordinate system. Y up, X right, and Z out of the screen.

        return this.multiply(this.multiply(this.rotateZ(rz), this.rotateY(ry)), this.rotateX(rx));
    },

    transpose: function(m) {
        //returns the transpose of the 4x4 matrix m.
        if(m.length != 16) {
            console.log("error: can only transpose a 4x4 matrix");
            return;
        }

        let result = new Array(16);
        for(let row = 0; row < 4; row++) {
            for(let col = 0; col < 4; col++) {
                result[col * 4 + row] = m[row * 4 + col];
            }
        }
        return result;
    },
    
    projection : function() {
        //Creates a projection matrix. 
        //assuming display surface at relative camera coordinates (0, 0, -1).
        //Camera points in the -z direction.
        return [
            1, 0, 0, 0,
            0, 1, 0, 0, 
            0, 0, -1, 0,
            0, 0, -1, 0
        ];
    }
};