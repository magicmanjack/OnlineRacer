function loadModelFile(fileNames) {
    /*
        Note: indices defined for each mesh in a single file get wrapped around to zero.
    */
   
    // fetch the files to import
    return Promise.all (fileNames.map ((file) => fetch (file))).then ((responses) => {
        return Promise.all (responses.map ((res) => res.arrayBuffer ()));
    }).then ((arrayBuffers) => {
        // create new file list object, and add the files
        return assimpjs().then(function(ajs) {
            let fileList = new ajs.FileList ();
            for (let i = 0; i < fileNames.length; i++) {
                fileList.AddFile (fileNames[i], new Uint8Array (arrayBuffers[i]));
            }
            
            // convert file list to assimp json
            let result = ajs.ConvertFileList (fileList, 'assjson');
            
            // check if the conversion succeeded
            if (!result.IsSuccess () || result.FileCount () == 0) {
                resultDiv.innerHTML = result.GetErrorCode ();
                return;
            }

            // get the result file, and convert to string
            let resultFile = result.GetFile (0);
            let jsonContent = new TextDecoder ().decode (resultFile.GetContent ());

            // parse the result json
            return resultJson = JSON.parse (jsonContent);
        });
    });
}

loadTextureAsync = (textureName) => {

    /*
        Texture filtering currently set min and mag to nearest pixel.
    */

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = textureName;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image.'));
    }).then((img) => {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

        //Need to the y-axis in the src data because textures are stored internally flipped vertically.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        const isPowOf2 = (value) => (value & (value - 1)) === 0;

        if (isPowOf2(img.width) && isPowOf2(img.height)) {
            //Can use mipmapping.
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        } else {
            //Cannot use mipmapping and can only use clamp to edge and nearest or linear filtering.

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }

        return texture;
    });

};
