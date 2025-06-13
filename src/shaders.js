function createProgram(gl, vShaderName, fShaderName) {
    //Creates WebGL program from the vertex and fragment shaders.

    //Use XMLHttpRequest to get shader source from server
    const xhttp = new XMLHttpRequest();
    let vShaderSource;
    xhttp.onload = function() {
        vShaderSource = this.responseText;
    }
    xhttp.open("GET", vShaderName, false);
    xhttp.send();

    let fShaderSource;
    xhttp.onload = function() {
        fShaderSource = this.responseText;
    }
    xhttp.open("GET", fShaderName, false);
    xhttp.send();

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if(gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program;
    }
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        //if success
        return shader
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}