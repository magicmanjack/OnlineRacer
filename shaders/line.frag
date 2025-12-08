precision mediump float;

uniform bool u_toggle;

void main() {
    //Simple colour shader for lines.
    if(u_toggle) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        gl_FragColor = vec4(0, 1.0, 0, 1.0);
    }
}