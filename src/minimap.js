const minimap = {
    mapping: mat.identity,
    create(groundNode, minimapNode) {
        /*Firstly calculate the matrices required to
         transform the minimapNode into the correct position.
         E.g:
         1. rotate X 90 degrees
         2. apply camera transform to bring into cameras coordinate space
         3. get bounding box and scale such that fits in the desired dimensions
         4. translate to zNear
         5. translate to desired position
         */
        
        minimapNode.world = mat.chain([mat.inverse(Camera.main.createView()), mat.rotateX(Math.PI/2)]);

        const boundingBox = Camera.main.getBoundingBox(minimapNode, project=false);

        const desiredWidth = 5;
        const desiredPosition = [0, 0];
        //No need to choose height since we need to maintain aspect ratio
        const scaleFactor = desiredWidth / (boundingBox[1] - boundingBox[3]);

        minimapNode.world = mat.chain([mat.translate(desiredPosition[0], desiredPosition[1], -Camera.main.zNear), mat.scale(scaleFactor, scaleFactor, 0), minimapNode.world]);
        mini

        //We want to scale the miniMapNode so that it fits inside desired size
        //TODO: just calculate scale value to scale height into specific value

        /*Then calculate mapping from world space into the minimap/screen space*/
    }

};