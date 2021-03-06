const hexToRgb = (hex) => {
  let parseRgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  let rgb = {
    red: parseInt(parseRgb[1], 16),
    green: parseInt(parseRgb[2], 16),
    blue: parseInt(parseRgb[3], 16),
  };
  rgb.red /= 256;
  rgb.green /= 256;
  rgb.blue /= 256;
  return rgb;
};

const RED_HEX = "#FF0000";
const RED_RGB = hexToRgb(RED_HEX);
const BLUE_HEX = "#0000FF";
const BLUE_RGB = hexToRgb(BLUE_HEX);
const RECTANGLE = "RECTANGLE";
const TRIANGLE = "TRIANGLE";

const createProgramFromScripts = (
  gl,
  vertexShaderElementId,
  fragmentShaderElementId
) => {
  // Get the strings for our GLSL shaders
  const vertexShaderSource = document.querySelector(vertexShaderElementId).text;
  const fragmentShaderSource = document.querySelector(fragmentShaderElementId)
    .text;

  // Create GLSL shaders, upload the GLSL source, compile the shaders
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  // Link the two shaders into a program
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  return program;
};

let shapes = [
  {
    type: RECTANGLE,
    position: {
      x: 200,
      y: 100,
    },
    dimensions: {
      width: 50,
      height: 50,
    },
    color: {
      red: BLUE_RGB.red,
      green: BLUE_RGB.green,
      blue: BLUE_RGB.blue,
    },
  },
  {
    type: TRIANGLE,
    position: {
      x: 300,
      y: 100,
    },
    dimensions: {
      width: 50,
      height: 50,
    },
    color: {
      red: RED_RGB.red,
      green: RED_RGB.blue,
      blue: RED_RGB.green,
    },
  },
];

let gl; // reference to canva's WebGL context, main API
let attributeCoords; // sets 2D location of squares
let uniformColor; // sets the color of the squares
let bufferCoords; // sends geometry to GPU

const init = () => {
  // get a reference to the canvas and WebGL context
  const canvas = document.querySelector("#canvas");
  canvas.addEventListener("mousedown", doMouseDown, false);
  gl = canvas.getContext("webgl");

  // create and use a GLSL program
  const program = createProgramFromScripts(
    gl,
    "#vertex-shader-2d",
    "#fragment-shader-2d"
  );
  gl.useProgram(program);

  // get reference to GLSL attributes and uniforms
  attributeCoords = gl.getAttribLocation(program, "a_coords");
  const uniformResolution = gl.getUniformLocation(program, "u_resolution");
  uniformColor = gl.getUniformLocation(program, "u_color");

  // initialize coordinate attribute to send each vertex to GLSL program
  gl.enableVertexAttribArray(attributeCoords);

  // initialize coordinate buffer to send array of vertices to GPU
  bufferCoords = gl.createBuffer();

  // configure canvas resolution and clear the canvas
  gl.uniform2f(uniformResolution, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
};

const doMouseDown = (event) => {
  const boundingRectangle = canvas.getBoundingClientRect();
  const x = event.clientX - boundingRectangle.left;
  const y = event.clientY - boundingRectangle.top;
  const center = { position: { x, y } };
  const shape = document.querySelector("input[name='shape']:checked").value;

  addShape(center, shape);
};

const addShape = (center, shapeType) => {
  let x = parseInt(document.getElementById("x").value);
  let y = parseInt(document.getElementById("y").value);
  const width = parseInt(document.getElementById("width").value);
  const height = parseInt(document.getElementById("height").value);
  const colorHex = document.getElementById("color").value;
  const colorRgb = hexToRgb(colorHex);
  if (center) {
    x = center.position.x;
    y = center.position.y;
  }
  const shape = {
    type: shapeType,
    position: {
      x: x,
      y: y,
    },
    dimensions: {
      width,
      height,
    },
    color: colorRgb,
  };
  shapes.push(shape);
  render();
};

const render = () => {
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords); // prepare buffer to populate vertices

  // configure how to consume buffer and populate
  gl.vertexAttribPointer(
    attributeCoords, // a_coords attribute in GLSL program
    2, // size = 2 components per iteration, i.e., (x, y)
    gl.FLOAT, // type = gl.FLOAT; i.e., the data is 32bit floats
    false, // normalize = false; i.e., don't normalize
    0, // stride = 0; ==> move forward size * sizeof(type) each iteration to get the next position
    0 // offset = 0; i.e., start at beginning of buffer
  );

  // set the color of each shape
  shapes.forEach((shape) => {
    gl.uniform4f(
      uniformColor,
      shape.color.red,
      shape.color.green,
      shape.color.blue,
      1
    );

    if (shape.type === RECTANGLE) {
      renderRectangle(shape);
    } else if (shape.type === TRIANGLE) {
      renderTriangle(shape);
    }
  });
};

const renderRectangle = (rectangle) => {
  // (x1, y1) is top left corner
  // (x2, y2) is bottom right corner
  // based on the rectangle's center position (x, y) and dimensions width and height
  const x1 = rectangle.position.x - rectangle.dimensions.width / 2;
  const y1 = rectangle.position.y - rectangle.dimensions.height / 2;
  const x2 = rectangle.position.x + rectangle.dimensions.width / 2;
  const y2 = rectangle.position.y + rectangle.dimensions.height / 2;

  // populate the buffer with 6 vertices defining 2 triangles that make up the rectangle
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );

  // draw triangles as you consume 6 vertices
  gl.drawArrays(gl.TRIANGLES, 0, 6);
};

const renderTriangle = (triangle) => {
  const x1 = triangle.position.x - triangle.dimensions.width / 2;
  const y1 = triangle.position.y + triangle.dimensions.height / 2;
  const x2 = triangle.position.x + triangle.dimensions.width / 2;
  const y2 = triangle.position.y + triangle.dimensions.height / 2;
  const x3 = triangle.position.x;
  const y3 = triangle.position.y - triangle.dimensions.height / 2;

  const float32Array = new Float32Array([x1, y1, x2, y2, x3, y3]);

  gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
};
