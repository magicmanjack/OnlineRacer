function loadModel(fileNames) {
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