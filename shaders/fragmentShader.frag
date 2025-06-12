precision mediump float;

varying vec3 colorCoords;

void main() {
   gl_FragColor = vec4(colorCoords.x + 0.5, colorCoords.y + 0.5, colorCoords.z + 0.5, 1.0);

    //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}