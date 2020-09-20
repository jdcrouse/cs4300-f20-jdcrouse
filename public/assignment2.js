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

const RECTANGLE = "RECTANGLE";
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
      red: Math.random(),
      green: Math.random(),
      blue: Math.random(),
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

const addRectangle = () => {
  let x = parseInt(document.getElementById("x").value);
  let y = parseInt(document.getElementById("y").value);
  const width = parseInt(document.getElementById("width").value);
  const height = parseInt(document.getElementById("height").value);

  const rectangle = {
    type: RECTANGLE,
    position: {
      x: x,
      y: y,
    },
    dimensions: {
      width,
      height,
    },
    color: {
      red: Math.random(),
      green: Math.random(),
      blue: Math.random(),
    },
  };

  shapes.push(rectangle);
  render();
};
