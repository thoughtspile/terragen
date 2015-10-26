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


	// utils

	var display = function(raw, context) {
		var mapPixels = context.getImageData(0, 0, w, h);
		normalize(raw);
		for (var i = 0; i < w * h; i++) {
			var normH = Math.floor(255 * raw[i]);
			var pos = 4 * i;
			mapPixels.data[pos + 0] = normH;
			mapPixels.data[pos + 1] = normH;
			mapPixels.data[pos + 2] = normH;
			mapPixels.data[pos + 3] = 255;
		}
		context.putImageData(mapPixels, 0, 0);
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


	// Noise utils

	var makePerm2 = function (nPerm, target) {
		var perm = new Float32Array(2 * nPerm);
		for (var i = 0; i < perm.length; i++) {
			perm[i] = Math.floor(nPerm * Math.random());
		}

		return function(x, y) {
			return perm[x + perm[y]] % target;
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
		var permute = makePerm2(Math.max(w, h), grads);

		var bm = function(srcX, srcY) {
			var x1 = Math.floor(srcX);
			var y1 = Math.floor(srcY);
			var dx = srcX - x1;
			var dy = srcY - y1;
			var x2 = (x1 === w - 1? 0: x1 + 1);
			var y2 = (y1 === h - 1? 0: y1 + 1);

			var i11 = permute(x1, y1);
			var i12 = permute(x1, y2);
			var i21 = permute(x2, y1);
			var i22 = permute(x2, y2);

			var s = dot2(dx, dy, gx[i11], gy[i11]);
			var u = dot2(dx, dy - 1, gx[i12], gy[i12]);
			var t = dot2(dx - 1, dy, gx[i21], gy[i21]);
			var v = dot2(dx - 1, dy - 1, gx[i22], gy[i22]);

			var easeX = ease.cubic(dx);
			var easeY = ease.cubic(dy);
			return lerp(lerp(s, t, easeX), lerp(u, v, easeX), easeY);
		}

		var octBM = octavize(bm);

		return function(x, y) {
			var x = (x + w) % w;
			var y = (y + h) % h;
			return octBM(x, y);
		}
	};

	var makeSmoothNoise = function() {
		var buff = white(new Float32Array(h * w));

		return function (srcX, srcY) {
			var fracX = ease.cubic(frac(srcX));
			var fracY = ease.cubic(frac(srcY));
			var x1 = Math.floor(srcX);
			var y1 = Math.floor(srcY);
			var x2 = (x1 + w - 1) % w;
			var y2 = (y1 + h - 1) % h;

			return lerp(
				lerp(buff[x2 + y2 * w], buff[x1 + y2 * w], fracX),
				lerp(buff[x2 + y1 * w], buff[x1 + y1 * w], fracX),
				fracY
			);
		};
	};


	// Noise generators

	var octaveNoise = function(raw) {
		var octNoise = octavize(smoothNoise);
		map2(raw, function(val, x, y) {
			return octNoise(x, y);
		});
	};

	var perlin = function(raw) {
		map2(raw, function(val, x, y) { return fbm(x, y); });
	};

	var ridgedPerlin = function(raw) {
		map2(raw, function (val, x, y) {
			return -Math.abs(fbm(x, y)); // per-octave?
		});
	};

	var worley = function(raw) {
		var cellSize = 32;
		var cellCount = Math.floor(w / cellSize);

		var poss = 100;
		var fitToCell = function(x) { return cellSize * x; };
		var px = map(white(new Float32Array(poss)), fitToCell);
		var py = map(white(new Float32Array(poss)), fitToCell);

		var permute = makePerm2(Math.max(w, h), poss);
		var ptsPerCell = 1;
		var getCellPos = function(cx, cy, out) {
			out[0] = px[permute(cx, cy)];
			out[1] = py[permute(cx, cy)];
		}

		var dists = new Array(9);
		var buff = new Float32Array(2);
		// play with point distribution
		for (var x = 0; x < w; x++) {
			for (var y = 0; y < h; y++) {
				var cellX = Math.floor(x / cellSize);
				var cellY = Math.floor(y / cellSize);

				var k = 0;
				for (var offX = cellX - 1; offX <= cellX + 1; offX++) {
					for (var offY = cellY - 1; offY <= cellY + 1; offY++) {
						var xFix = (offX < 0? cellCount + offX: offX % cellCount);
						var yFix = (offY < 0? cellCount + offY: offY % cellCount);
						for (var i = 0; i < ptsPerCell; i++) {
							getCellPos(xFix, yFix, buff);
							buff[0] += offX * cellSize;
							buff[1] += offY * cellSize;
							var dx = (x - buff[0]);
							var dy = (y - buff[1]);
							dists[k]= dx * dx + dy * dy;
							k++;
						}
					}
				}
				raw [x + y * w] = dists.sort(function(a, b) { return a >= b; })[0];
			}
		}
	};

	var raise = function(raw) {
		// opts: offset dist
		var posx = Math.floor(w * Math.random());
		var posy = Math.floor(h * Math.random());
		var ang = Math.tan(Math.PI * (Math.random() - .5));
		var offset = Math.random() - .5;

		for (var i = 0; i < w; i++) {
			var start = Math.floor(Math.max(0, posy + ang * (i - posx)));
			for (var j = start; j < h; j++) {
				raw[i + j * w] += offset;
			}
		}
	};

	var hill = function(raw, count, rmin, rmax) {
		for (var i = 0; i < count; i++) {
			// opts: rmin, rmax: rdist
			var posx = Math.floor(w * Math.random());
			var posy = Math.floor(h * Math.random());
			var r = rmin + Math.random() * (rmax - rmin);
			var r2 = r * r;

			map2(raw, function(val, x, y) {
				var dx = x - posx;
				var dy = y - posy;
				var d2 = dx * dx + dy * dy;
				return val + (d2 <= r2? r2 - d2: 0);
			});
		}
	}

	var diamondsqr = function(arr) {
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


	// Postprocessing

	var warp = function(raw, warpAmt) {
		var alt = new Float32Array(raw.length);
		for (var x = 0; x < w; x++) {
			for (var y = 0; y < h; y++) {
				var qx = Math.floor(warpAmt * (fbm(x, y) + 1));
				var qy = Math.floor(warpAmt * (fbm(x + 4, y + 3) + 1));
				alt[x + y * w] = raw[(x + qx) % w + w * ((y + qy) % h)];
			}
		}
		raw.set(alt);
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
				octaveNoise(height);
			else if (mode === 'pn')
				perlin(height);
			else if (mode === 'wpn')
				warpedPerlin(height, ops.nativeWarp);
			else if (mode === 'rpn')
				ridgedPerlin(height);
			else if (mode === 'wn')
				worley(height);

			if (ops.postWarp > 0)
				warp(height, ops.postWarp);
			//cutoff(height, 0);

			display(height, context);
		},
		init: function() {
			smoothNoise = makeSmoothNoise();
			fbm = makeFBM();
			seed = Math.random();
			return this;
		}
	};


	// Export

	return noiseGenerator;
}());
