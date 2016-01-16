var terragen = (function() {
	var context = null;
	var smoothNoise = null;
	var fbm = null;


	var noiseGenerator = {
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

			if (ops.postWarp > 0)
				warp(height, ops.postWarp, fbm);
			if (mode === 'rpn')
				ridge(height);

			return height;
		},
		generator: function(ops) {
			var fn = fbm;
			if (ops.postWarp > 0)
				fn = warpize(fn, fn, ops.postWarp);
			if (mode === 'rpn')
				return function(x, y) { return Math.abs(fn(x, y)); };
			return fn;
		},
		init: function() {
			//smoothNoise = makeSmoothNoise(w, h);
			fbm = makeFBM();
			window.fbm = fbm
			seed = Math.random();
			return this;
		}
	};


	// Export

	return noiseGenerator;
}());
