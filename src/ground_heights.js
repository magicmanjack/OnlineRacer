class GroundHeights {

    /* Creates and object that stores height (y) information about an object.
        This information can be used to create hills by setting the cars groundHeight
        value to this value. */
    constructor(pathToHeightMapLow, pathToHeightMapHigh, parent, relativeScale, origin=undefined) {
        /* Height map is loaded in as an image.
        Parent should contain the mesh that the height map is referring to.
        */
        
        this.img_low = new Image();
        this.img_low.src = pathToHeightMapLow;
        this.img_high = new Image();
        this.img_high.src = pathToHeightMapHigh;

        
        SceneNode.numMeshes+=2;

        this.lowLoaded = new Promise((resolve, reject) => {
            this.img_low.onload = () => {
                SceneNode.numLoadedMeshes++;
                const canv = document.createElement('canvas');
                canv.width = this.img_low.width;
                canv.height = this.img_low.height;

                this.ctxLow = canv.getContext('2d');
                this.ctxLow.drawImage(this.img_low, 0, 0);
                resolve();
            }


            this.img_low.onerror = () => {
                reject(new Error(`There was a problem loading the height map '${pathToHeightMapLow}'`))
            }
        });

        this.highLoaded = new Promise((resolve, reject) => {
            this.img_high.onload = () => {
                SceneNode.numLoadedMeshes++;
                const canv = document.createElement('canvas');
                canv.width = this.img_high.width;
                canv.height = this.img_high.height;

                this.ctxHigh = canv.getContext('2d');
                this.ctxHigh.drawImage(this.img_high, 0, 0);
                resolve();
            }

            this.img_high.onerror = () => {
                reject(new Error(`There was a problem loading the height map '${pathToHeightMapHigh}'`))
            }
        });

        this.afterLoad = Promise.all([this.lowLoaded, this.highLoaded]).then(() => {

                this.calibrateToParent();
                this.constructHeightMap();
                if(this.img_low.width != this.img_high.width || this.img_low.height != this.img_high.height) {
                    return Promise.reject(new Error(`The provided height map images must have the same dimensions.'`));
                }
        });


        this.relativeScale = relativeScale;
        this.origin = origin;
        this.parent = parent;
    }

    calibrateToParent() {
        /* calibrates the min and max height values of the height map to
        map to the min/max height values of the parents mesh */
        const m = this.parent.mesh;
        if(!this.origin) {
            this.origin = [this.img_low.width / 2, this.img_low.height/2];
        }
        if(m) {
            // Loop through vertices array an obtain triples (x, y, z)
            this.maxHeight = Number.NEGATIVE_INFINITY;
            this.minHeight = Number.POSITIVE_INFINITY;

            for(let i = 0; i < m.vertices.length; i+=3) {
                const p = [m.vertices[i], m.vertices[i+1], m.vertices[i+2]];
                if(p[2] > this.maxHeight) {
                    this.maxHeight = p[2];
                }
                if(p[2] < this.minHeight) {
                    this.minHeight = p[2];
                }

            }
           

        } else {
            console.log("Failed calibrating GroundHeights object. Parent mesh not loaded");
        }
    }

    constructHeightMap() {
        /*
            Combines low and high portions of the height map 
            together into a single height map stored as a 2D array.
         */
        this.heightMap = [];
        for(let ix = 0; ix < this.img_low.width; ix++) {
            this.heightMap.push([]);
            for(let iy = 0; iy < this.img_low.height; iy++) {
                //Combine low and high into one single value
                const pixelLow = this.ctxLow.getImageData(ix, iy, 1, 1).data[0];
                const pixelHigh = this.ctxHigh.getImageData(ix, iy, 1, 1).data[0];

                //Need to left shift high chunk and combine

                const combined = ((pixelHigh << 8) | pixelLow) / /* and normalize*/ (2**16 - 1);

                this.heightMap[ix].push(combined);
            }
        }

        

    }

    getHeightAt(worldX, worldZ) {
        /* Returns the height value of the parent at coordinate (x, z) */
        /* Currently does not deal with parents that have been rotated */

        const world = this.parent.world;
        const scale = mat.getScaleVector(world);
        const translation = mat.getTranslationVector(world);

        const sx = scale[0];
        const sy = scale[1];
        const sz = scale[2];

        let x = (worldX - translation[0]) / sx * this.relativeScale + this.origin[0];
        let y = (worldZ - translation[2]) / sz * this.relativeScale + this.origin[1];
        //console.log(`${x} ${y}`);
        
        if(x < 0 || x >= this.heightMap.length || y < 0 || y >= this.heightMap[0].length) {
            return 0;
        } else {

            //Calculate 4 pixel neighbourhood and bilinearly interpolate value
            const x0 = Math.floor(x);
            const y0 = Math.floor(y);
            const x1 = Math.ceil(x);
            const y1 = Math.ceil(y);

            
            const h = this.heightMap;

            const p00 = h[x0][y0];
            const p10 = h[x1][y0];
            const p01 = h[x0][y1];
            const p11 = h[x1][y1];

            //Interpolation in the x direction
            const ix0 = (x1 - x)/(x1 - x0)*p00 + (x-x0)/(x1-x0)*p10;
            const ix1 = (x1 - x)/(x1 - x0)*p01 + (x-x0)/(x1-x0)*p11;

            const ixy = (y1 - y)/(y1-y0)*ix0 + (y - y0)/(y1-y0)*ix1;

            return  sy * (this.minHeight + (this.maxHeight - this.minHeight) * (ixy));
        }
    }
}