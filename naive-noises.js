var raise = function(raw) {
	// opts: offset dist
	var posx = Math.floor(w * Math.random());
	var posy = Math.floor(h * Math.random());
	var ang = Math.tan(Math.PI * (Math.random() - .5));
	var offset = Math.random() - .5;

	for (var i = 0; i < raw.w; i++) {
		var start = Math.floor(Math.max(0, posy + ang * (i - posx)));
		for (var j = start; j < raw.h; j++) {
			raw[i + j * raw.w] += offset;
		}
	}
};



var hillGen = function(w, h, count, rmin, rmax) {
	var hills = [];
	for (var i = 0; i < count; i++) {
		var posx = Math.floor(w * Math.random());
		var posy = Math.floor(h * Math.random());
		var r = rmin + Math.random() * (rmax - rmin);
		var r2 = r * r;
		hills.push({ x: posx, y: posy, r: r, r2: r2 });
	}
	return function(x, y) {
		var h = 0;
		for (var i = 0; i < count; i++) {
			var dx = x - hills[i].x;
			var dy = y - hills[i].y;
			var d2 = dx * dx + dy * dy;
			if (d2 < hills[i].r2)
				h += hills[i].r2 - d2;
		}
		return h * h * h;
	};
}

var hill = function(raw, count, rmin, rmax) {
	var gen = hillGen(raw.w, raw.h, count, rmin, rmax);
	map2(raw, function(_, x, y) { return gen(x, y); })
}


var diamondsqr = function(arr) {
    var w = arr.w;
    var h = arr.h;
	// opts: seed count, decay
	arr[0] = Math.random();
	arr[h - 1] = Math.random();
	arr[h * (w - 1)] = Math.random();
	arr[w * h - 1] = Math.random();
	for (var step = Math.floor(w / 2), amp = 1; step >= 1; step /= 2, amp /= 2) {
		// diamond
		for (var x = step; x < w; x += 2 * step) {
			for (var y = step; y < h; y += 2 * step) {
				var sum = arr[(x - step) + (y - step) * w] + //down-left
					arr[(x - step) + (y + step) * w] + //up-left
					arr[(x + step) + (y - step) * w] + //down-right
					arr[(x + step) + (y + step) * w];  //up-right
				arr[x + y * w] = sum / 4 + (Math.random() - .5) * 2 * amp;
			}
		}
		// square
		for (var x = 0; x < w; x += step) {
			for (var y = step * (1 - (x / step) % 2); y < h; y += 2 * step) {
				var sum = 0;
				var count = 0;
				var sum = (x >= step? arr[(x - step) + y * w]: 0) +
					(x < w - step? arr[(x + step) + y * w]: 0) +
					(y >= step? arr[x + (y - step) * w]: 0) +
					(y < h - step? arr[x + (y + step) * w]: 0);
				var count = (x >= step) + (x < w - step) + (y >= step) + (y < h - step);
				arr[x + y * w] = (count > 0? sum/count: 0) + (Math.random() - .5) * 2 * amp;
			}
		}
	}
	return arr;
};


var octaveNoise = function(raw, noiseGenerator) {
	var octNoise = octavize(noiseGenerator);
	map2(raw, function(val, x, y) {
		return octNoise(x, y);
	});
};
