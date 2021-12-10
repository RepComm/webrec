
import { mat4, vec3 } from "gl-matrix";
import { Canvas } from "./canvas";

async function fetchTextFile(url: string): Promise<string> {
  return new Promise(async (_resolve, _reject) => {
    let resp: Response;

    try {
      resp = await fetch(url);
    } catch (ex) {
      _reject(ex);
      return;
    }
    let text: string;
    try {
      text = await resp.text();
    } catch (ex) {
      _reject(ex);
      return;
    }
    _resolve(text);
    return;
  });
}

interface FetchShaderOptions {
  /**Source string of the shader, if detected 'url' is ignored*/
  src?: string;
  /**Source location of shader code, used when 'src' is not provided*/
  url?: string;
  /**WebGL context to compile with*/
  gl: WebGLRenderingContext;
  /**The type of shader, either vertex or fragment. See gl.VERTEX_SHADER and gl.FRAGMENT_SHADER*/
  type: number;
}

async function fetchShader(options: FetchShaderOptions): Promise<WebGLShader> {
  return new Promise(async (_resolve, _reject) => {
    if (options.src) {

    } else {
      if (options.url) {
        options.src = await fetchTextFile(options.url);
      } else {
        _reject(`no src shader program provided, no url alternative provided. what is the shader code?`);
        return;
      }
    }

    let gl = options.gl;
    if (!gl) {
      _reject(`no webgl context provided, how can i compile the shader code?`);
      return;
    }
    let shader = gl.createShader(options.type);
    gl.shaderSource(shader, options.src);
    gl.compileShader(shader);

    let p = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (!p) {
      _reject(`An error occurred compiling the shaders:\n${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return;
    }

    _resolve(shader);
    return;
  });
}

export interface UniformLocationsMap {
  [key: string]: WebGLUniformLocation;
}

export interface AttributeLocationsMap {
  [key: string]: number;
}

export interface Material {
  program: WebGLProgram;
  attribLocations: AttributeLocationsMap;
  uniformLocations: UniformLocationsMap;
}

export interface FetchProgramOptions {
  gl: WebGLRenderingContext;
  vertex: {
    src?: string;
    url?: string;
  };
  fragment: {
    src?: string;
    url?: string;
  },
  uniformsNames: string[];
  attribNames: string[];
}

async function fetchProgram(options: FetchProgramOptions): Promise<Material> {
  return new Promise(async (_resolve, _reject) => {
    let gl = options.gl;
    let vs = await fetchShader({
      gl,
      type: gl.VERTEX_SHADER,
      src: options.vertex.src,
      url: options.vertex.url
    });

    let fs = await fetchShader({
      gl,
      type: gl.FRAGMENT_SHADER,
      src: options.fragment.src,
      url: options.fragment.url
    });

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      _reject(`Unable to initialize the shader program:\n${gl.getProgramInfoLog(program)}`);
      return null;
    }

    let attribLocations: AttributeLocationsMap = {};
    for (let key of options.attribNames) {
      attribLocations[key] = gl.getAttribLocation(program, key);
    }

    let uniformLocations: UniformLocationsMap = {};
    for (let key of options.uniformsNames) {
      uniformLocations[key] = gl.getUniformLocation(program, key);
    }

    const programInfo: Material = {
      program: program,
      attribLocations,
      uniformLocations,
    };

    _resolve(programInfo);
    return;
  });
}

export interface MaterialNamedMap {
  [key: string]: Material;
}

export interface VideoSourceCreateOptions {
  compositor: Compositor;
  stream: MediaStream;
}

export class VideoSource {
  compositor: Compositor;
  modelViewMatrix: mat4;
  rotation: mat4;
  position: vec3;
  scale: vec3;
  stream: MediaStream;

  constructor(options: VideoSourceCreateOptions) {
    this.compositor = options.compositor;
    this.modelViewMatrix = mat4.create();
    this.rotation = mat4.create();
    this.position = vec3.create();
    this.scale = vec3.create();
    this.stream = options.stream;

    // this.setRect(0.1, 0.1, 0.9, 0.9);
    this.setPosition(0,0,0);
    this.setScale(1,1,1);

  }
  updateMatrix () {
    mat4.fromRotationTranslationScale(
      this.modelViewMatrix,
      this.rotation,
      this.position,
      this.scale
    );
  }
  setPosition (x: number, y: number, z: number) {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
  }
  setScale (x: number, y: number, z: number) {
    this.scale[0] = x;
    this.scale[1] = y;
    this.scale[2] = z;
  }
  setRect (minx: number, miny: number, maxx: number, maxy: number) {
    this.setPosition(minx, miny, 1);
    this.setScale(maxx - minx, maxy - miny, 1);
  }
}

export class Compositor extends Canvas {
  private sources: Array<VideoSource>;

  gl: WebGLRenderingContext;

  materials: MaterialNamedMap;
  currentMaterial: Material;

  output: MediaStream;

  rectMeshPositionBuffer: WebGLBuffer;

  renderCallback: FrameRequestCallback;

  constructor() {
    super();

    this.sources = new Array();

    this.renderCallback = (time)=>{
      this.render();

      window.requestAnimationFrame(this.renderCallback);
    };

    this.initWebGL().then(()=>{
      this.start();
    });

  }
  start () {
    window.requestAnimationFrame(this.renderCallback);
  }
  initRectMesh() {
    let gl = this.gl;

    //this mesh is reused for all the displays since they are all rectangular
    //we can control the bounds by simply sending different model view matrix
    //with scale and translation to fit the source as its positioned by the user

    //create a GPU buffer
    this.rectMeshPositionBuffer = gl.createBuffer();

    //set the current buffer to the newly created one
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rectMeshPositionBuffer);

    //javascript description of mesh points
    const positions = [
      0.0,  1.0,  // 3----4
      1.0,  1.0,  // | \  |
      0.0,  0.0,  // |  \ |
      1.0,  0.0,  // 1----2
    ];

    //push js points into the current buffer on the GPU
    gl.bufferData(
      gl.ARRAY_BUFFER, //type of data
      new Float32Array(positions), //the actual data
      gl.STATIC_DRAW //what its used for
    );

  }
  initWebGL(): Promise<void> {
    return new Promise(async (_resolve, _reject) => {

      this.gl = this.element.getContext("webgl");
      let gl = this.gl;

      if (gl === null) {
        _reject(`WebGLRenderingContext not supported?! Reeeeeee!`);
        return;
      }

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      // Clear the color buffer with specified clear color
      gl.clear(gl.COLOR_BUFFER_BIT);

      this.materials = {};

      this.materials["main"] = await fetchProgram({
        gl,
        vertex: {
          url: "./glsl/main.vertex.glsl"
        },
        fragment: {
          url: "./glsl/main.fragment.glsl"
        },
        attribNames: ["aVertexPosition"],
        uniformsNames: ["uModelViewMatrix"]
      });
      console.log(this.materials["main"]);

      this.initRectMesh();

      this.output = this.element.captureStream();

      _resolve();
      return;
    });
  }
  setCurrentMaterial(m: Material) {
    this.currentMaterial = m;
  }
  assertUniforms (...names: string[]) {
    let current: WebGLUniformLocation;
    for (let name of names) {
      current = this.currentMaterial.uniformLocations[name];
      if (current === null || current === undefined) {
        throw `uniform ${name} required from current material ${this.currentMaterial} but was not found!`;
      }
    }
  }
  assertAttributes (...names: string[]) {
    let current: number;
    for (let name of names) {
      current = this.currentMaterial.attribLocations[name];
      if (current === null || current === undefined) {
        throw `attribute ${name} required from current material ${this.currentMaterial} but was not found!`;
      }
    }
  }
  renderVideoSource(src: VideoSource) {
    let gl = this.gl;
    if (!this.currentMaterial) {
      throw `no current material when trying to render video source`;
    }
    this.assertUniforms("uModelViewMatrix");
    this.assertAttributes("aVertexPosition");

    // console.log("rendering src", src);

    src.updateMatrix();

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    const numComponents = 2;  // pull out 2 values per iteration
    const type = gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0;         // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rectMeshPositionBuffer);

    gl.vertexAttribPointer(
      this.currentMaterial.attribLocations["aVertexPosition"],
      numComponents,
      type,
      normalize,
      stride,
      offset
    );

    gl.enableVertexAttribArray(
      this.currentMaterial.attribLocations["aVertexPosition"]
    );

    gl.useProgram(this.currentMaterial.program);

    gl.uniformMatrix4fv(
      this.currentMaterial.uniformLocations["uModelViewMatrix"],
      false,
      src.modelViewMatrix
    );

    const first = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, first, vertexCount);
  }
  render() {
    let gl = this.gl;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.setCurrentMaterial(this.materials["main"]);

    for (let src of this.sources) {
      this.renderVideoSource(src);
    }
  }
  createSource (stream: MediaStream): VideoSource {
    let src = new VideoSource({
      compositor: this,
      stream
    });
    this.sources.push(src);
    return src;
  }
}