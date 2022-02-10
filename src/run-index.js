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
