(function() {
	var mapEl = document.getElementById('map');
	var mapContext = mapEl.getContext('2d');
	var w = mapEl.width;
	var h = mapEl.height;
	var height = new Float32Array(w * h);
	var buff = new Float32Array(w * h);
	
	var randomize = function(arr) {
		for (var i = 0; i < arr.length; i++)
			arr[i] = Math.random();
		return arr;
	};
	
	var smooth = function(src, to, w, h) {
		for (var i = 1; i < w - 1; i++) {
			for (var j = 1; j < h - 1; j++) {
				var left = src[(i - 1) * h + j];
				var right = src[(i + 1) * h + j];
				var up = src[i * h + j + 1];
				var down = src[i * h + j - 1];
				to[i * h + j] = (left + right + up + down)/ 4;
			}
		}
	};
	
	var display = function(raw) {
		var mapPixels = mapContext.getImageData(0, 0, w, h);		
		for (var i = 0; i < w; i++) {
			for (var j = 0; j < h; j++) {
				var pos = h * i + j;
				var normH = Math.floor(255 * raw[pos]);
				mapPixels.data[4 * pos + 0] = normH;
				mapPixels.data[4 * pos + 1] = normH;
				mapPixels.data[4 * pos + 2] = normH;
				mapPixels.data[4 * pos + 3] = 255;
			}
		}
		mapContext.putImageData(mapPixels, 0, 0);
	};
	
	var stopFlag = false;
	var animate = function animate() {
		//randomize(height);
		smooth(height, buff, w, h);
		height.set(buff);
		display(height);
		if (!stopFlag)
			window.requestAnimationFrame(animate);
	};
	
	display(randomize(height));
	
	window.stop = function() {
		stopFlag = true;
	};
	window.run = function() {
		stopFlag = false;
		animate();
	};
}());