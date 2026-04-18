/* Functions that deal with the optimisation and storage of non moving collidable objects
in the scene. */

const staticCollidables = {
    partitionWidth: 120,
    spacePartitions:[],
    baseSet:[], // The base set of colliders
    partitions:[],
    offsetX: 0,
    offsetZ: 0,
    push: function(collidable) {
        this.baseSet.push(collidable);
    },
    getReach : function(c) {
        /*
        Calculates the 4 farthest points a collider may be able to reach.
        (z min, x max, z max, x min)
        For simplicity reasons, the collider is simplified to a bounding square
            */
        const tVerts = mat.transformVerts(c.model, c.vertices);
        //The radius is the difference between the collider centre and the farthest point
        const centre = mat.getTranslationVector(c.model);
        
        let maxRadius = 0;

        for(let i = 0; i < tVerts.length; i+=3) {
            
            const vert = tVerts.slice(i, i+3);
            
            //flatten vert to the x-z axis
            
            vert[1] = 0;
            
            //Calculate euclidean distance from centre
            const dist = vec.magnitude(vec.subtract(vert, centre));
            
            if(dist > maxRadius) {
                maxRadius = dist;
            }
        }
        return [
            vec.add(vec.scale(maxRadius, vec3.forward), centre),
            vec.add(vec.scale(maxRadius, vec3.right), centre),
            vec.add(vec.scale(maxRadius, vec3.backward), centre),
            vec.add(vec.scale(maxRadius, vec3.left), centre)
        ]
    },
    buildPartitions: function() {


        //Calculate the bounds of the partitions

        if(this.baseSet.length == 0) {
            return;
        }

        let minX = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let minZ = Number.POSITIVE_INFINITY;
        let maxZ = Number.NEGATIVE_INFINITY;

        this.baseSet.forEach((c) => {
            const r = this.getReach(c);
            r.forEach((p) => {
                if(p[0] < minX) {
                    minX = p[0];
                }
                if(p[0] > maxX) {
                    maxX = p[0];
                }
                if(p[2] < minZ) {
                    minZ = p[2];
                }
                if(p[2] > maxZ) {
                    maxZ = p[2];
                }
                
            });
        });

        const w = Math.ceil((maxX - minX)/this.partitionWidth);
        const h = Math.ceil((maxZ - minZ)/this.partitionWidth);
        this.offsetX = -minX;
        this.offsetZ = -minZ;

        //Create partitions
        
        this.partitions = Array(w).fill().map(() => Array(h).fill().map(()=>[]));

        let counter = 0;
        // Insert each collider into partitions
        this.baseSet.forEach((c) => {
            /* Calculate the spaces that the collider can reach
            Calculate the distance to the corner points and compare to the radius. */
            
            //console.log(`loading collider ${counter} into partition`);
            counter++;
            let r = this.getReach(c);
            r = r.map(e => this.toPartitionSpace(e));
            
            //Complete raster scan over bounding box
            for(let x = r[3][0]; x <= r[1][0]; x++) {
                for(let z = r[0][1]; z <= r[2][1]; z++) {
                    //Insert collidable into partition
                    this.partitions[x][z].push(c);
                }
            }
        });

        
    },
    toPartitionSpace: function(p) {
        /* Converts coordinates in world space into partitionSpace */
        return [Math.floor((p[0] + this.offsetX) / this.partitionWidth), Math.floor((p[2] + this.offsetZ) / this.partitionWidth)];
    },
    getCollidables: function(c) {
        /* returns the collidables in the partition where the collider c is located. */
        if(this.partitions.length == 0) {
            return [];
        }
        const collidables = [];

        
        let r = this.getReach(c);
        r = r.map(e => this.toPartitionSpace(e));
        
        //Complete raster scan over bounding box
        for(let x = r[3][0]; x <= r[1][0]; x++) {
            for(let z = r[0][1]; z <= r[2][1]; z++) {

                if(x >= this.partitions.length ||
                    this.partitions.length > 0 && z >= this.partitions[0].length ||
                    x < 0 ||
                    z < 0) {
                        //if position is outside of partionMap
                        continue;
                } else {
                    const discoveredColliders = this.partitions[x][z];
                    discoveredColliders.forEach((c) => {
                        if(!c.partitionDiscovered) {
                            c.partitionDiscovered = true;
                            collidables.push(c);
                        }

                    });
                }
            }
        }
        
        collidables.forEach((c) => {
            c.partitionDiscovered = false;
        });

        return collidables;

    }   
};