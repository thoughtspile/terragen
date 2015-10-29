var cellSize = 20;
var cellSideCount = 11;
var cellDetail = 20;

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
	window.scene = scene;

	var camera = new THREE.PerspectiveCamera( 30, 1, 1, 10000 );
	camera.position.z = 0;
	camera.position.y = 200; //h
	camera.position.x = 0;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
	scene.camera = camera;
	window.camera = camera;

	var light = new THREE.PointLight( 0xdfebff, 3 );
	light.position.set( 4000, 800, 0 );
	scene.add(light);

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize(512, 512);
	renderer.setClearColor(new THREE.Color('cyan'));
	canvas.appendChild( renderer.domElement );

	scene.controls =
		new THREE.OrbitControls(camera, canvas);
		//new rtsCameraControl(camera, { moveSpeed: 10 });

	var clock = new THREE.Clock();
	(function update() {
		scene.controls.update(clock.getDelta(), true);
		renderer.render(scene, camera);
		window.requestAnimationFrame(update);
	}());

	return scene;
}

var addObject = function(gen, mat, scene, controls) {
	var container = new THREE.Group();
	var cells = [];
	for (var i = 0; i < cellSideCount; i++) {
		for (var j = 0; j < cellSideCount; j++) {
			var geom = new THREE.PlaneBufferGeometry(
				cellSize, cellSize,
				cellDetail, cellDetail);
			geom.dynamic = true;
			var mesh = new THREE.Mesh(geom, mat);
			mesh.rotation.x = -Math.PI / 2;
			cells.push({ ix: i, iy: j, geom: geom, mesh: mesh });
			container.add(mesh);
		}
	}
	scene.add(container);

	var origin = scene.controls.target;//camera.position;
	var lastPosition = { x: Infinity, y: Infinity };
	var needInit = true;
	var bord = {
		down: 0,
		up: cellSideCount - 1,
		left: 0,
		right: cellSideCount - 1
	};
	(function update() {
		var right = origin.x - lastPosition.x > cellSize;
		var left = -origin.x + lastPosition.x > cellSize;
		var down = -origin.z + lastPosition.y > cellSize;
		var up = origin.z - lastPosition.y > cellSize;
		console.log(up, down, left, right)

		var swap = cells.filter(function(cellData) {
			return needInit ||
				left && cellData.ix === bord.right ||
				right && cellData.ix === bord.left ||
				up && cellData.iy === bord.down ||
				down && cellData.iy === bord.up;
		});
		if (up) {
			swap.forEach(function(cell) {
				if (cell.iy === bord.down) cell.iy = bord.up + 1;
			});
			bord.down++;
			bord.up++;
		}
		if (down) {
			swap.forEach(function(cell) {
				if (cell.iy === bord.up) cell.iy = bord.down - 1;
			});
			bord.down--;
			bord.up--;
		}
		if (left) {
			swap.forEach(function(cell) {
				if (cell.ix === bord.right) cell.ix = bord.left - 1;
			});
			bord.left--;
			bord.right--;
		}
		if (right) {
			swap.forEach(function(cell) {
				if (cell.ix === bord.left) cell.ix = bord.right + 1;
			});
			bord.left++;
			bord.right++;
		}

		if (swap.length > 0) {
			lastPosition = { x: origin.x, y: origin.z };
			mesh.position.set(lastPosition.x, 0, lastPosition.y);
			swap.forEach(function(cellData) {
				cellData.mesh.position.x = cellData.ix * cellSize;
				cellData.mesh.position.z = cellData.iy * cellSize;
				display3d(cellData.geom, gen, {
					x: cellData.ix * cellSize,
					y: -cellData.iy * cellSize // why mirroring?
				});
			});
		}

		needInit = false;
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
