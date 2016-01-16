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
