// import { hexToRgb, createProgramFromScripts } from "../public/webgl-utils";

const RED_HEX = "#FF0000";
const RED_RGB = hexToRgb(RED_HEX);
const BLUE_HEX = "#0000FF";
const BLUE_RGB = hexToRgb(BLUE_HEX);
const GREEN_HEX = "#00FF00";
const GREEN_RGB = hexToRgb(GREEN_HEX);
const RECTANGLE = "RECTANGLE";
const TRIANGLE = "TRIANGLE";
const CIRCLE = "CIRCLE";
const STAR = "STAR";
const CUBE = "CUBE";

const origin = { x: 0, y: 0 };
const sizeOne = { width: 1, height: 1, depth: 1 };
let shapes = [
  {
    type: RECTANGLE,
    position: origin,
    dimensions: sizeOne,
    color: BLUE_RGB,
    translation: { x: -15, y: 0, z: -20 },
    scale: { x: 10, y: 10, z: 10 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    type: TRIANGLE,
    position: origin,
    dimensions: sizeOne,
    color: RED_RGB,
    translation: { x: 15, y: 0, z: -20 },
    scale: { x: 10, y: 10, z: 10 },
    rotation: { x: 0, y: 0, z: 180 },
  },
  {
    type: CUBE,
    position: origin,
    dimensions: sizeOne,
    color: GREEN_RGB,
    translation: { x: -15, y: -15, z: -75 },
    scale: { x: 1, y: 1, z: 1 },
    rotation: { x: 0, y: 45, z: 0 },
  },
];

let gl; // reference to canva's WebGL context, main API
let attributeCoords; // sets 2D location of squares
let uniformMatrix;
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
    "#vertex-shader-3d",
    "#fragment-shader-3d"
  );
  gl.useProgram(program);

  // get reference to GLSL attributes and uniforms
  attributeCoords = gl.getAttribLocation(program, "a_coords");
  uniformMatrix = gl.getUniformLocation(program, "u_matrix");
  const uniformResolution = gl.getUniformLocation(program, "u_resolution");
  uniformColor = gl.getUniformLocation(program, "u_color");

  // initialize coordinate attribute to send each vertex to GLSL program
  gl.enableVertexAttribArray(attributeCoords);

  // initialize coordinate buffer to send array of vertices to GPU
  bufferCoords = gl.createBuffer();

  // configure canvas resolution and clear the canvas
  gl.uniform2f(uniformResolution, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  document.getElementById("tx").onchange = (event) =>
    updateTranslation(event, "x");
  document.getElementById("ty").onchange = (event) =>
    updateTranslation(event, "y");
  document.getElementById("tz").onchange = (event) =>
    updateTranslation(event, "z");

  document.getElementById("sx").onchange = (event) => updateScale(event, "x");
  document.getElementById("sy").onchange = (event) => updateScale(event, "y");
  document.getElementById("sz").onchange = (event) => updateScale(event, "z");

  document.getElementById("rx").onchange = (event) =>
    updateRotation(event, "x");
  document.getElementById("ry").onchange = (event) =>
    updateRotation(event, "y");
  document.getElementById("rz").onchange = (event) =>
    updateRotation(event, "z");

  document.getElementById("fv").onchange = (event) => updateFieldOfView(event);

  document.getElementById("color").onchange = (event) => updateColor(event);

  selectShape(0);
};

const doMouseDown = (event) => {
  const boundingRectangle = canvas.getBoundingClientRect();
  const x = Math.round(
    event.clientX - boundingRectangle.left - boundingRectangle.width / 2
  );
  const y = -Math.round(
    event.clientY - boundingRectangle.top - boundingRectangle.height / 2
  );
  const translation = { x, y, z: -150 };
  const rotation = { x: 0, y: 0, z: 180 };
  const shapeType = document.querySelector("input[name='shape']:checked").value;
  const shape = {
    translation,
    rotation,
    type: shapeType,
  };
  addShape(shape, shapeType);
};

const addShape = (newShape, type) => {
  const colorHex = document.getElementById("color").value;
  const colorRgb = hexToRgb(colorHex);
  let tx = 0;
  let ty = 0;
  let tz = 0;
  if (newShape) {
    tx = newShape.x;
    ty = newShape.y;
  }
  let shape = {
    type: type,
    position: origin,
    dimensions: sizeOne,
    color: colorRgb,
    translation: { x: tx, y: ty, z: tz },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 20, y: 20, z: 20 },
  };
  if (newShape) {
    Object.assign(shape, newShape);
  }
  shapes.push(shape);
  render();
};

const deleteShape = (shapeIndex) => {
  shapes.splice(shapeIndex, 1);
  render();
};

let selectedShapeIndex = 1;

const selectShape = (selectedIndex) => {
  selectedShapeIndex = selectedIndex;
  document.getElementById("tx").value = shapes[selectedIndex].translation.x;
  document.getElementById("ty").value = shapes[selectedIndex].translation.y;
  document.getElementById("tz").value = shapes[selectedIndex].translation.z;
  document.getElementById("sx").value = shapes[selectedIndex].scale.x;
  document.getElementById("sy").value = shapes[selectedIndex].scale.y;
  document.getElementById("sz").value = shapes[selectedIndex].scale.z;
  document.getElementById("rx").value = shapes[selectedIndex].rotation.x;
  document.getElementById("ry").value = shapes[selectedIndex].rotation.y;
  document.getElementById("rz").value = shapes[selectedIndex].rotation.z;
  document.getElementById("fv").value = m4.radToDeg(fieldOfViewRadians);
  const hexColor = rgbToHex(shapes[selectedIndex].color);
  document.getElementById("color").value = hexColor;
};

const updateTranslation = (event, axis) => {
  const value = event.target.value;
  shapes[selectedShapeIndex].translation[axis] = value;
  render();
};

const updateScale = (event, axis) => {
  const value = event.target.value;
  shapes[selectedShapeIndex].scale[axis] = value;
  render();
};

const updateFieldOfView = (event) => {
  fieldOfViewRadians = m4.degToRad(event.target.value);
  render();
};

const updateRotation = (event, axis) => {
  const value = event.target.value;
  const angleInDegrees = ((360 - value) * Math.PI) / 180;
  shapes[selectedShapeIndex].rotation[axis] = angleInDegrees;
  render();
};

const updateColor = (event) => {
  const value = event.target.value;
  shapes[selectedShapeIndex].color = hexToRgb(value);
  render();
};

const render = () => {
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords); // prepare buffer to populate vertices

  // configure how to consume buffer and populate
  gl.vertexAttribPointer(
    attributeCoords, // a_coords attribute in GLSL program
    3, // size = 2 components per iteration, i.e., (x, y)
    gl.FLOAT, // type = gl.FLOAT; i.e., the data is 32bit floats
    false, // normalize = false; i.e., don't normalize
    0, // stride = 0; ==> move forward size * sizeof(type) each iteration to get the next position
    0 // offset = 0; i.e., start at beginning of buffer
  );

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 1;
  const zFar = 2000;

  gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);

  const $shapeList = $("#object-list");
  $shapeList.empty();

  shapes.forEach((shape, index) => {
    const $li = $(`
    <li>
      <button onclick="deleteShape(${index})">
        Delete
      </button>
      <label>
      <input
       type="radio"
       id="${shape.type}-${index}"
       name="shape-index"
       ${index === selectedShapeIndex ? "checked" : ""}
       onclick="selectShape(${index})"
       value="${index}"/>
        ${shape.type};
        X: ${shape.translation.x};
        Y: ${shape.translation.y}
      </label>
    </li>
  `);

    $shapeList.append($li);
    gl.uniform4f(
      uniformColor,
      shape.color.red,
      shape.color.green,
      shape.color.blue,
      1
    );

    let M = computeModelViewMatrix(gl.canvas, shape, aspect, zNear, zFar);
    // apply transformation matrix.
    gl.uniformMatrix4fv(uniformMatrix, false, M);

    if (shape.type === RECTANGLE) {
      renderRectangle(shape);
    } else if (shape.type === TRIANGLE) {
      renderTriangle(shape);
    } else if (shape.type === STAR) {
      renderStar(shape);
    } else if (shape.type === CIRCLE) {
      renderCircle(shape);
    } else if (shape.type === CUBE) {
      renderCube(shape);
    }
  });
};

let fieldOfViewRadians = m4.degToRad(60);
const computeModelViewMatrix = (canvas, shape, aspect, zNear, zFar) => {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  let M = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
  M = m4.translate(
    M,
    shape.translation.x,
    shape.translation.y,
    shape.translation.z
  );
  M = m4.xRotate(M, m4.degToRad(shape.rotation.x));
  M = m4.yRotate(M, m4.degToRad(shape.rotation.y));
  M = m4.zRotate(M, m4.degToRad(shape.rotation.z));
  M = m4.scale(M, shape.scale.x, shape.scale.y, shape.scale.z);
  return M;
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
    new Float32Array([
      x1,
      y1,
      0,
      x2,
      y1,
      0,
      x1,
      y2,
      0,
      x1,
      y2,
      0,
      x2,
      y1,
      0,
      x2,
      y2,
      0,
    ]),
    gl.STATIC_DRAW
  );
  gl.drawArrays(gl.TRIANGLES, 0, 6);
};

const renderTriangle = (triangle) => {
  const x1 = triangle.position.x - triangle.dimensions.width / 2;
  const y1 = triangle.position.y + triangle.dimensions.height / 2;
  const x2 = triangle.position.x + triangle.dimensions.width / 2;
  const y2 = triangle.position.y + triangle.dimensions.height / 2;
  const x3 = triangle.position.x;
  const y3 = triangle.position.y - triangle.dimensions.height / 2;

  const float32Array = new Float32Array([x1, y1, 0, x3, y3, 0, x2, y2, 0]);

  gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
};

const renderStar = (star) => {
  // the star will be two overlapping triangles, the first being upright and the second being upside down
  const x1 = star.position.x - star.dimensions.width / 2;
  const y1 = star.position.y + (star.dimensions.height * 1) / 4;
  const x2 = star.position.x + star.dimensions.width / 2;
  const y2 = star.position.y + (star.dimensions.height * 1) / 4;
  const x3 = star.position.x;
  const y3 = star.position.y - (star.dimensions.height * 3) / 4;

  const x4 = star.position.x - star.dimensions.width / 2;
  const y4 = star.position.y - (star.dimensions.height * 1) / 4;
  const x5 = star.position.x + star.dimensions.width / 2;
  const y5 = star.position.y - (star.dimensions.height * 1) / 4;
  const x6 = star.position.x;
  const y6 = star.position.y + (star.dimensions.height * 3) / 4;

  const float32Array = new Float32Array([
    x1,
    y1,
    0,
    x2,
    y2,
    0,
    x3,
    y3,
    0,
    x4,
    y4,
    0,
    x5,
    y5,
    0,
    x6,
    y6,
    0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);

  // draw triangles as you consume 6 vertices
  gl.drawArrays(gl.TRIANGLES, 0, 6);
};

const renderCircle = (circle) => {
  const r = circle.dimensions.width;
  const centerX = circle.position.x;
  const centerY = circle.position.x;
  let triples = [centerX, centerY];
  for (idx = 0; idx <= 200; idx += 1) {
    triples.push(centerX + r * Math.cos((idx * 2 * Math.PI) / 200));
    triples.push(centerY + r * Math.sin((idx * 2 * Math.PI) / 200));
    triples.push(0);
  }
  const float32Array = new Float32Array(pairs);
  gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 202);
};

const renderCube = (cube) => {
  const geometry = [
    0,
    0,
    0,
    0,
    30,
    0,
    30,
    0,
    0,
    0,
    30,
    0,
    30,
    30,
    0,
    30,
    0,
    0,
    0,
    0,
    30,
    30,
    0,
    30,
    0,
    30,
    30,
    0,
    30,
    30,
    30,
    0,
    30,
    30,
    30,
    30,
    0,
    30,
    0,
    0,
    30,
    30,
    30,
    30,
    30,
    0,
    30,
    0,
    30,
    30,
    30,
    30,
    30,
    0,
    0,
    0,
    0,
    30,
    0,
    0,
    30,
    0,
    30,
    0,
    0,
    0,
    30,
    0,
    30,
    0,
    0,
    30,
    0,
    0,
    0,
    0,
    0,
    30,
    0,
    30,
    30,
    0,
    0,
    0,
    0,
    30,
    30,
    0,
    30,
    0,
    30,
    0,
    30,
    30,
    0,
    0,
    30,
    30,
    30,
    30,
    30,
    30,
    30,
    0,
    0,
    30,
    30,
    0,
  ];
  const float32Array = new Float32Array(geometry);
  gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);
  var primitiveType = gl.TRIANGLES;
  gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
};
