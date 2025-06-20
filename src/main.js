"use strict";

const UPDATES_PER_SECOND = 30;
const MS_PER_UPDATE = 1000 / UPDATES_PER_SECOND;

let gl;

let tires;
let block;

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

    tires = new Array(300);
    block = new SceneNode();
    block.mesh = new Mesh(gl, ["models/cube.obj"], "textures/cubetexture.png");
    block.scaleBy(5, 5, 5);
    
    sceneGraph.root.addChild(block);

    function rand() {
        let num = Math.floor(Math.random() * 100);
        return num - 50;
    }
    
    for(let i = 0; i < tires.length; i++) {
        tires[i] = new SceneNode();
        tires[i].mesh = new Mesh(gl, ["models/wheel.obj"], "textures/wheel.png");
        sceneGraph.root.addChild(tires[i]);
        tires[i].translate(rand(), rand(), rand() - 50);
        tires[i].rotate(rand(), rand(), rand());
        tires[i].scaleBy(5, 5, 5);
    }

    /*
    tires.forEach((tire) => {
        tire.mesh = new Mesh(gl, ["models/wheel.obj"], "textures/wheel.png");
        sceneGraph.root.addChild(tire);
        tire.translate(0, 0, 0);
        
        //tire.rotate(rand(), rand(), rand());
        
    });
    */

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
            // If delta = 1.5, the first frame occured (now - 0.5 * MS_PER_UPDATE) ago.
            

            input.processTimeframeEvents(frameTimeStamp);
            //Update objects here
            tires.forEach((tire) => {
                tire.rotate(0.1, 0.5, 0.2);
            });

            if(input.up) {
                block.translate(0, 0, -1.0);
            }
            if(input.down) {
                block.translate(0, 0, 1.0);
            }
            if(input.left) {
                block.translate(-1.0, 0, 0);
            }
            if(input.right) {
                block.translate(1.0, 0, 0);
            }

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
