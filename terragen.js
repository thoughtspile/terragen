var terragen = (function() {
	var h = 0;
	var w = 0;
	var height = new Float32Array(0);
	height.h = h;
	height.w = w;
	var context = null;
	var smoothNoise = null;
	var fbm = null;
	var seed = 0;


	// Noise generators

	var perlin = function(raw) {
		map2(raw, function(val, x, y) { return fbm(x, y); });
	};


	// Interface

	var noiseGenerator = {
		size: function (newW, newH) {
			w = newW;
			h = newH;
			height = new Float32Array(w * h);
			height.w = w;
			height.h = h;
			return this;
		},
		bind: function(mapEl) {
			context = mapEl.getContext('2d');
			mapEl.width = w;
			mapEl.height = h;
			return this;
		},
		run: function(ops) {
			Math.seedrandom(seed);
			fill(height, 0);

			var mode = ops.mode;
			if (mode === 'fl')
				for (var i = 0; i < ops.count; i++)
					raise(height, 3);
			else if (mode === 'hr')
				hill(height, ops.count, ops.rmin, ops.rmax);
			else if (mode === 'ds')
				diamondsqr(height);
			else if (mode === 'on')
				octaveNoise(height, smoothNoise);
			else if (mode === 'pn'  || mode === 'rpn')
				perlin(height);
			else if (mode === 'wn')
				worley(height);

			if (mode === 'rpn')
				ridge(height);
			if (ops.postWarp > 0)
				warp(height, ops.postWarp, fbm);

			return height;
		},
		init: function() {
			smoothNoise = makeSmoothNoise(w, h);
			fbm = makeFBM(w, h);
				window.fbm = fbm
			seed = Math.random();
			return this;
		}
	};


	// Export

	return noiseGenerator;
}());
