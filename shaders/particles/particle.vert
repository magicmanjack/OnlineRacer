attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_view;
uniform mat4 u_projection;

uniform vec3 u_offset; // Offset relative to origin.
uniform vec2 u_size;

varying vec2 v_texcoord;

void main() {
    //Calculate billboard vertices
    
    //Camera right and up axis in world space
    
    vec3 camera_right = vec3(u_view[0][0], u_view[1][0], u_view[2][0]);
    vec3 camera_up = vec3(u_view[0][1], u_view[1][1], u_view[2][1]);

    vec3 vertex_worldspace = u_offset + camera_right * a_position.x * u_size.x + camera_up * a_position.y * u_size.y; 

    gl_Position = u_projection * u_view * vec4(vertex_worldspace, 1.0);
 
    v_texcoord = a_texcoord;
}