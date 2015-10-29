var cellSize = 200;
var cellDetail = 100;

var display = function(raw, context, channel) {
	var mapPixels = context.getImageData(0, 0, raw.w, raw.h);
	normalize(raw);
	for (var i = 0; i < raw.length; i++) {
		var normH = Math.floor(255 * raw[i]);
		var pos = 4 * i;
		mapPixels.data[pos + channel] = normH;
		//mapPixels.data[pos + 1] = normH;
		//mapPixels.data[pos + 2] = normH;
		mapPixels.data[pos + 3] = 255;
	}
	context.putImageData(mapPixels, 0, 0);
};

var init3d = function(canvas) {
	var scene = new THREE.Scene();

	var camera = new THREE.PerspectiveCamera( 30, 1, 1, 10000 );
	camera.position.z = cellSize;
	camera.position.y = cellSize; //h
	camera.position.x = cellSize;
    //camera.lookAt(new THREE.Vector3(0, 0, 0));
	scene.camera = camera;
	window.camera = camera

	var light = new THREE.PointLight( 0xdfebff, 3 );
	light.position.set( 4000, 800, 0 );
	scene.add(light);

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize(512, 512);
	renderer.setClearColor(new THREE.Color('cyan'));
	canvas.appendChild( renderer.domElement );

	scene.controls =
		//new THREE.FlyControls(camera);
		new THREE.OrbitControls(camera, canvas);
    //scene.controls.lookSpeed = 4;
    //scene.controls.movementSpeed = 200;
    //scene.controls.noFly = true;
    //scene.controls.lookVertical = true;
    //scene.controls.constrainVertical = true;
    //scene.controls.verticalMin = 1.0;
    //scene.controls.verticalMax = 2.0;
    //scene.controls.lon = -150;
    //scene.controls.lat = 120;

	var clock = new THREE.Clock();
	(function update() {
		scene.controls.update(clock.getDelta());
		renderer.render(scene, camera);
		window.requestAnimationFrame(update);
	}());

	return scene;
}

var addObject = function(gen, mat, scene, controls) {
	var geom = new THREE.PlaneBufferGeometry(
		3 * cellSize, 3 * cellSize,
		cellDetail, cellDetail);
	geom.dynamic = true;
	var mesh = new THREE.Mesh(geom, mat);
	mesh.rotation.x = -Math.PI / 2;
	scene.add(mesh);

	var origin = scene.camera.position;
	var lastPosition = { x: Infinity, y: Infinity };
	(function update() {
		if (Math.abs(origin.x - lastPosition.x) > cellSize ||
		  Math.abs(origin.z - lastPosition.y) > cellSize) {
			lastPosition = {
				x: origin.x,
				y: origin.z};
			mesh.position.set(lastPosition.x, 0, lastPosition.y);
			display3d(geom, gen, {
				x: origin.x - .5 * cellSize,
				y: -origin.z - .5 * cellSize // why mirroring?
			});
		}
		window.requestAnimationFrame(update);
	}());
};

var display3d = function(geom, gen, mv) {
	var mv = mv || { x: 0, y: 0 };
	var pos = geom.attributes.position.array;
	for (var i = 0; i < pos.length / 3; i++) {
		pos[3 * i + 2] = gen(pos[3 * i] + mv.x, pos[3 * i + 1] + mv.y);
	}
	geom.attributes.position.needsUpdate = true;
	geom.computeVertexNormals();
	geom.attributes.normal.needsUpdate = true;
}
