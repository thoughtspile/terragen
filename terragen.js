(function() {
	var mapEl = document.getElementById('map');
	var mapContext = mapEl.getContext('2d');
	var w = mapEl.width;
	var h = mapEl.height;
	var mapPixels = mapContext.getImageData(0, 0, w, h);
	
	var randi = function() {
		return Math.floor(Math.random() * 255);
	};
	
	var randomize = function() {
		for (var i = 0; i < w; i++) {
			for (var j = 0; j < h; j++) {
				mapPixels.data[4 * (w * j + i) + 0] = randi();
				mapPixels.data[4 * (w * j + i) + 1] = randi();
				mapPixels.data[4 * (w * j + i) + 2] = randi();
				mapPixels.data[4 * (w * j + i) + 3] = 255;
			}
		}
		mapContext.putImageData(mapPixels, 0, 0);
	};
	
	var stopFlag = false;
	var animate = function animate() {
		randomize();
		if (!stopFlag)
			window.requestAnimationFrame(animate);
	};
	
	window.stop = function() {
		stopFlag = true;
	};
	window.run = function() {
		animate();
	};
}());