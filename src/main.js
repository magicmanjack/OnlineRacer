"use strict";

const UPDATES_PER_SECOND = 30;
const MS_PER_UPDATE = 1000 / UPDATES_PER_SECOND;

let gl;

let block1, block2, tire;

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
    block1 = new Mesh(gl, ['models/suzzane.obj']);
    block1.translate(-50, 0, -240);  
    block1.scale(100.0, 100.0, 100.0);
    block2 = new Mesh(gl, ['models/cube.obj'], "textures/cubetexture.png");
    block2.translate(100, 0, -300);
    block2.scale(40.0, 40.0, 40.0);
    tire = new Mesh(gl, ['models/wheel.obj'], "textures/wheel.png");
    tire.translate(0, 0, -50);
    tire.scale(30.0, 30.0, 30.0);
    tire.update = function() {
        this.rotate(0.03, -0.05, 0.0);
    };
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
            block1.update();
            block2.update();
            tire.update();
            delta--;
        }
        lastTime = timestamp;
    }
}

function render(timestamp) {

    update(timestamp);

    gl.clearColor(0.5, 0.5, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    block1.render(gl, camera);
    block2.render(gl, camera);
    tire.render(gl, camera);

    requestAnimationFrame(render);
}
