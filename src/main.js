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
    gl.enable(gl.CULL_FACE);
    return true;
}

function init() {
    block1 = new SceneNode();
    block1.mesh = new Mesh(gl, ['models/suzzane.obj']);
    block1.translate(0, 0, -400);  
    block1.scaleBy(100.0, 100.0, 100.0);
    sceneGraph.root.addChild(block1);
    
    /*
    block2 = new SceneNode();
    block2.mesh = new Mesh(gl, ['models/cube.obj'], "textures/cubetexture.png");
    block2.translate(100, 0, -300);
    block2.scaleBy(40.0, 40.0, 40.0);
    sceneGraph.root.addChild(block2);
    */

    tire = new SceneNode();
    tire.mesh = new Mesh(gl, ['models/wheel.obj'], "textures/wheel.png");
    tire.translate(0, 0, 2);
    tire.rotate(Math.PI/2, 0, 0);
    tire.scaleBy(1.0, 1.0, 1.0);
    block1.addChild(tire);
    
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
            block1.rotate(0, 0.1, 0);
            tire.rotate(0, 0, -0.2);
            sceneGraph.updateScene();
            delta--;
        }
        lastTime = timestamp;
    }
}

function render(timestamp) {

    update(timestamp);

    gl.clearColor(0.5, 0.5, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    sceneGraph.renderScene();

    requestAnimationFrame(render);
}
