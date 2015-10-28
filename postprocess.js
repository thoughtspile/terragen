// Postprocessing

var warp = function(raw, warpAmt, fbm) {
	for (var x = 0; x < raw.w; x++) {
		for (var y = 0; y < raw.h; y++) {
			var qx = warpAmt * fbm(x, y);
			var qy = warpAmt * fbm(x + 4, y + 3);
			raw[x + y * raw.w] = fbm(x + qx, y + qy);
		}
	}
};

var ridge = function(raw) {
	map2(raw, function (val, x, y) {
		return Math.pow(Math.abs(val), 2); // per-octave?
	});
}
