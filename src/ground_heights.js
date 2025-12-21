class GroundHeights {

    /* Creates and object that stores height (y) information about an object.
        This information can be used to create hills by setting the cars groundHeight
        value to this value. */
    constructor(pathToHeightMap, parent, relativeScale, origin=undefined) {
        /* Height map is loaded in as an image.
        Parent should contain the mesh that the height map is referring to.
        */

        this.img = new Image();
        this.img.src = pathToHeightMap;
        
        SceneNode.numMeshes++;

        this.afterLoad = new Promise((resolve, reject) => {
            this.img.onload = () => {
                SceneNode.numLoadedMeshes++;
                const canv = document.createElement('canvas');
                canv.width = this.img.width;
                canv.height = this.img.height;

                this.ctx = canv.getContext('2d');
                this.ctx.drawImage(this.img, 0, 0);
                
                
                this.calibrateToParent();
                
                resolve();
            }
            this.img.onerror = () => {
                reject(new Error(`There was a problem loading the height map '${pathToNormalMap}'`))
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
            this.origin = [this.img.width / 2, this.img.height/2];
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

    getHeightAt(x, z) {
        /* Returns the height value of the parent at coordinate (x, z) */
        /* Currently does not deal with parents that have been rotated */

        const world = this.parent.world;
        const scale = mat.getScaleVector(world);
        const translation = mat.getTranslationVector(world);

        const sx = scale[0];
        const sy = scale[1];
        const sz = scale[2];

        let relX = (x - translation[0]) / sx * this.relativeScale + this.origin[0];
        let relZ = (z - translation[2]) / sz * this.relativeScale + this.origin[1];
        //console.log(`${relX} ${relZ}`);
        
        if(relX < 0 || relX >= this.img.width || relZ < 0 || relZ >= this.img.height) {
            
            return 0;
        } else {
            const pixelData = this.ctx.getImageData(relX, relZ, 1, 1).data;
            
            return  sy * (this.minHeight + (this.maxHeight - this.minHeight) * (pixelData[0]/255));
        }
    }
}