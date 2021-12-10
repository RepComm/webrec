
attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;

void main() {
  gl_Position = uModelViewMatrix * aVertexPosition;
}