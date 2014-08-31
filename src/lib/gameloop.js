var gameloop = (function () {
    'use strict';
    var reqAnimFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };

    return function (callback) {
        var lastUpdate = +new Date();
        (function loop() {
            callback(((+new Date()) - lastUpdate) / 1000);
            reqAnimFrame(loop);
            lastUpdate = +new Date();
        }());
    };
}());
