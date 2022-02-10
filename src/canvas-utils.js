var cellSize = 50;
var cellSideCount = 20;
var cellWorldRadius = cellSideCount * cellSize / 2;
var cellRadius = Math.floor(cellSideCount / 2);
var cellRadius2 = Math.pow(cellRadius, 2);
var cellDetail = 20;

var cell = function(ix, iy) {
	return new Cell(ix, iy);
};

var Cell = function(ix, iy) {
	this.ix = ix;
	this.iy = iy;
	this.mesh = null;
	this.geom = null;
}

Cell.prototype.materialize = function(mat) {
	var geom = new THREE.PlaneBufferGeometry(
		cellSize, cellSize,
		cellDetail, cellDetail);
	geom.dynamic = true;
	var mesh = new THREE.Mesh(geom, mat);
	mesh.rotation.x = -Math.PI / 2;
	this.geom = geom;
	this.mesh = mesh;
	return this;
}

var cellDist = function(a, b) {
	return Math.pow(a.ix - b.ix, 2) + Math.pow(a.iy - b.iy, 2);
};


var cellManager = function(gen, mat) {
	return new CellManager(gen, mat);
};

var CellManager = function(gen, mat) {
	this.gen = gen;
	this.mat = mat;

	this.container = new THREE.Group();
	this.container.position.x = -cellWorldRadius;
	this.container.position.z = -cellWorldRadius;

	this.cells = [];
	this._origin = {};
	this.originCell = cell();
};

CellManager.prototype.origin = function(pos) {
	this._origin = pos;
	this.originCell.ix = Math.floor(pos.x / cellSize) + cellRadius;
	this.originCell.iy = Math.floor(pos.z / cellSize) + cellRadius;
	return this;
};

CellManager.prototype.update = function() {
	var exit = this.exit();
	var originCell = this.originCell;
	var enter = this.enter();

	var cellDistCmp = function(a, b) {
		return cellDist(a, originCell) <= cellDist(b, originCell);
	};
	enter.sort(cellDistCmp);
	exit.sort(cellDistCmp).reverse();

	if (exit.length > 0 || enter.length > 0) {
		var start = Date.now();
		while (enter.length > 0 && Date.now() - start < 16) {
			var newCell = enter.pop();
			var oldCell = exit.pop() || this.add();
			oldCell.mesh.position.x = newCell.ix * cellSize;
			oldCell.mesh.position.z = newCell.iy * cellSize;
			oldCell.ix = newCell.ix;
			oldCell.iy = newCell.iy;
			display3d(oldCell.geom, this.gen, {
				x: newCell.ix * cellSize,
				y: -newCell.iy * cellSize // why mirroring?
			});
		}
	}

	return this;
};

CellManager.prototype.regenerate = function (gen) {
	this.gen = gen;
	this.cells.forEach(cell => {
		display3d(cell.geom, this.gen, {
			x: cell.ix * cellSize,
			y: -cell.iy * cellSize // why mirroring?
		});
	});

	return this;
}

CellManager.prototype.exit = function() {
	return this.cells.filter(function(cell) {
		return !this.visible(cell);
	}.bind(this));
};

CellManager.prototype.enter = function() {
	var originCell = this.originCell;

	var lowx = originCell.ix - cellRadius;
	var highx = originCell.ix + cellRadius;
	var lowy = originCell.iy - cellRadius;
	var highy = originCell.iy + cellRadius;

	var enter = [];
	for (var ix = lowx - 1; ix <= highx + 1; ix++) {
		for (var iy = lowy - 1; iy <= highy + 1; iy++) {
			var cand = cell(ix, iy);
			if (this.visible(cand) && this.cells.every(function(cell) {
					return cellDist(cand, cell) > 0;
				})) {
				enter.push(cand);
			}
		}
	};
	return enter;
};

CellManager.prototype.visible = function(cell) {
	return cellDist(cell, this.originCell) <= cellRadius2
};

CellManager.prototype.add = function() {
	// it needs mat, but looks cool this way
	var newCell = cell().materialize(this.mat);
	this.cells.push(newCell);
	this.container.add(newCell.mesh);
	return newCell;
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
	var layerMgr = cellManager(gen, mat);
	scene.add(layerMgr.container);

	(function update() {
		layerMgr.origin(scene.controls.target)
			.update();
		window.requestAnimationFrame(update);
	}());

	return layerMgr;
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

module.exports = {
	init3d: init3d,
	addObject: addObject,
};
