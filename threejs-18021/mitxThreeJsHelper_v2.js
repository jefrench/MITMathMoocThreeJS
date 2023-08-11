// Your file should have a single <canvas></canvas> element in it
// (because of createRenderer())

function createScene() {
    window.scene = new THREE.Scene();
    return window.scene
}

function createRenderer() {
    window.renderer = new THREE.WebGLRenderer( { antialias: true, preserveDrawingBuffer: true, canvas: document.querySelector('canvas') } );
    window.renderer.setPixelRatio( window.devicePixelRatio );
    window.renderer.setSize( window.innerWidth, window.innerHeight );
    window.renderer.setClearColor( 0xffffff, 1 );
    document.body.appendChild( window.renderer.domElement );
    return window.renderer
}

function setBoundingBox(p0,p1) {
    /*
      DESCRIPTION
      Sets some variables so that when the window is resized, we can adjust the viewport to keep this bounding box in view.

      INPUT
      What part of 3D space needs to be visible? Defined as a box given by two corner points. Arguments are two json points.

      EXAMPLES
      setBoundingBox({"x":-2.0, "y":-2.0, "z":-2.0}, {"x":2.0, "y":2.0, "z":2.0})
    */
    window.b = [p0,p1];
    if ( b[0].x === b[1].x ) {
        b[0].x -= 1;
        b[1].x += 1;
    }
    if ( b[0].y === b[1].y ) {
        b[0].y -= 1;
        b[1].y += 1;
    }
    if ( b[0].z === b[1].z ) {
        b[0].z -= 1;
        b[1].z += 1;
    }

    window.xRange = b[1].x - b[0].x;
    window.yRange = b[1].y - b[0].y;
    window.zRange = b[1].z - b[0].z;

    // there used to be some code about aspect ratio here

    // Distance from (xMid,yMid,zMid) to any corner of the bounding box, after applying aspectRatio
    window.midToCorner = Math.sqrt( xRange*xRange + yRange*yRange + zRange*zRange ) / 2;
    window.xMid = ( b[0].x + b[1].x ) / 2;
    window.yMid = ( b[0].y + b[1].y ) / 2;
    window.zMid = ( b[0].z + b[1].z ) / 2;
};

function addLabel( text, x, y, z, color='black', font='monospace', size=1 ) {
    var canvas = document.createElement( 'canvas' ); 
    canvas.width = 256;
    canvas.height = 256;
    var context = canvas.getContext( '2d' );
    c = new THREE.Color(color);
    color = c.getStyle();

    context.font = 'italic 64px Georgia';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText( text, canvas.width/2, canvas.height/2);

    var texture = new THREE.Texture( canvas );
    texture.needsUpdate = true;

    var sprite = new THREE.Sprite( new THREE.SpriteMaterial( { map: texture, color: 0xffffff } ) );
    sprite.position.set( x, y, z );

    sprite.scale.set(size,size,size); 

    scene.add( sprite );

}

function createCamera(projection="perspective") {

    var aspect = window.innerWidth / window.innerHeight;

    if ( projection === 'orthographic' ) {
        var camera = new THREE.OrthographicCamera( -1, 1, 1, -1, -1000, 1000 );
        updateCameraAspect( camera, aspect );
        return camera;
    }

    return new THREE.PerspectiveCamera( 45, aspect, 0.1, 1000 );

}

function updateCameraAspect( camera, aspect ) {

    if ( camera.isPerspectiveCamera ) {
        camera.aspect = aspect;
    } else if ( camera.isOrthographicCamera ) {
        // Fit the camera frustum to the bounding box's diagonal so that the entire plot fits
        // within at the default zoom level and camera position.
        if ( aspect > 1 ) { // Wide window
            camera.top = midToCorner;
            camera.right = midToCorner * aspect;
        } else { // Tall or square window
            camera.top = midToCorner / aspect;
            camera.right = midToCorner;
        }
        camera.bottom = -camera.top;
        camera.left = -camera.right;
    }

    camera.updateProjectionMatrix();

}

function addPoint( json ) {

    var geometry = new THREE.BufferGeometry();
    var v = json.point;
    geometry.vertices.push( new THREE.Vector3( a[0]*v[0], a[1]*v[1], a[2]*v[2] ) );

    var canvas = document.createElement( 'canvas' );
    canvas.width = 128;
    canvas.height = 128;

    var context = canvas.getContext( '2d' );
    context.arc( 64, 64, 64, 0, 2 * Math.PI );
    context.fillStyle = json.color;
    context.fill();

    var texture = new THREE.Texture( canvas );
    texture.needsUpdate = true;

    var transparent = json.opacity < 1 ? true : false;
    var size = camera.isOrthographicCamera ? json.size : json.size/100;
    var material = new THREE.PointsMaterial( { size: size, map: texture,
                                               transparent: transparent, opacity: json.opacity,
                                               alphaTest: .1 } );

    var c = new THREE.Vector3();
    geometry.computeBoundingBox();
    geometry.boundingBox.getCenter( c );
    geometry.translate( -c.x, -c.y, -c.z );

    var mesh = new THREE.Points( geometry, material );
    mesh.position.set( c.x, c.y, c.z );
    scene.add( mesh );

}

function addLine( json ) {

    var geometry = new THREE.Geometry();
    for ( var i=0 ; i < json.points.length ; i++ ) {
        var v = json.points[i];
        geometry.vertices.push( new THREE.Vector3( a[0]*v[0], a[1]*v[1], a[2]*v[2] ) );
    }

    var transparent = json.opacity < 1 ? true : false;
    var material = new THREE.LineBasicMaterial( { color: json.color, linewidth: json.linewidth,
                                                  transparent: transparent, opacity: json.opacity } );

    var c = new THREE.Vector3();
    geometry.computeBoundingBox();
    geometry.boundingBox.getCenter( c );
    geometry.translate( -c.x, -c.y, -c.z );

    var mesh = new THREE.Line( geometry, material );
    mesh.position.set( c.x, c.y, c.z );
    scene.add( mesh );

}

function createGeometry( json ) {

    var useFaceColors = 'faceColors' in json ? true : false;

    var geometry = new THREE.BufferGeometry();
    positions = []
    for (var i=0; i < json.vertices.length; i++) {
      positions.push(json.vertices[i].x);
      positions.push(json.vertices[i].y);
      positions.push(json.vertices[i].z);
    }
    positions = new Float32Array(positions)
    console.log(positions);
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions),3));
    geometry.computeVertexNormals();
    var c = new THREE.Vector3();
    geometry.computeBoundingBox();
    geometry.boundingBox.getCenter( c );
    geometry.translate( -c.x, -c.y, -c.z );

    return geometry
}

function createWireframeGeometry( json ) {

    var geometry = new THREE.Geometry();

    for ( var i=0 ; i < json.faces.length ; i++ ) {
        var f = json.faces[i];
        for ( var j=0 ; j < f.length ; j++ ) {
            var k = j === f.length-1 ? 0 : j+1;
            var v1 = json.vertices[f[j]];
            var v2 = json.vertices[f[k]];
            // vertices in opposite directions on neighboring faces
            var nudge = f[j] < f[k] ? .0005 : -.0005;
            geometry.vertices.push( new THREE.Vector3( v1.x, v1.y, (v1.z+nudge) ) );
            geometry.vertices.push( new THREE.Vector3( v2.x, v2.y, (v2.z+nudge) ) );
        }
    }

    var c = new THREE.Vector3();
    geometry.computeBoundingBox();
    geometry.boundingBox.getCenter( c );
    geometry.translate( -c.x, -c.y, -c.z );

    return geometry

}

function makeAxes() {
  var xAxis = new THREE.Vector3( 1, 0, 0);
  var yAxis = new THREE.Vector3( 0, 1, 0);
  var zAxis = new THREE.Vector3( 0, 0, 1);
  var group = new THREE.Group();
  group.add(fatArrow(xAxis,color=color5,thickness=.005));
  shift = .1
  addLabel( 'x', 1 + shift, shift, shift, color=color5,font='Arial',size=.5);
  group.add(fatArrow(yAxis,color=color5,thickness=.005));
  addLabel( 'y', shift, 1 + shift, shift, color=color5,font='Arial',size=.5);
  group.add(fatArrow(zAxis,color=color5,thickness=.005));
  addLabel( 'z', shift, shift, 1+shift, color=color5,font='Arial',size=.5);
  return group;
}

function fatArrow(dir,color='#000000',thickness=.01,segments=8) {
  var height = dir.length()*(95/100);
  const shaftGeometry = new THREE.CylinderGeometry( thickness, thickness, height, segments );
  const shaftMaterial = new THREE.MeshBasicMaterial( {color: color} );
  const shaft = new THREE.Mesh( shaftGeometry, shaftMaterial );
  shaft.lookAt(dir);
  shaft.rotateX(Math.PI/2);
  shaft.translateY(height/2);

  var headHeight = dir.length()*(5/100);
  const headGeometry = new THREE.CylinderGeometry( 0, 3*thickness, headHeight, segments );
  const headMaterial = new THREE.MeshBasicMaterial( {color: color} );
  const head = new THREE.Mesh( headGeometry, headMaterial );
  head.lookAt(dir);
  head.rotateX(Math.PI/2);
  head.translateY(dir.length()-headHeight/2);

  const group = new THREE.Group();
  group.add(head);
  group.add(shaft);
  return group;
}

window.color1 = 0x999999; //light gray
window.color2 = 0xFEC635; //Orange (Not transparent)
window.color3 = 0x317DFB; //Blue (Not transparent)
window.color4 = 0x808080; //Gray
window.color5 = 0x696969; //DimGray
window.transparentOrange = 0xFF8C00;
window.transparentBlue = 0x0000FF; 

function addColorMapToGeometry(g, colorMap=rainbowColorMap) {
  /*
     DESCRIPTION
       Assigns colors to vertices of g using a colormap based on the z coordinate.

     ARGUMENTS
       * g is a ThreeJs Geometry
       * colorMap is a function that takes a number between 0 and 1 and returns a THREE.Color object.

     EXAMPLES
        // Sphere
        g = new THREE.SphereGeometry(.5,10,10);
        addColorMapToGeometry(g);
        material = new THREE.MeshBasicMaterial( {vertexColors: THREE.VertexColors, side:THREE.DoubleSide, } );
        plane = new THREE.Mesh( g, material);
        scene.add(plane);

        // Cone pointing along z axis: note that it will only show as a linear gradient between the t=0 and t=1 colors.
        // To get more colors, you would have to retriangulate.
        g = new THREE.ConeGeometry(.5,1,5);
        g.rotateX(Math.PI/2);
        addColorMapToGeometry(g);
        material = new THREE.MeshBasicMaterial( {vertexColors: THREE.VertexColors, side:THREE.DoubleSide, } );
        plane = new THREE.Mesh( g, material);
        scene.add(plane);

     DETAILS
       The color of each vertex v is determined by colorMap(t) where 
       t is obtained by normalizing the z-coordinate difference between v and the lowest z-coordinate in g.

       Note that the vertex colors will ultimately be interpolated barycentrically because of "indexed geometry". 
       Consequently, the triangulation of your geometry could have a large effect on the rendering. See the cone example.
  */
  g.computeBoundingBox();
  var zMin = g.boundingBox.min.z;
  var zMax = g.boundingBox.max.z;
  var zRange = zMax - zMin;
  var Vs = g.attributes.position.array; //vertices
  var Cs = [] //colors
  for (var i=0; i < Vs.length; i+=3) {
    point = {x: Vs[i], y: Vs[i+1], z: Vs[i+2]};
    t = (point.z  - zMin)/zRange
    color = colorMap(t);
    Cs.push(color.r); 
    Cs.push(color.g); 
    Cs.push(color.b); 
  }
  g.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(Cs),3, true)
  );
}
