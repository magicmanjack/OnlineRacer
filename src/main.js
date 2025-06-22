"use strict";

const UPDATES_PER_SECOND = 30;
const MS_PER_UPDATE = 1000 / UPDATES_PER_SECOND;

let gl;

if(glSetup()) {
    init();
    requestAnimationFrame(render);
}


function glSetup() {
    const canvas = document.querySelector("#c");
    gl = canvas.getContext("webgl");
    if(!gl) {
        console.log("Could not get Web GL context");
        return false;
    }
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    return true;
}

let lastTime;
let delta = 0;

function update() {
    let timestamp = performance.now();
    if(lastTime == undefined) {
        lastTime = timestamp;
    } else {
        delta += (timestamp - lastTime) / MS_PER_UPDATE;
        lastTime = timestamp;

        while(delta >= 1) {
            //Process game updates
            //Calculate a timestamp for the frame number between the last update to now.
            
            let frameTimeStamp = timestamp - ((delta - 1) * MS_PER_UPDATE);
            // e.g if delta = 1 that means at the timestamp is this instant. 
            // If delta = 2, the first frame is at (now - 1 * MS_PER_UPDATE).
            // If delta = 1.5, the first frame occured (now - 0.5 * MS_PER_UPDATE) ago.
            

            input.processTimeframeEvents(frameTimeStamp);

            sceneGraph.updateScene();

            input.reset();
            
            delta--;
        }
        
    }
}

function render() {

    update();

    gl.clearColor(0.5, 0.5, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    sceneGraph.renderScene();

    requestAnimationFrame(render);
}
