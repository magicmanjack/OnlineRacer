class GroundNormals {
    constructor(pathToNormalMap, parent, relativeScale, origin=undefined) {
        /* parent is the ground mesh that the normals are for.*/
        sceneGraph.numMeshes++;
        this.img = new Image();
        this.img.src = pathToNormalMap;
        this.img.onload = () => {
            
            sceneGraph.numLoadedMeshes++;
            const canv = document.createElement('canvas');
            canv.width = this.img.width;
            canv.height = this.img.height;
            this.ctx = canv.getContext('2d');
            this.ctx.drawImage(this.img, 0, 0);
            if(!origin) {
                this.origin = [this.img.width/2, this.img.height/2];
            }
        }
        this.img.onerror = () => {
            console.log(`There was a problem loading the normal map ${pathToNormalMap}`);
        }
        this.parent = parent;
        this.relativeScale = relativeScale; // The scale of 1 unit in the normal map relative to 1 unit of the ground model.
    }

    getNormalAt(x, z) {
        /* return the normal of the ground at position (x,z)*/
        const sx = this.parent.scale[0];
        const sz = this.parent.scale[2];
        let relX = (x - this.parent.translation[0]) / sx * this.relativeScale + this.origin[0];
        let relZ = (z - this.parent.translation[2]) / sz * this.relativeScale + this.origin[1];
        
        if(relX < 0 || relX >= this.img.width || relZ < 0 || relZ >= this.img.height) {
            return [0, 1, 0];
        } else {
            const pixelData = this.ctx.getImageData(relX, relZ, 1, 1).data;
            return [pixelData[0]/255 * 2 - 1, pixelData[2]/255 * 2 - 1,-1* (pixelData[1]/255 * 2 - 1)];
        }

    }

    
}