const mat = {
    identity: function () {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    },
    scale: function (x, y, z) {
        return [
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        ];
    },
    multiply: function (a, b) {
        /*
        Multiplies matrices a and b. (4x4)
        */
        if (a.length != 16 || b.length != 16) {
            console.log("Can only multiply (4x4)*(4x4)");
            return;
        }

        let result = new Array(16).fill(0);

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                for (let index = 0; index < 4; index++) {
                    result[row * 4 + col] += a[row * 4 + index] * b[index * 4 + col];
                }
            }
        }

        return result;

    },
    multiplyVec: function (m, x) {
        /*
            Multiplies any size square matrix m with a vector x.
        */
        if (Math.sqrt(m.length) != x.length) {
            console.log("Must multiply only a square matrix with a vector such that the rows of the matrix match the columns of the vector.");
            return;
        }

        let result = [];

        for (let row = 0; row < Math.sqrt(m.length); row++) {
            result.push(0);
            for (let index = 0; index < Math.sqrt(m.length); index++) {
                result[row] += m[row * 4 + index] * x[index];
            }
        }
        return result;
    },

    translate: function (tx, ty, tz) {
        return [
            1, 0, 0, tx,
            0, 1, 0, ty,
            0, 0, 1, tz,
            0, 0, 0, 1
        ];
    },

    rotateX: function (rx) {
        return [
            1, 0, 0, 0,
            0, Math.cos(rx), -Math.sin(rx), 0,
            0, Math.sin(rx), Math.cos(rx), 0,
            0, 0, 0, 1
        ];
    },

    rotateY: function (ry) {
        return [
            Math.cos(ry), 0, Math.sin(ry), 0,
            0, 1, 0, 0,
            -Math.sin(ry), 0, Math.cos(ry), 0,
            0, 0, 0, 1
        ];
    },

    rotateZ: function (rz) {
        return [
            Math.cos(rz), -Math.sin(rz), 0, 0,
            Math.sin(rz), Math.cos(rz), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]
    },

    rotate: function (rx, ry, rz) {
        //creates rotation matrix that rotates anticlockwise about x then y, then z.
        //OpenGL uses a right handed coordinate system. Y up, X right, and Z out of the screen.

        return this.multiply(this.multiply(this.rotateZ(rz), this.rotateY(ry)), this.rotateX(rx));
    },

    transpose: function (m) {
        //returns the transpose of the 4x4 matrix m.
        if (m.length != 16) {
            console.log("error: can only transpose a 4x4 matrix");
            return;
        }

        let result = new Array(16);
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                result[col * 4 + row] = m[row * 4 + col];
            }
        }
        return result;
    },

    projection: function (width, height, zNear, zFar) {
        //Creates a projection matrix. 
        //width and height describe the dimensions of the zNear plane.
        //zNear and zFar must be supplied as positive values.
        return [
            2 * zNear / width, 0, 0, 0,
            0, 2 * zNear / height, 0, 0,
            0, 0, -(zFar + zNear) / (zFar - zNear), -2 * zFar * zNear / (zFar - zNear),
            0, 0, -1, 0
        ];
    },

    to3x3: function(m) {
        /*
            Converts 4x4 matrix to 3x3
        */

        if(m.length != 16) {
            console.log("Must pass a 4x4 matrix to to3x3()");
            return;
        }

        const out = [];

        for(let i = 0; i < m.length; i++) {
            if((i + 1) % 4 == 0 || i >= 12) {
                continue;
            }
            out.push(m[i]);
        }

        return out;
    }
};

const mat3x3 = {
    /*
        Similiar to mat class above but for 3x3 matrix operations.
    */
   multiply: function (a, b) {
        /*
        Multiplies matrices a and b. (4x4)
        */
        if (a.length != 9 || b.length != 9) {
            console.log("Can only multiply (3x3)*(3x3)");
            return;
        }

        let result = new Array(9).fill(0);

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                for (let index = 0; index < 3; index++) {
                    result[row * 3 + col] += a[row * 3 + index] * b[index * 3 + col];
                }
            }
        }

        return result;

    },
    multiplyVec: function (m, x) {
        /*
            Multiplies any size square matrix m with a vector x.
        */
        if (Math.sqrt(m.length) != x.length) {
            console.log("Must multiply only a square matrix with a vector such that the rows of the matrix match the columns of the vector.");
            return;
        }

        let result = [];

        for (let row = 0; row < Math.sqrt(m.length); row++) {
            result.push(0);
            for (let index = 0; index < Math.sqrt(m.length); index++) {
                result[row] += m[row * 3 + index] * x[index];
            }
        }
        return result;
    },

    rotateX: function (rx) {
        return [
            1, 0, 0,
            0, Math.cos(rx), -Math.sin(rx),
            0, Math.sin(rx), Math.cos(rx)
        ];
    },
    rotateY: function (ry) {
        return [
            Math.cos(ry), 0, Math.sin(ry),
            0, 1, 0,
            -Math.sin(ry), 0, Math.cos(ry),
        ];
    },
    rotateZ: function (rz) {
        return [
            Math.cos(rz), -Math.sin(rz), 0,
            Math.sin(rz), Math.cos(rz), 0,
            0, 0, 1,
        ]
    },
    rotate: function (rx, ry, rz) {
        //creates rotation matrix that rotates anticlockwise about x then y, then z.
        //OpenGL uses a right handed coordinate system. Y up, X right, and Z out of the screen.

        return this.multiply(this.multiply(this.rotateZ(rz), this.rotateY(ry)), this.rotateX(rx));
    }

};

const vec = {
    /*
        defines vector operations.
    */
    scale: function (a, v) {
        if (v.length != 3) {
            console.log("Improper vector scaling: can only have 3x1");
            return;
        }
        return [a * v[0], a * v[1], a * v[2]];
    },
    add: function (a, b) {
        if(a.length != b.length) {
            console.log("Cannot add two vectors of different lengths.");
            return;
        }
        const out = [];
        for(let i = 0; i < a.length; i++) {
            out.push(a[i] + b[i]);
        }
        return out;
    },
    subtract: function (a, b) {
        if(a.length != b.length) {
            console.log("Cannot subtract two vectors of different lengths.");
            return;
        }
        const out = [];
        for(let i = 0; i < a.length; i++) {
            out.push(a[i] - b[i]);
        }
        return out;
    },
    perp: function(v) {
        if(v.length != 2) {
            console.log("Cannot do perpindular of a non 2D vector");
        }
        return [-v[1], v[0]];
    },
    magnitude: function(v) {
        //Returns the magnitude of v (|v|)
        let squaredSum = 0;
        for(let i = 0; i < v.length; i++) {
            squaredSum += v[i] * v[i];
        }
        return Math.sqrt(squaredSum);
    },
    normalize: function(v) {
        //normalizes vector v (e.g v/|v|)
        let mag = this.magnitude(v);
        let out = [];
        for(let i = 0; i < v.length; i++) {
            out[i] = v[i] / mag; 
        }
        return out;
    },
    dot: function(a, b) {
        //the dot product of vectors a and b.
        if(a.length != b.length) {
            console.log("Cannot do a dot product of two vectors with different size.");
            return;
        }
        let out = 0;
        for(let i = 0; i < a.length; i++) {
            out += a[i] * b[i];
        }
        return out;
    }
};