(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
var utils = require('./utils');
var num = require('./numerics');

var makePerm2 = function (nPerm, target) {
    var perm = new Float32Array(2 * nPerm);
    for (var i = 0; i < perm.length; i++) {
        perm[i] = Math.floor(nPerm * Math.random());
    }

    return function(x, y) {
        return perm[utils.mod(x + perm[utils.mod(y, nPerm)], nPerm)] % target;
    };
};

var makeFBM = function() {
    var grads = 100;
    var gx = new Float32Array(grads);
    var gy = new Float32Array(grads);
    for (var i = 0; i < grads; i++) {
        var dir = 2 * Math.PI * (Math.random());
        gx[i] = Math.cos(dir);
        gy[i] = Math.sin(dir);
    }
    var permute = makePerm2(100, grads);

    var bm = function(srcX, srcY) {
        var x1 = Math.floor(srcX);
        var y1 = Math.floor(srcY);
        var dx = srcX - x1;
        var dy = srcY - y1;
        var x2 = x1 + 1;
        var y2 = y1 + 1;

        var i11 = permute(x1, y1);
        var i12 = permute(x1, y2);
        var i21 = permute(x2, y1);
        var i22 = permute(x2, y2);

        var s = num.dot2(dx, dy, gx[i11], gy[i11]);
        var u = num.dot2(dx, dy - 1, gx[i12], gy[i12]);
        var t = num.dot2(dx - 1, dy, gx[i21], gy[i21]);
        var v = num.dot2(dx - 1, dy - 1, gx[i22], gy[i22]);

        var easeX = num.ease.cubic(dx);
        var easeY = num.ease.cubic(dy);
        return num.lerp(num.lerp(s, t, easeX), num.lerp(u, v, easeX), easeY);
    }

    var octBM = utils.octavize(bm);

    return function(x, y) {
        return octBM(x, y);
    }
};

var makeSmoothNoise = function() {
    return function (srcX, srcY) {
        var fracX = num.ease.cubic(frac(srcX));
        var fracY = num.ease.cubic(frac(srcY));
        var x1 = Math.floor(srcX);
        var y1 = Math.floor(srcY);
        var x2 = (x1 + w - 1) % w;
        var y2 = (y1 + h - 1) % h;

        return num.lerp(
            num.lerp(buff[x2 + y2 * w], buff[x1 + y2 * w], fracX),
            num.lerp(buff[x2 + y1 * w], buff[x1 + y1 * w], fracX),
            fracY
        );
    };
};

module.exports = makeFBM;

},{"./numerics":3,"./utils":6}],3:[function(require,module,exports){
// Numeric utils

var frac = function (x) {
	return x - Math.floor(x);
};

var ease = {
	linear: function (x) { return x; },
	cubic: function (x) { return x * x * (3 - 2 * x); }
};

var lerp = function (start, end, amt) {
	return start + amt * (end - start);
};

var dot2 = function (a1, a2, b1, b2) {
	return a1 * b1 + a2 * b2;
};

module.exports = {
	dot2: dot2,
	ease: ease,
	lerp: lerp
};

},{}],4:[function(require,module,exports){
var renderer = require('./canvas-utils');
var terragen = require('./terragen');

(function() {
	var controls = {
		mode: document.getElementById('mode'),

		flIter: document.getElementById('flIter'),

		hrIter: document.getElementById('hrIter'),
		rmin: document.getElementById('rmin'),
		rmax: document.getElementById('rmax'),

		warp: document.getElementById('warp')
	};
	var runBtn = document.getElementById('run');
	var mapEl = document.getElementById('map');
	var panels = {
		octaveOpts: document.getElementById('octaveOpts'),
		flOpts: document.getElementById('flOpts'),
		hrOpts: document.getElementById('hrOpts'),
		perlinOpts: document.getElementById('perlinOpts'),
		worleyOpts: document.getElementById('worleyOpts'),
		postprocess: document.getElementById('postprocess')
	};

	var makeConfig = function() {
		var config = {
			mode: controls.mode.value,
			postWarp: parseInt(controls.warp.value)
		};
		if (config.mode === 'hr') {
			config.rmin = parseInt(controls.rmin.value);
			config.rmax = parseInt(controls.rmax.value);
			config.count = parseInt(controls.hrIter.value);
		} else if (config.mode === 'fl') {
			config.count = parseInt(controls.flIter.value);
		} else if (config.mode === 'wpn') {
			config.nativeWarp = parseInt(controls.warp.value);
		}
		return config;
	};

	var updateView = function() {
		var config = makeConfig();

		panels['octaveOpts'].style.display = 'none';
		panels['flOpts'].style.display = (config.mode === 'fl'? null: 'none');
		panels['hrOpts'].style.display = (config.mode === 'hr'? null: 'none');
		panels['perlinOpts'].style.display = ['pn', 'wpn', 'rpn'].indexOf(config.mode) !== -1? null: 'none';
		panels['worleyOpts'].style.display = config.mode === 'wn'? null: 'none';
	};

	function terrainGen() {
		var rawGen = terragen().generator(makeConfig());
		return function(x, y) {
			return (rawGen(x, y) -.02) * 40;
		};
	}

	function waterGen() {
		var waterGen2 = terragen().generator(makeConfig());
		return function (x, y) {
			return (waterGen2(x, y)) * 4;
		};
	}

	var scene = renderer.init3d(mapEl);
	var terrainMat = new THREE.MeshLambertMaterial( {
		color: 0x88ab66 } );
	var terrain = renderer.addObject(terrainGen(), terrainMat, scene, scene.controls);
	var waterMat = new THREE.MeshPhongMaterial( {
		specular: 0x555555,
		shininess: 30,
		color: 0x2255aa } );
	var water = renderer.addObject(waterGen(), waterMat, scene, scene.controls);

	var run = function() {
		terrain.regenerate(terrainGen());
		water.regenerate(waterGen());
	};

	for (var key in controls) {
		controls[key].addEventListener('change', () => {
			updateView();
			run();
		});
	}
	runBtn.addEventListener('click', run);
	run();
	updateView();
}());

},{"./canvas-utils":1,"./terragen":5}],5:[function(require,module,exports){
var makeFBM = require('./noise-utils');
var { warpize } = require('./utils');

var terragen = function() {
	var fbm = makeFBM();
	var seed = Math.random();

	return {
		generator: function(ops) {
			var fn = fbm;
			if (ops.postWarp > 0)
				fn = warpize(fn, fn, ops.postWarp);
			if (ops.ridge)
				fn = function(x, y) {
					return Math.abs(fn(x, y));
				};
			return fn;
		}
	};
};

module.exports = terragen;

},{"./noise-utils":2,"./utils":6}],6:[function(require,module,exports){
// array utils

var dist = function(a, b) {

}

var mod = function(base, by) {
	return ((base % by) + by) % by;
}

var map = function(arr, fn) {
	for (var i = 0; i < arr.length; i++) {
		arr[i] = fn(arr[i], i);
	}
	return arr;
};

var map2 = function(mat, fn) {
	for (var y = 0, pos = 0; y < mat.h; y++) {
		for (var x = 0; x < mat.w; x++, pos++) {
			mat[pos] = fn(mat[pos], x, y);
		}
	}
	return mat;
};

var fill = function(arr, val) {
	for (var i = 0; i < arr.length; i++) {
		arr[i] = val;
	}
	return arr;
};

var range = function(arr) {
	var low = Infinity;
	var high= -Infinity;
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] < low)
			low = arr[i];
		if (arr[i] > high)
			high = arr[i];
	}
	return [low, high];
}

var normalize = function(arr) {
	var rawRange = range(arr);
	for (var i = 0; i < arr.length; i++) {
		arr[i] = (arr[i] - rawRange[0]) / (rawRange[1] - rawRange[0]);
	}
	return arr;
}

var cutoff = function(raw, val) {
	for (var i = 0; i < raw.length; i++)
		if (raw[i] < val)
			raw[i] = val;
	return raw;
}

var white = function(arr) {
	for (var i = 0; i < arr.length; i++) {
		arr[i] = Math.random();
	}
	return arr;
};

var octavize = function(fn) {
	return function(x, y) {
		var res = 0;
		for (var step = 256, amp = 1; step >= 1; step /= 2, amp /= 2) {
			res += fn(x / step, y / step) * amp;
		}
		return res;
	}
};

var warpize = function(wrap, base, amt) {
	return function(x, y) {
		return base(x + wrap(x, y) * amt, y + wrap(x + 4, y + 3) * amt);
	}
}

module.exports = {
	octavize: octavize,
	mod: mod,
	warpize,
};

},{}]},{},[4]);
