attribute vec4 a_position;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

varying vec3 colorCoords;

void main() {
      gl_Position = u_projection * u_view * u_model * a_position;
      colorCoords = a_position.xyz;
}