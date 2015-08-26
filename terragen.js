var terragen = (function() {
	var h = 513;
	var w = 513;
	var height = new Float32Array(h * w);
	
	
	var randn = (function() {
		var buff = null;
		return function() {
			if (buff === null) {
				var u1 = Math.random();
				var u2 = Math.random();
				var s = Math.sqrt(-2 * Math.log(u1));
				buff = s * Math.cos(2 * Math.PI * u2);
				return s * Math.sin(2 * Math.PI * u2);
			} else {
				var temp = buff;
				buff = null;
				return temp;
			}
		};
	}());
				
	var range = function(arr) {
		var low = Infinity;
		var high= -Infinity;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] < low)
				low = arr[i];
			if (arr[i] > high)
				high = arr[i];
		}
		return {low: low, high: high};
	}
	
	var normalize = function(arr) {	
		var rawRange = range(arr);
		var low = rawRange.low;
		var high = rawRange.high;
		for (var i = 0; i < w * h; i++) {
			arr[i] = (arr[i] - low) / (high - low);
		}
		return arr;
	}
	
	var map = function(arr, fn) {
		for (var i = 0; i < arr.length; i++)
			arr[i] = fn(arr[i]);
	};
	
	var display = function(raw, context) {
		var mapPixels = context.getImageData(0, 0, w, h);	
		normalize(raw)
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
	
	var cutoff = function(raw, val) {
		for (var i = 0; i < w * h; i++)
			if (raw[i] < val)
				raw[i] = val;
		return raw;
	}

	var reset = function(raw) {
		for (var i = 0; i < raw.length; i++) {
			raw[i] = 0;
		}		
	};
	
	
	var octaveNoise = function(raw) {
		// opts: high, low, decay, ease
		var buff = new Float32Array(raw.length);
		for (var i = 0; i < buff.length; i++) {
			buff[i] = Math.random();
		}
		for (var step = 256; step >= 1; step /= 2) {
			for (var x = 0; x < w; x++) {
				for (var y = 0; y < h; y++) {
					var srcX = x / step;
					var srcY = y / step;
					var fracX = srcX - Math.floor(srcX);
					fracX = fracX * fracX * (3 - 2 * fracX);
					var fracY = srcY - Math.floor(srcY);
					fracY = fracY * fracY * (3 - 2 * fracY);
					var x1 = (Math.floor(srcX) + w) % w;
					var y1 = (Math.floor(srcY) + h) % h;
					var x2 = (x1 + w - 1) % w;
					var y2 = (y1 + h - 1) % h;
					
					raw[x + y * w] += 
						(fracX * fracY * buff[x1 + y1 * w] +
						fracX * (1 - fracY) * buff[x1 + y2 * w] +
						(1 - fracX) * fracY * buff[x2 + y1 * w] +
						(1 - fracX) * (1 - fracY) * buff[x2 + y2 * w]) * step / 64;
				}
			}
		}
	};
	
	var funNonperlin = function(raw) {
		// opts: high, low, decay, ease
		var gx = new Float32Array(raw.length);
		var gy = new Float32Array(raw.length);
		for (var i = 0; i < raw.length; i++) {
			gx[i] = Math.random();
			gy[i] = Math.random();
		}
		for (var step = 8; step >= 8; step /= 2) {
			for (var x = 0; x < w; x++) {
				for (var y = 0; y < h; y++) {
					var srcX = x / step;
					var srcY = y / step;
					var fracX = srcX - Math.floor(srcX);
					var fracY = srcY - Math.floor(srcY);
					var x1 = Math.floor(srcX);
					var y1 = Math.floor(srcY);
					var x2 = (x1 + 1) % w;
					var y2 = (y1 + 1) % h;
					
					var s = fracX * gx[x1 + y1 * w] +
						fracY * gy[x1 + y1 * w];
					var u = fracX * gx[x1 + y2 * w] +
						(1 - fracY) * gy[x1 + y2 * w];
					var t = (1 - fracX) * gx[x2 + y1 * w] +
						fracY * gy[x2 + y1 * w];
					var v = (1 - fracX) * gx[x2 + y2 * w] +
						(1 - fracY) * gy[x2 + y2 * w];
						
					var easeX = fracX * fracX * (3 - 2 * fracX);
					var easeY = fracY * fracY * (3 - 2 * fracY);
					var a = s + easeX * (t - s);
					var b = u + easeX * (v - u);
					raw[x + y * w] += a + easeY * (b - a);
				}
			}
		}
	};
	
	var perlin = function(raw) {
		// opts: high, low, decay, ease
		var grads = 100;
		var gx = new Float32Array(grads);
		var gy = new Float32Array(grads);
		for (var i = 0; i < grads; i++) {
			var dir = 2 * Math.PI * (Math.random());
			gx[i] = Math.cos(dir);
			gy[i] = Math.sin(dir);
		}
		var perms = Math.max(w, h);
		var perm = new Float32Array(2 * perms);
		for (var i = 0; i < perm.length; i++) {
			perm[i] = Math.floor(perms * Math.random());
		}
		var permute = function(x, y) {
			return perm[x + perm[y]] % grads;
		}
		
		for (var step = 256; step >= 1; step /= 2) {
			for (var x = 0; x < w; x++) {
				for (var y = 0; y < h; y++) {
					var srcX = x / step;
					var srcY = y / step;
					var x1 = Math.floor(srcX);
					var y1 = Math.floor(srcY);
					var dx = srcX - x1;
					var dy = srcY - y1;
					var x2 = (x1 + 1) % w;
					var y2 = (y1 + 1) % h;
										
					var s = dx * gx[permute(x1, y1)] +
						dy * gy[permute(x1, y1)];
					var u = dx * gx[permute(x1, y2)] +
						(dy - 1) * gy[permute(x1, y2)];
					var t = (dx - 1) * gx[permute(x2, y1)] +
						dy * gy[permute(x2, y1)];
					var v = (dx - 1) * gx[permute(x2, y2)] +
						(dy - 1) * gy[permute(x2, y2)];
						
					var easeX = dx * dx * (3 - 2 * dx);
					var easeY = dy * dy * (3 - 2 * dy);
					var a = s + easeX * (t - s);
					var b = u + easeX * (v - u);
					raw[x + y * w] += (a + easeY * (b - a)) * step / 64;
				}
			}
		}
	};
		
	var worley = function(raw) {
		var cellSize = 32;
		var cellCount = Math.floor(w / cellSize);
		var ptsPerCell = 1;
		var cellPts = [];
		for (var i = 0; i < cellCount; i++) {
			cellPts[i] = [];
			for (var j = 0; j < cellCount; j++) {
				cellPts[i][j] = [];
				for (var k = 0; k < ptsPerCell; k++) {
					cellPts[i][j][k] = [
						i * cellSize + Math.floor(Math.random() * cellSize), 
						j * cellSize + Math.floor(Math.random() * cellSize)];
				}
			}
		}
		console.log(cellPts);
		for (var x = 0; x < w; x++) {
			for (var y = 0; y < h; y++) {
				var cellX = Math.floor(x / cellSize);
				var cellY = Math.floor(y / cellSize);
				
				var dists = [];
				for (var offX = (cellX == 0? cellX: cellX - 1); offX <= cellX + 1 && offX < cellCount; offX++) {
					for (var offY = (cellY == 0? cellY: cellY - 1); offY <= cellY + 1 && offY < cellCount; offY++) {
						var cell = cellPts[offX][offY];
						for (var i = 0; i < cell.length; i++) {
							var dx = (x - cell[i][0]);
							var dy = (y - cell[i][1]);
							dists.push(dx * dx + dy * dy);
						}
					}
				}
				raw [x + y * w] = Math.min.apply(null, dists);
			}
		}
	};
	
	var worleyFuckedupMetric = function(raw) {
		var cellSize = 32;
		var cellCount = Math.floor(w / cellSize);
		var ptsPerCell = 1;
		var cellPts = [];
		for (var i = 0; i < cellCount; i++) {
			cellPts[i] = [];
			for (var j = 0; j < cellCount; j++) {
				cellPts[i][j] = [];
				for (var k = 0; k < ptsPerCell; k++) {
					cellPts[i][j][k] = [
						i * cellSize + Math.floor(Math.random() * cellSize), 
						j * cellSize + Math.floor(Math.random() * cellSize)];
				}
			}
		}
		console.log(cellPts);
		for (var x = 0; x < w; x++) {
			for (var y = 0; y < h; y++) {
				var cellX = Math.floor(x / cellSize);
				var cellY = Math.floor(y / cellSize);
				
				for (var offX = (cellX == 0? cellX: cellX - 1); offX <= cellX + 1 && offX < cellCount; offX++) {
					for (var offY = (cellY == 0? cellY: cellY - 1); offY <= cellY + 1 && offY < cellCount; offY++) {
						var cell = cellPts[offX][offY];
						for (var i = 0; i < cell.length; i++) {
							var dx = (x - cell[i][0]);
							var dy = (y - cell[i][1]);
							var d = dx * dx + dy + dy;
							if (raw[x + y * w] > d)
								raw [x + y * w] = d;
						}
					}
				}
			}
		}
	};
		
	var improvedPerlin = function(raw) {
		// opts: high, low, decay, ease
		var gx = new Float32Array(raw.length);
		var gy = new Float32Array(raw.length);
		for (var i = 0; i < raw.length; i++) {
			var dir = 2 * Math.PI * (Math.random());
			gx[i] = Math.cos(dir);
			gy[i] = Math.sin(dir);	
		}
		for (var step = 256; step >= 1; step /= 2) {
			for (var x = 0; x < w; x++) {
				for (var y = 0; y < h; y++) {
					var srcX = x / step;
					var srcY = y / step;
					var x1 = Math.floor(srcX);
					var y1 = Math.floor(srcY);
					var dx = srcX - x1;
					var dy = srcY - y1;
					var x2 = (x1 + 1) % w;
					var y2 = (y1 + 1) % h;
					
					
					var s = dx * gx[x1 + y1 * w] +
						dy * gy[x1 + y1 * w];
					var u = dx * gx[x1 + y2 * w] +
						(dy - 1) * gy[x1 + y2 * w];
					var t = (dx - 1) * gx[x2 + y1 * w] +
						dy * gy[x2 + y1 * w];
					var v = (dx - 1) * gx[x2 + y2 * w] +
						(dy - 1) * gy[x2 + y2 * w];
						
					var easeX = dx * dx * (3 - 2 * dx);
					var easeY = dy * dy * (3 - 2 * dy);
					var a = s + easeX * (t - s);
					var b = u + easeX * (v - u);
					raw[x + y * w] += (a + easeY * (b - a)) * step / 64;
				}
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
			for (var j = 0; j < h; j++) {
				if (ang * (i - posx) <= j - posy)
					raw[i + j * w] += offset;
			}
		}
	};
		
	var hill = function(raw, rmin, rmax) {
		// opts: rmin, rmax: rdist
		var posx = Math.floor(w * Math.random());
		var posy = Math.floor(h * Math.random());
		var r = rmin + Math.random() * (rmax - rmin);
		var r2 = r * r;
		
		for (var i = 0; i < w; i++) {
			for (var j = 0; j < h; j++) {
				var dx = i - posx;
				var dy = j - posy;
				var d2 = dx * dx + dy * dy;
				if (d2 <= r2)
					raw[i + j * w] += r2 - d2;
			}
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

	
	var bind = function(mapEl) {
		
	};
	
	var gen = function(mode, count, context) {
		reset(height);
		if (mode === 'fl')
			for (var i = 0; i < count; i++)
				raise(height, 3);
		else if (mode === 'hr')
			for (var i = 0; i < count; i++)
				hill(height, 3, 80);
		else if (mode === 'ds')
			diamondsqr(height);
		else if (mode === 'on')
			octaveNoise(height);
		else if (mode === 'pn')
			perlin(height);
		else if (mode === 'ipn')
			improvedPerlin(height);
		else if (mode === 'wn')
			worley(height);
		//cutoff(height, 0);
		//map(height, function(x) { return x * x * x; });
		display(height, context);
	};
	
	
	return {
		bind: bind,
		run: gen
	};
}());


(function() {
	var modeEl = document.getElementById('mode');
	var iterEl = document.getElementById('iter');
	var runBtn = document.getElementById('run');
	var mapEl = document.getElementById('map');
	var mapContext = mapEl.getContext('2d');
	var w = 513;
	var h = 513;
	mapEl.width = w;
	mapEl.height = h;
	
	runBtn.addEventListener('click', function() {
		terragen.run(modeEl.value, parseInt(iterEl.value), mapContext);
	});
	modeEl.addEventListener('change', function() {
		iterEl.disabled = (['ds', 'on', 'pn'].indexOf(modeEl.value) !== -1);
	});
}());