"use strict";

const PREFERRED_UPDATES_PER_SECOND = 30;
let updatesPerSecond = PREFERRED_UPDATES_PER_SECOND
let msPerUpdate = 1000 / updatesPerSecond;

function setUpdatesPerSecond(ups) {
    updatesPerSecond = ups;
    msPerUpdate = 1000 / updatesPerSecond;
}

let debug = false;

const debugOptions = {
    displayUpdatesPerSecond : false,
    displayFramesPerSecond: false,
    displayMeshInfo: false,
    reportCollisionType: false,
    displayNumberOfCollidables: false
}

let gl;
let ext; // Extended functions for webGL (some needed features are not in the base webGL).

if (glSetup()) {
    ext = gl.getExtension("OES_vertex_array_object");
    init();
    requestAnimationFrame(render);
}


function glSetup() {
    const canvas = document.querySelector("#c");
    gl = canvas.getContext("webgl");
    if (!gl) {
        console.log("Could not get Web GL context");
        return false;
    }

    updateViewport();
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    return true;
}

function updateViewport() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Update camera dimensions to match canvas aspect ratio
    if (typeof Camera.main !== 'undefined') {
        const aspectRatio = gl.canvas.width / gl.canvas.height;
        const baseHeight = 25;
        Camera.main.displayHeight = baseHeight;
        Camera.main.displayWidth = baseHeight * aspectRatio;
    }
}

let lastTime;
let delta = 0;

let timer = 0; // Used for true UPS calculations
let countedUpdates = 0;
let countedFrames = 0;

function update() {
    let timestamp = performance.now();
    if (lastTime == undefined) {
        lastTime = timestamp;
    } else {
        const deltaTime = (timestamp - lastTime)
        delta += deltaTime / msPerUpdate;

        //True updates per second calculations
        if(debug && (debugOptions.displayUpdatesPerSecond || debugOptions.displayFramesPerSecond)) {
            timer += deltaTime;
            if(timer >= 1000) {

                if(debugOptions.displayUpdatesPerSecond) {
                    console.log(`UPS: ${Math.floor(countedUpdates / (timer/1000))}`);
                    countedUpdates = 0;
                }

                if(debugOptions.displayFramesPerSecond) {
                    console.log(`FPS: ${Math.floor(countedFrames) / (timer/1000)}`)
                    countedFrames = 0;
                }
                
                timer = 0;
            }

        }
        
        lastTime = timestamp;

        while (delta >= 1) {
            //Process game updates
            //Calculate a timestamp for the frame number between the last update to now.

            let frameTimeStamp = timestamp - ((delta - 1) * msPerUpdate);
            // e.g if delta = 1 that means at the timestamp is this instant. 
            // If delta = 2, the first frame is at (now - 1 * MS_PER_UPDATE).
            // If delta = 1.5, the first frame occured (now - 0.5 * MS_PER_UPDATE) ago.


            input.processTimeframeEvents(frameTimeStamp);

            if(sceneGraph.ready()) {
                sceneGraph.updateScene();
            }

            UILayer.forEach((e) => {
                e.checkMouseHover();
                if(typeof e.update == "function") {
                    e.update();
                }
            });

            input.reset();

            if(typeof networkUpdate == "function" && Client.connected) {
                //Update states over network after updating game state.
                networkUpdate();
            }

            delta--;
            if(debugOptions.displayUpdatesPerSecond) {
                countedUpdates++;
            }
        }
        if(debugOptions.displayFramesPerSecond) {
            countedFrames++;
        }
    }
}

function render() {

    currentGamepad.update();

    update();

    gl.clearColor(0.0, 0.8, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(sceneGraph.ready()) {
        if(toggleHUD) {
            const HUD = document.getElementById('ui-overlay');
            HUD.style.display = "block";
        } else {
            const HUD = document.getElementById('ui-overlay');
            HUD.style.display = "none";
        }
        sceneGraph.renderScene();
        UILayer.forEach((e) => {e.render(Camera.main)});
    }

    requestAnimationFrame(render);
}

window.addEventListener("gamepadconnected", (event) => {
    console.log("Gamepad connected.");
    currentGamepad.index = event.gamepad.index;
});

window.addEventListener("gamepaddisconnected", (event) => {
    console.log("Gamepad disconnected.");
});