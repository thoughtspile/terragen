// Postprocessing

var warp = function(raw, warpAmt, fbm) {
	var alt = new Float32Array(raw.length);
	for (var x = 0; x < raw.w; x++) {
		for (var y = 0; y < raw.h; y++) {
			var qx = Math.floor(warpAmt * (fbm(x, y) + 1));
			var qy = Math.floor(warpAmt * (fbm(x + 4, y + 3) + 1));
			alt[x + y * raw.w] = raw[(x + qx) % raw.w + raw.w * ((y + qy) % raw.h)];
		}
	}
	raw.set(alt);
};

var ridge = function(raw) {
	map2(raw, function (val, x, y) {
		return Math.pow(Math.abs(val), 2); // per-octave?
	});
}
