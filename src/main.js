"use strict";

const UPDATES_PER_SECOND = 30;
const MS_PER_UPDATE = 1000 / UPDATES_PER_SECOND;
let debug = false;

let gl;

if (glSetup()) {
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

function update() {
    let timestamp = performance.now();
    if (lastTime == undefined) {
        lastTime = timestamp;
    } else {
        delta += (timestamp - lastTime) / MS_PER_UPDATE;
        lastTime = timestamp;

        while (delta >= 1) {
            //Process game updates
            //Calculate a timestamp for the frame number between the last update to now.

            let frameTimeStamp = timestamp - ((delta - 1) * MS_PER_UPDATE);
            // e.g if delta = 1 that means at the timestamp is this instant. 
            // If delta = 2, the first frame is at (now - 1 * MS_PER_UPDATE).
            // If delta = 1.5, the first frame occured (now - 0.5 * MS_PER_UPDATE) ago.


            input.processTimeframeEvents(frameTimeStamp);

            sceneGraph.updateScene();

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
        }

    }
}

function render() {

    update();

    currentGamepad.update();

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