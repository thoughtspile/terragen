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

	terragen.size(513, 513).init();
	init3d(mapEl);

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
	var run = function() {
		var config = makeConfig();

		panels['octaveOpts'].style.display = 'none';
		panels['flOpts'].style.display = (config.mode === 'fl'? 'visible': 'none');
		panels['hrOpts'].style.display = (config.mode === 'hr'? 'visible': 'none');
		panels['perlinOpts'].style.display = ['pn', 'wpn', 'rpn'].indexOf(config.mode) !== -1? 'visible': 'none';
		panels['worleyOpts'].style.display = config.mode === 'wn'? 'visible': 'none';

		display3d(terragen.run(makeConfig()), mapEl);
	};
	for (var key in controls)
		controls[key].addEventListener('change', run);

	runBtn.addEventListener('click', function() {
		display3d(terragen.init().run(makeConfig()));
	});


	run();
}());
