(function() {
	var mapEl = document.getElementById('map');
	var mapContext = mapEl.getContext('2d');
	var w = 257;
	var h = 257;
	mapEl.width = w;
	mapEl.height = h;
	var height = new Float32Array(w * h);
	var buff = new Float32Array(w * h);
	
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
		
	var smooth = function(src, to, w, h) {
		for (var i = 0; i < w; i++) {
			for (var j = 0; j < h; j++) {
				var left = src[(i == 0? w - 1: i - 1) * h + j];
				var right = src[(i == w - 1? 0: i + 1) % w * h + j];
				var up = src[i * h + (j == h - 1? 0: j + 1)];
				var down = src[i * h + (j == 0? h - 1: j - 1)];
				to[i * h + j] = (left + right + up + down)/ 4;
			}
		}
	};
		
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
	
	var display = function(raw) {
		var mapPixels = mapContext.getImageData(0, 0, w, h);	
		normalize(raw)
		for (var i = 0; i < w * h; i++) {
			var normH = Math.floor(255 * raw[i]);
			var pos = 4 * i;
			mapPixels.data[pos + 0] = normH;
			mapPixels.data[pos + 1] = normH;
			mapPixels.data[pos + 2] = normH;
			mapPixels.data[pos + 3] = 255;
		}
		mapContext.putImageData(mapPixels, 0, 0);
	};
		
	var raise = function(raw) {
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
	
	var cutoff = function(raw, val) {
		for (var i = 0; i < w * h; i++)
			if (raw[i] < val)
				raw[i] = val;
		return raw;
	}
	
	var hill = function(raw, rmin, rmax) {
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
	
	window.gen = function(mode, count) {
		if (mode === 'fl')
			for (var i = 0; i < count; i++)
				raise(height, 3);
		else if (mode === 'hr')
			for (var i = 0; i < count; i++)
				hill(height, 3, 80);
		else if (mode === 'ds')
			diamondsqr(height);
		//cutoff(height, 0);
		//map(height, function(x) { return x * x * x; });
		display(height);
	};
	
	document.getElementById('run').addEventListener('click', function() {
		gen(document.getElementById('mode').value, 2000);
	});
	
	var stopFlag = false;
	var decay = 1;
	var tol = .1;
	var animate = function animate() {
		//randomize(height);
		smooth(height, buff, w, h);
		height.set(buff);
		randomize(buff, function() {return Math.random() - .3; });
		for (var i = 0; i < w * h; i++)
			height[i] = height[i] + buff[i] * decay;
		decay *= .99;
		if (decay < tol)
			stop();
		plot(height);
		if (!stopFlag)
			window.requestAnimationFrame(animate);
	};
	
	window.stop = function() {
		stopFlag = true;
	};
	window.run = function() {
		stopFlag = false;
		animate();
	};
}());