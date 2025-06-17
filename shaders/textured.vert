attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

varying vec2 v_texcoord;

void main() {
      gl_Position = u_projection * u_view * u_model * a_position;
      v_texcoord = a_texcoord;
}