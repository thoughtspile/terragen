// array utils

var dist = function(a, b) {

}

var mod = function(base, by) {
	return ((base % by) + by) % by;
}

var map = function(arr, fn) {
	for (var i = 0; i < arr.length; i++) {
		arr[i] = fn(arr[i], i);
	}
	return arr;
};

var map2 = function(mat, fn) {
	for (var y = 0, pos = 0; y < mat.h; y++) {
		for (var x = 0; x < mat.w; x++, pos++) {
			mat[pos] = fn(mat[pos], x, y);
		}
	}
	return mat;
};

var fill = function(arr, val) {
	for (var i = 0; i < arr.length; i++) {
		arr[i] = val;
	}
	return arr;
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
	return [low, high];
}

var normalize = function(arr) {
	var rawRange = range(arr);
	for (var i = 0; i < arr.length; i++) {
		arr[i] = (arr[i] - rawRange[0]) / (rawRange[1] - rawRange[0]);
	}
	return arr;
}

var cutoff = function(raw, val) {
	for (var i = 0; i < raw.length; i++)
		if (raw[i] < val)
			raw[i] = val;
	return raw;
}

var white = function(arr) {
	for (var i = 0; i < arr.length; i++) {
		arr[i] = Math.random();
	}
	return arr;
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

var warpize = function(wrap, base, amt) {
	return function(x, y) {
		return base(x + wrap(x, y) * amt, y + wrap(x + 4, y + 3) * amt);
	}
}

module.exports = {
	octavize: octavize,
	mod: mod,
	warpize,
};
