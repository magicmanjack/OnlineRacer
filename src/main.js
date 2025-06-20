"use strict";

const UPDATES_PER_SECOND = 30;
const MS_PER_UPDATE = 1000 / UPDATES_PER_SECOND;

let gl;

let camera = new Camera([0, 0, 60.0], [0, 0, 0]); 

if(glSetup()) {
    init();
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

function init() {
    requestAnimationFrame(render);
}

let lastTime;
let delta = 0;

function update(timestamp) {
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
            

            input.processTimeframeEvents(frameTimeStamp);

            //Update objects here

            sceneGraph.updateScene();

            input.reset();
            
            delta--;
        }
        input.reset();
        
    }
}

function render() {

    update(performance.now());

    gl.clearColor(0.5, 0.5, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    sceneGraph.renderScene();

    requestAnimationFrame(render);
}
