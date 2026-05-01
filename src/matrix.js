const mat = {
    identity: function () {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    },
    inverse:function(m) {
        /* Calculates and returns the inverse of m (if it exists) */
        if(!Number.isInteger(Math.sqrt(m.length))) {
            //Is not square matrix
            console.error("Cannot get inverse of non square matrix");
            return null;
        }
        const det = this.determinant(m);
        if(det == 0) {
            console.error("The inverse of the provided matrix does not exist");
            return null;
        }

        const minors = Array(m.length).fill();
        const n = Math.sqrt(m.length);

        for(let row = 0; row < n; row++) {
            for(let col = 0; col < n; col++) {
                const others = [];
                for(let othersRow = 0; othersRow < n; othersRow++) {
                    for(let othersCol = 0; othersCol < n; othersCol++) {
                        if(othersRow == row || othersCol == col) {
                            continue;
                        }

                        others.push(m[othersRow * n + othersCol]);
                    }
                }
                minors[row * n + col] = this.determinant(others);
                
            }
        }

        //Once we have the minors array we get the cofactors
        const cofactors = Array(m.length).fill();

        for(let r = 0; r < n; r++) {
            for(let c = 0; c < n; c++) {
                const sign = ((r % 2 > 0) ? -1 : 1) * ((c % 2 > 0) ? -1 : 1);
                cofactors[r * n + c] = minors[r * n + c] * sign;
            }
        }

        const adjugate = mat.transpose(cofactors);

        return this.multiplyScalar(adjugate, 1/det);

    },
    determinant: function(m) {
        if(m.length == 1) {
            return m;
        } else if(m.length == 4) {
            //2x2 square matrix simple determinant case
            const det = m[0]*m[3]-m[1]*m[2];
            return det;
        } else if(m.length > 4 && Number.isInteger(Math.sqrt(m.length))) {

            // Need to recursively compute minors
            const n = Math.sqrt(m.length);
            const minors = Array(n).fill();

            for(let c = 0; c < n; c++) {
                //Build matrix filled with other values not in this row or column
                const others = [];
                const skipCol = c;
                for(let r = 1/*first row can be skipped*/; r < n; r++) {

                    for(let c = 0; c < n; c++) {
                        if(c == skipCol) {
                            continue;
                        }
                        others.push(m[r * n + c]);
                    }
                }

                //Compute determinant of others
                const detOfOthers = this.determinant(others);

                minors[c] = detOfOthers;
            }

            //Now we have computed the minors we can compute the determinant
            //Just multiply top row of matrix by minors (but in +-+- checkboard order)
            let det = 0;

            for(let c = 0; c < n; c++) {
                det += (c % 2 > 0 ? -1 : 1) * m[c] * minors[c];    
            }

            return det;

            
        } else {
            console.error("Attempted to calculate determinant of non square matrix");
            return null;
        }
    },
    chain: function(arrayOfMatrices) {
        /* Multiplies the provided matrices in the array together */
        let result = mat.identity();
        for(let i = arrayOfMatrices.length - 1; i >= 0; i--) {
            result = mat.multiply(arrayOfMatrices[i], result);
        }

        return result;
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
        const sqrt = Math.sqrt(m.length);
        if (sqrt != x.length) {
            console.log("Must multiply only a square matrix with a vector such that the rows of the matrix match the columns of the vector.");
            return;
        }

        let result = [];

        for (let row = 0; row < sqrt; row++) {
            result.push(0);
            for (let index = 0; index < sqrt; index++) {
                result[row] += m[row * sqrt + index] * x[index];
            }
        }
        return result;
    },
    multiplyScalar: function(m, s) {
        /* Multiplies each value of the matrix m by scalar s */
        const out = [];
        m.forEach((e) => {
            out.push(e * s);
        });
        return out;
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
        /*
        creates rotation matrix that rotates anticlockwise about x then y, then z (global axis),
        or rotate around z, y, then x (local/intrinsic axis).

         Note: OpenGL uses a right handed coordinate system. Y up, X right, and Z out of the screen.
        */
        return this.multiply(this.multiply(this.rotateZ(rz), this.rotateY(ry)), this.rotateX(rx));
    },

    rotateAround: function (axis, angle) {
        /*
            Returns a rotation matrix which represents a rotation around the specified axis by the provided angle.
            Matrix is derived from https://en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle
        */
        const v = vec.normalize(axis);
        const cs = Math.cos(angle);
        const sn = Math.sin(angle);

        const [x, y, z] = [0, 1, 2];

        const R = [
            v[x]*v[x]*(1 - cs) + cs, v[x]*v[y]*(1 - cs) - v[z]*sn, v[x]*v[z]*(1 - cs) + v[y]*sn, 0,
            v[x]*v[y]*(1 - cs) + v[z]*sn, v[y]*v[y]*(1 - cs) + cs, v[y]*v[z]*(1 - cs) - v[x]*sn, 0, 
            v[x]*v[z]*(1 - cs) - v[y]*sn, v[y]*v[z]*(1 - cs) + v[x]*sn, v[z]*v[z]*(1 - cs) + cs, 0,
            0, 0, 0, 1
        ];

        return R;
    },

    transpose: function (m) {
        //returns the transpose of the matrix m.
        if(!Number.isInteger(Math.sqrt(m.length))) {
            console.log("Can only transpose a square matrix");
            return null;
        }
        const n = Math.sqrt(m.length);
        const result = new Array(m.length).fill();
        for (let row = 0; row < n; row++) {
            for (let col = 0; col < n; col++) {
                result[col * n + row] = m[row * n + col];
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

    to3x3: function (m) {
        /*
            Converts 4x4 matrix to 3x3
        */

        if (m.length != 16) {
            console.log("Must pass a 4x4 matrix to to3x3()");
            return;
        }

        const out = [];

        for (let i = 0; i < m.length; i++) {
            if ((i + 1) % 4 == 0 || i >= 12) {
                continue;
            }
            out.push(m[i]);
        }

        return out;
    },
    getRotationVector: function(m) {
        /*
            Takes a homogenenous coordinates transformation matrix and extracts
            the rotation vector from the rotation part of the matrix.
            Details on the math can be found at https://www.geometrictools.com/Documentation/EulerAngles.pdf
        */
        

        function r(row, col) {
            const inverseScale = 1 / mat.getScaleVector(m)[col];
            return m[row * 4 + col] * inverseScale;
        }

        let thetaZ, thetaY, thetaX;

        if(r(2,0) < 1) {
            if(r(2,0) > -1) {
                thetaY = Math.asin(-r(2,0));
                thetaZ = Math.atan2(r(1,0), r(0,0));
                thetaX = Math.atan2(r(2,1), r(2,2));
            } else {
                // r(2,0) == -1 so no unique solution.
                thetaY = Math.PI/2;
                thetaZ = -Math.atan2(-r(1,2), r(1,1));
                thetaX = 0;
            }
        } else {
            //r(1,0) == 1 so no unique solution
            thetaY = -Math.PI/2;
            thetaZ = Math.atan2(-r(1,2), r(1,1));
            thetaX = 0;
        }

        return [thetaX, thetaY, thetaZ];
    },
    getTranslationVector : function(m) {
        /*
            Gets translation vector out of 4x4 transformation matrix by looking at column 4.
        */
        if(m.length != 16) {
            console.log("cannot get translation vector from a non 4x4 matrix");
            return;
        }
        return [m[3], m[7], m[11]];
    },
    getScaleVector: function(m) {
        /*
            Gets scale vector by looking at the first column vector.
            At the moment this only supports positive scalings.
        */
       const col1vec = [m[0], m[4], m[8]];
       const col2vec = [m[1], m[5], m[9]];
       const col3vec = [m[2], m[6], m[10]];


       const sx = vec.magnitude(col1vec);
       const sy = vec.magnitude(col2vec);
       const sz = vec.magnitude(col3vec);

       return [sx, sy, sz];
    },
    transformVerts: function (m, v) {
        /*
            Transforms a set of vertices by the matrix m
         */
        const out = [];
        for(let i = 0; i < v.length; i+=3) {
            const p = [v[i], v[i+1], v[i+2], 1];
            const t = mat.multiplyVec(m, p);
            for(let j = 0; j < 3; j++) {
                //Push each transformed component of the vector to the out set.
                out.push(t[j]);
            }
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
        Multiplies matrices a and b. (3x3)
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

const vec3 = {
    up: [0, 1, 0],
    down: [0, -1, 0],
    left: [-1, 0, 0],
    right: [1, 0, 0],
    forward: [0, 0, -1],
    backward: [0, 0, 1]
}

const vec4 = {
    perspectiveDivide: function(vec4) {
        return [vec4[0]/vec4[3], vec4[1]/vec4[3], vec4[2]/vec4[3], 1];
    }
}

const vec = {
    /*
        defines vector operations.
    */
    scale: function (a, v) {
        let out = [...v]
        for(let i = 0; i < v.length; i++) {
            out[i] = a * out[i];
        }
        return out;
    },
    add: function (a, b) {
        if (a.length != b.length) {
            console.log("Cannot add two vectors of different lengths.");
            return;
        }
        const out = [];
        for (let i = 0; i < a.length; i++) {
            out.push(a[i] + b[i]);
        }
        return out;
    },
    subtract: function (a, b) {
        if (a.length != b.length) {
            console.log("Cannot subtract two vectors of different lengths.");
            return;
        }
        const out = [];
        for (let i = 0; i < a.length; i++) {
            out.push(a[i] - b[i]);
        }
        return out;
    },
    perp: function (v) {
        if (v.length != 2) {
            console.log("Cannot do perpindular of a non 2D vector");
        }
        return [-v[1], v[0]];
    },
    magnitude: function (v) {
        //Returns the magnitude of v (|v|)
        let squaredSum = 0;
        for (let i = 0; i < v.length; i++) {
            squaredSum += v[i] * v[i];
        }
        return Math.sqrt(squaredSum);
    },
    normalize: function (v) {
        //normalizes vector v (e.g v/|v|)
        let mag = this.magnitude(v);
        let out = [];
        for (let i = 0; i < v.length; i++) {
            out[i] = v[i] / mag;
        }
        return out;
    },
    dot: function (a, b) {
        //the dot product of vectors a and b.
        if (a.length != b.length) {
            console.log("Cannot do a dot product of two vectors with different size.");
            return;
        }
        let out = 0;
        for (let i = 0; i < a.length; i++) {
            out += a[i] * b[i];
        }
        return out;
    },
    cross: function(a, b) {
        //The cross product of vectors a and b
        if (a.length != b.length && a.length != 3) {
            console.log("Can only do the cross product on 3D vectors.");
            return;
        }
        return [
            a[1]*b[2]-a[2]*b[1],
            a[2]*b[0]-a[0]*b[2],
            a[0]*b[1]-a[1]*b[0]
        ]
    },
    rotate: function (v, rx, ry, rz) {
        // Rotates a 3D vector v by rx, ry, rz radians
        if (v.length !== 3) {
            console.log("Can only rotate 3D vectors.");
            return;
        }
        // Create rotation matrix
        const rot = mat3x3.rotate(rx, ry, rz);
        // Multiply rotation matrix by vector
        return mat3x3.multiplyVec(rot, v);
    },
    angle: function(a, b) {
        // Returns the angle between vectors A and B
        if (a.length !== 3 || b.length !== 3) {
            console.log("Can only operate this function on 3D vectors.");
            return;
        }
        // A dot B = |A||B|cos(theta) which means theta = cos-1(A dot B / (|A||B|))
        return Math.acos(vec.dot(a, b) / (vec.magnitude(a)*vec.magnitude(b)));        

    },
};