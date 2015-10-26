var display = function(raw, context, channel) {
	var mapPixels = context.getImageData(0, 0, raw.w, raw.h);
	normalize(raw);
	for (var i = 0; i < raw.length; i++) {
		var normH = Math.floor(255 * raw[i]);
		var pos = 4 * i;
		mapPixels.data[pos + channel] = normH;
		//mapPixels.data[pos + 1] = normH;
		//mapPixels.data[pos + 2] = normH;
		mapPixels.data[pos + 3] = 255;
	}
	context.putImageData(mapPixels, 0, 0);
};
