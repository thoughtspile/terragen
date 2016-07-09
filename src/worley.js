
var worley = function(raw) {
	var w = raw.w;
	var h = raw.h;
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
