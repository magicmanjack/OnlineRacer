const minimap = {
    mapping: mat.identity,
    create: function(groundNode, minimapNode) {

        /*Firstly calculate the matrices required to
         transform the minimapNode into the correct position.
         */
        
        if(!groundNode || !minimapNode) {
            console.error("you must provided the ground node and minimap mesh node to create a minimap.");
            return;
        }

        const mmWorld = [...minimapNode.world];
        minimapNode.world = mat.chain([mat.inverse(Camera.main.createView()), mat.rotateX(Math.PI/2), minimapNode.world]);

        const boundingBox = Camera.main.getBoundingBox(minimapNode, project=false);
        
        const desiredWidth = 5;
        const desiredPosition = [10, -5];
        //No need to choose height since we need to maintain aspect ratio
        const scaleFactor = desiredWidth / (boundingBox[1] - boundingBox[3]);

        minimapNode.world = mat.chain([
            mat.translate(desiredPosition[0], desiredPosition[1], -Camera.main.zNear - 5.1),
            mat.scale(scaleFactor, scaleFactor, 1),
            Camera.main.createView(),
            minimapNode.world]);

        //Apply transformation
        minimapNode.translation = mat.getTranslationVector(minimapNode.world);
        minimapNode.rotation = mat.getRotationVector(minimapNode.world);
        minimapNode.scale = mat.getScaleVector(minimapNode.world);

        minimapNode.isUI = true; // Now stays with camera

        
        /*Then calculate mapping from world space into the minimap/screen space
        We only have to add the inverse of the groundNode world matrix */

        this.mapping = mat.chain([minimapNode.world, mat.inverse(mmWorld), mat.inverse(groundNode.world)]);

        //Need to create player icon

        //UI panel coordinates are pretty much the same as the minimap x & y
        const center = mat.multiplyVec(minimapNode.world, [0, 0, 0, 1]);

        this.playerIcon = new UIPanel(center[0], center[1], 0.5, 0.5, ["textures/default.png"]);
        UILayer.push(this.playerIcon);
    },

    updatePosition: function(playerNode) {
        /* Takes the player node and updates the position of the player icon on the minimap */
        const transformed = mat.multiplyVec(this.mapping, [...playerNode.translation, 1]);
        this.playerIcon.x = transformed[0];
        this.playerIcon.y = transformed[1];
        this.playerIcon.recalculateVertices();
    } 

};