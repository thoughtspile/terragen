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
	camera.position.z = 300;
	camera.position.y = 300;
	camera.position.x = 300;

	var light = new THREE.PointLight( 0xdfebff );
	light.position.set( 100, 80, 0 );
	scene.add(light);

	terrain = new THREE.PlaneBufferGeometry(200, 200, 512, 512);
	terrain.dynamic = true;
	var terrainMat = new THREE.MeshLambertMaterial( {
		color: 0xaabbcc } );
	var terrainMesh = new THREE.Mesh(terrain, terrainMat);
	terrainMesh.rotation.x = -Math.PI / 2;
	scene.add(terrainMesh)

	water = new THREE.PlaneBufferGeometry(400, 400, 512, 512);
	water.dynamic = true;
	var waterMat = new THREE.MeshPhongMaterial( {
		specular: 0x555555,
		shininess: 30,
		color: 0x2255aa } );
	var waterMesh = new THREE.Mesh(water, waterMat);
	waterMesh.rotation.x = -Math.PI / 2;
	scene.add(waterMesh)

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize(512, 512);
	renderer.setClearColor(new THREE.Color('cyan'));

	var controls = new THREE.OrbitControls(camera, canvas);

	canvas.appendChild( renderer.domElement );

	(function update() {
		controls.update();
		renderer.render(scene, camera);
		window.requestAnimationFrame(update);
	}());
}

var display3d = function(geom, heightmap, scale) {
	normalize(heightmap);
	console.log(geom, heightmap)
	var pos = geom.attributes.position.array;
	for (var i = 2; i < pos.length; i += 3)
		pos[i] = heightmap[(i - 2) / 3] * scale;
	geom.attributes.position.needsUpdate = true;
	geom.computeVertexNormals();
	geom.attributes.normals.needsUpdate = true;
}
