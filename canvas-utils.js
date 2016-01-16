var cellSize = 50;
var cellSideCount = 20;
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
	camera.position.x = -400;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
	scene.camera = camera;

	var light = new THREE.PointLight( 0xeeeeaa, 3 );
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
	container.position.x = -cellSideCount * cellSize / 2;
	container.position.z = -cellSideCount * cellSize / 2;
	scene.add(container);

	var cells = [];
	var mkCell = function() {
		var geom = new THREE.PlaneBufferGeometry(
			cellSize, cellSize,
			cellDetail, cellDetail);
		geom.dynamic = true;
		var mesh = new THREE.Mesh(geom, mat);
		mesh.rotation.x = -Math.PI / 2;
		var cell = { geom: geom, mesh: mesh };
		cells.push(cell);
		container.add(mesh);
		return cell;
	};

	var origin = scene.controls.target;
		//scene.camera.position;
	var pool = [];
	(function update() {
		var originCell = {
			ix: Math.floor(origin.x / cellSize) + Math.floor(cellSideCount / 2),
			iy: Math.floor(origin.z / cellSize) + Math.floor(cellSideCount / 2)
		};

		var cellDist = function(a, b) {
			return Math.pow(a.ix - b.ix, 2) +
				Math.pow(a.iy - b.iy, 2);
		};

		var isVisible = function(cell) {
			return cellDist(cell, originCell) <=
				Math.pow(Math.floor(cellSideCount / 2), 2)
		};

		var exit = cells.filter(function(cell) {
			return !isVisible(cell);
		});

		var lowx = originCell.ix - Math.floor(cellSideCount / 2);
		var highx = originCell.ix + Math.floor(cellSideCount / 2);
		var lowy = originCell.iy - Math.floor(cellSideCount / 2);
		var highy = originCell.iy + Math.floor(cellSideCount / 2);
		var enter = [];
		for (var ix = lowx - 1; ix <= highx + 1; ix++) {
			for (var iy = lowy - 1; iy <= highy + 1; iy++) {
				var cand = {ix: ix, iy: iy};
				if (isVisible(cand) && !cells.some(function(cell) {
				  	  return cell.ix == ix && cell.iy == iy;
				  }))
					enter.push(cand);
			}
		};

		var cellDistCmp = function(a, b) {
			return cellDist(a, originCell) <= cellDist(b, originCell);
		};
		enter.sort(cellDistCmp);
		exit.sort(cellDistCmp).reverse();

		if (exit.length > 0 || enter.length > 0) {
			var start = Date.now();
			while (enter.length > 0 && Date.now() - start < 16) {
				var newCell = enter.pop();
				var oldCell = exit.pop() || mkCell();
				oldCell.mesh.position.x = newCell.ix * cellSize;
				oldCell.mesh.position.z = newCell.iy * cellSize;
				oldCell.ix = newCell.ix;
				oldCell.iy = newCell.iy;
				display3d(oldCell.geom, gen, {
					x: newCell.ix * cellSize,
					y: -newCell.iy * cellSize // why mirroring?
				});
			}
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
