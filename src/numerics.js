// Numeric utils

var frac = function (x) {
	return x - Math.floor(x);
};

var ease = {
	linear: function (x) { return x; },
	cubic: function (x) { return x * x * (3 - 2 * x); }
};

var lerp = function (start, end, amt) {
	return start + amt * (end - start);
};

var dot2 = function (a1, a2, b1, b2) {
	return a1 * b1 + a2 * b2;
};

module.exports = {
	dot2: dot2,
	ease: ease,
	lerp: lerp
};
