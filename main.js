"use strict";

let gl;
let p;
let camera = new Camera([0, 0, 1], [0, Math.PI, 0]);

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
    return true;
}

function init() {
    p = new Plane(gl);
    //p.rotate(Math.PI/4, 0, Math.PI/4);
    p.rotate(Math.PI/4, Math.PI/4, 0);

    p.translate(0, 0, 0);
    
    render();
}

function render() {
    gl.clearColor(0.5, 0.5, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    p.render(gl, camera);
}
