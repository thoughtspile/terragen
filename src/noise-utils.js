var utils = require('./utils');
var num = require('./numerics');

var makePerm2 = function (nPerm, target) {
    var perm = new Float32Array(2 * nPerm);
    for (var i = 0; i < perm.length; i++) {
        perm[i] = Math.floor(nPerm * Math.random());
    }

    return function(x, y) {
        return perm[utils.mod(x + perm[utils.mod(y, nPerm)], nPerm)] % target;
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
    var permute = makePerm2(100, grads);

    var bm = function(srcX, srcY) {
        var x1 = Math.floor(srcX);
        var y1 = Math.floor(srcY);
        var dx = srcX - x1;
        var dy = srcY - y1;
        var x2 = x1 + 1;
        var y2 = y1 + 1;

        var i11 = permute(x1, y1);
        var i12 = permute(x1, y2);
        var i21 = permute(x2, y1);
        var i22 = permute(x2, y2);

        var s = num.dot2(dx, dy, gx[i11], gy[i11]);
        var u = num.dot2(dx, dy - 1, gx[i12], gy[i12]);
        var t = num.dot2(dx - 1, dy, gx[i21], gy[i21]);
        var v = num.dot2(dx - 1, dy - 1, gx[i22], gy[i22]);

        var easeX = num.ease.cubic(dx);
        var easeY = num.ease.cubic(dy);
        return num.lerp(num.lerp(s, t, easeX), num.lerp(u, v, easeX), easeY);
    }

    var octBM = utils.octavize(bm);

    return function(x, y) {
        return octBM(x, y);
    }
};

var makeSmoothNoise = function() {
    return function (srcX, srcY) {
        var fracX = num.ease.cubic(frac(srcX));
        var fracY = num.ease.cubic(frac(srcY));
        var x1 = Math.floor(srcX);
        var y1 = Math.floor(srcY);
        var x2 = (x1 + w - 1) % w;
        var y2 = (y1 + h - 1) % h;

        return num.lerp(
            num.lerp(buff[x2 + y2 * w], buff[x1 + y2 * w], fracX),
            num.lerp(buff[x2 + y1 * w], buff[x1 + y1 * w], fracX),
            fracY
        );
    };
};

module.exports = makeFBM;
