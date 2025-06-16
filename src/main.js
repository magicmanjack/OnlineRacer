"use strict";

const UPDATES_PER_SECOND = 30;
const MS_PER_UPDATE = 1000 / UPDATES_PER_SECOND;

let gl;

let suzzane;

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
    return true;
}

function init() {
    suzzane = new Mesh(gl, ['models/sonic.obj']);
    suzzane.translate(0, 0, -240);  
    suzzane.scale(1.0, 1.0, 1.0);

    requestAnimationFrame(render);
}

let lastTime;
let delta = 0;

function update(timestamp) {
    if(lastTime == undefined) {
        lastTime = timestamp;
    } else {
        delta += (timestamp - lastTime) / MS_PER_UPDATE;
        while(delta >= 1) {
            //Process game updates
            // Tristan was here 
            suzzane.update();

            delta--;
        }
        lastTime = timestamp;
    }
}

function render(timestamp) {

    update(timestamp);

    gl.clearColor(0.5, 0.5, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    suzzane.render(gl, camera);

    requestAnimationFrame(render);
}
