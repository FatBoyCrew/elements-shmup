(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var raf = require('./raf');
var rand = require('./rng')();
var kd = require('./keydrown');

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

var colors = [
  '#0074D9', '#2ECC40', '#FF4136', '#FFDC00'
];

var background;
var player;

var reset = function () {
  background = [];

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      background.push({
        x: i * canvas.width / 3,
        y: j * canvas.height / 3,
        width: canvas.width / 3,
        height: canvas.height / 3,
        color: rand.pick(colors)
      });
    }
  }

  player = {
    x: canvas.width/2,
    y: rand.int(canvas.height / 2),
    radius: rand.range(50, 60),
    dx: rand.range(-100, 100),
    dy: 0,
    color: rand.pick(colors)
  };
};

reset();

raf.start(function (elapsed) {
  kd.tick();

  // Clear the screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  background.forEach(function (bg) {
    ctx.fillStyle = bg.color;
    ctx.fillRect(bg.x, bg.y, bg.width, bg.height);
  });

  // Gravity
  // player.dy += elapsed * 1500;

  // Handle collision against the canvas's edges
  if (player.x - player.radius < 0 && player.dx < 0 || player.x + player.radius > canvas.width && player.dx > 0) player.dx = -player.dx * 0.7;
  if (player.y - player.radius < 0 && player.dy < 0 || player.y +  player.radius > canvas.height && player.dy > 0) player.dy = -player.dy * 0.7;

  // Update player position
  player.x += player.dx * elapsed;
  player.y += player.dy * elapsed;

  // Render the player
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = player.color;
  ctx.fill();
});

kd.SPACE.down(function () {
  console.log('SPACE');

  player.color = rand.pick(colors);
});

kd.UP.down(function () {
  console.log('UP');
  player.dy -= 20;
});

kd.DOWN.down(function () {
  console.log('DOWN');
  player.dy += 20;
});

kd.LEFT.down(function () {
  console.log('LEFT');
  player.dx -= 20;
});

kd.RIGHT.down(function () {
  console.log('RIGHT');
  player.dx += 50;
});

kd.ESC.down(function () {
  console.log('ESC');
  reset();
});

},{"./keydrown":2,"./raf":3,"./rng":4}],2:[function(require,module,exports){
/*! keydrown - v1.1.0 - 2014-02-15 - http://jeremyckahn.github.com/keydrown */
;(function (window) {

var util = (function () {

  var util = {};

  /**
   * @param {Object} obj The Object to iterate through.
   * @param {function(*, string)} iterator The function to call for each property.
   */
  util.forEach = function (obj, iterator) {
    var prop;
    for (prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        iterator(obj[prop], prop);
      }
    }
  };
  var forEach = util.forEach;


  /**
   * Create a transposed copy of an Object.
   *
   * @param {Object} obj
   * @return {Object}
   */
  util.getTranspose = function (obj) {
    var transpose = {};

    forEach(obj, function (val, key) {
      transpose[val] = key;
    });

    return transpose;
  };


  /**
   * Implementation of Array#indexOf because IE<9 doesn't support it.
   *
   * @param {Array} arr
   * @param {*} val
   * @return {number} Index of the found element or -1 if not found.
   */
  util.indexOf = function (arr, val) {
    if (arr.indexOf) {
      return arr.indexOf(val);
    }

    var i, len = arr.length;
    for (i = 0; i < len; i++) {
      if (arr[i] === val) {
        return i;
      }
    }

    return -1;
  };
  var indexOf = util.indexOf;


  /**
   * Push a value onto an array if it is not present in the array already.  Otherwise, this is a no-op.
   *
   * @param {Array} arr
   * @param {*} val
   * @return {boolean} Whether or not the value was added to the array.
   */
  util.pushUnique = function (arr, val) {
    if (indexOf(arr, val) === -1) {
      arr.push(val);
      return true;
    }

    return false;
  };


  /**
   * Remove a value from an array.  Assumes there is only one instance of the value present in the array.
   *
   * @param {Array} arr
   * @param {*} val
   * @return {*} The value that was removed from arr.  Returns undefined if nothing was removed.
   */
  util.removeValue = function (arr, val) {
    var index = indexOf(arr, val);

    if (index !== -1) {
      return arr.splice(index, 1)[0];
    }
  };


  /**
   * Cross-browser function for listening for and handling an event on the document element.
   *
   * @param {string} eventName
   * @param {function} handler
   */
  util.documentOn = function (eventName, handler) {
    if (window.addEventListener) {
      window.addEventListener(eventName, handler, false);
    } else if (document.attachEvent) {
      document.attachEvent('on' + eventName, handler);
    }
  };


  /**
   * Shim for requestAnimationFrame.  See: http://paulirish.com/2011/requestanimationframe-for-smart-animating/
   */
  util.requestAnimationFrame = (function () {
    return window.requestAnimationFrame  ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      function( callback ){
        window.setTimeout(callback, 1000 / 60);
      };
  })();


  /**
   * An empty function.  NOOP!
   */
  util.noop = function () {};

  return util;

}());

/**
 * Lookup table of keys to keyCodes.
 *
 * @type {Object.<number>}
 */
var KEY_MAP = {
  'A': 65
  ,'B': 66
  ,'C': 67
  ,'D': 68
  ,'E': 69
  ,'F': 70
  ,'G': 71
  ,'H': 72
  ,'I': 73
  ,'J': 74
  ,'K': 75
  ,'L': 76
  ,'M': 77
  ,'N': 78
  ,'O': 79
  ,'P': 80
  ,'Q': 81
  ,'R': 82
  ,'S': 83
  ,'T': 84
  ,'U': 85
  ,'V': 86
  ,'W': 87
  ,'X': 88
  ,'Y': 89
  ,'Z': 90
  ,'ENTER': 13
  ,'ESC': 27
  ,'SPACE': 32
  ,'LEFT': 37
  ,'UP': 38
  ,'RIGHT': 39
  ,'DOWN': 40
};


/**
 * The transposed version of KEY_MAP.
 *
 * @type {Object.<string>}
 */
var TRANSPOSED_KEY_MAP = util.getTranspose(KEY_MAP);

/*!
 * @type Array.<string>
 */
var keysDown = [];

var Key = (function () {

  'use strict';

  /**
   * Represents a key on the keyboard.  You'll never actually call this method directly; Key Objects for every key that Keydrown supports are created for you when the library is initialized (as in, when the file is loaded).  You will, however, use the `prototype` methods below to bind functions to key states.
   *
   * @param {number} keyCode The keyCode of the key.
   * @constructor
   */
  function Key (keyCode) {
    this.keyCode = keyCode;
  }


  /*!
   * The function to be invoked on every tick that the key is held down for.
   *
   * @type {function}
   */
  Key.prototype._downHandler = util.noop;


  /*!
   * The function to be invoked when the key is released.
   *
   * @type {function}
   */
  Key.prototype._upHandler = util.noop;


  /*!
   * The function to be invoked when the key is pressed.
   *
   * @type {function}
   */
  Key.prototype._pressHandler = util.noop;


  /*!
   * Private helper function that binds or invokes a hander for `down`, `up', or `press` for a `Key`.
   *
   * @param {Key} key
   * @param {string} handlerName
   * @param {function=} opt_handler If omitted, the handler is invoked.
   */
  function bindOrFire (key, handlerName, opt_handler) {
    if (opt_handler) {
      key[handlerName] = opt_handler;
    } else {
      key[handlerName]();
    }
  }


  /**
   * Returns whether the key is currently pressed or not.
   *
   * @return {boolean} True if the key is down, otherwise false.
   */
  Key.prototype.isDown = function () {
    return util.indexOf(keysDown, this.keyCode) !== -1;
  };


  /**
   * Bind a function to be called when the key is held down.
   *
   * @param {function=} opt_handler The function to be called when the key is held down.  If omitted, this function invokes whatever handler was previously bound.
   */
  Key.prototype.down = function (opt_handler) {
    bindOrFire(this, '_downHandler', opt_handler);
  };


  /**
   * Bind a function to be called when the key is released.
   *
   * @param {function=} opt_handler The function to be called when the key is released.  If omitted, this function invokes whatever handler was previously bound.
   */
  Key.prototype.up = function (opt_handler) {
    bindOrFire(this, '_upHandler', opt_handler);
  };


  /**
   * Bind a function to be called when the key is pressed.  This handler will not fire again until the key is released — it does not repeat.
   *
   * @param {function=} opt_handler The function to be called once when the key is pressed.  If omitted, this function invokes whatever handler was previously bound.
   */
  Key.prototype.press = function (opt_handler) {
    bindOrFire(this, '_pressHandler', opt_handler);
  };


  /**
   * Remove the handler that was bound with [`kd.Key#down`](#down).
   */
  Key.prototype.unbindDown = function () {
    this._downHandler = util.noop;
  };


  /**
   * Remove the handler that was bound with [`kd.Key#up`](#up).
   */
  Key.prototype.unbindUp = function () {
    this._upHandler = util.noop;
  };


  /**
   * Remove the handler that was bound with [`kd.Key#press`](#press).
   */
  Key.prototype.unbindPress = function () {
    this._pressHandler = util.noop;
  };

  return Key;

}());

var kd = (function (keysDown) {

  'use strict';

  var kd = {};
  kd.Key = Key;

  var isRunning = false;


  /**
   * Evaluate which keys are held down and invoke their handler functions.
   */
  kd.tick = function () {
    var i, len = keysDown.length;
    for (i = 0; i < len; i++) {
      var keyCode = keysDown[i];

      var keyName = TRANSPOSED_KEY_MAP[keyCode];
      if (keyName) {
        kd[keyName].down();
      }
    }
  };


  /**
   * A basic run loop.  `handler` gets called approximately 60 times a second.
   *
   * @param {function} handler The function to call on every tick.  You almost certainly want to call `kd.tick` in this function.
   */
  kd.run = function (handler) {
    isRunning = true;

    util.requestAnimationFrame.call(window, function () {
      if (!isRunning) {
        return;
      }

      kd.run(handler);
      handler();
    });
  };


  /**
   * Cancels the loop created by [`kd.run`](#run).
   */
  kd.stop = function () {
    isRunning = false;
  };


  // SETUP
  //


  // Initialize the KEY Objects
  util.forEach(KEY_MAP, function (keyCode, keyName) {
    kd[keyName] = new Key(keyCode);
  });

  util.documentOn('keydown', function (evt) {
    var keyCode = evt.keyCode;
    var keyName = TRANSPOSED_KEY_MAP[keyCode];
    var isNew = util.pushUnique(keysDown, keyCode);

    if (isNew && kd[keyName]) {
      kd[keyName].press();
    }
  });

  util.documentOn('keyup', function (evt) {
    var keyCode = util.removeValue(keysDown, evt.keyCode);

    var keyName = TRANSPOSED_KEY_MAP[keyCode];
    if (keyName) {
      kd[keyName].up();
    }
  });

  // Stop firing the "down" handlers if the user loses focus of the browser
  // window.
  util.documentOn('blur', function (evt) {
    keysDown.length = 0;
  });


  return kd;

/*!
 * The variables passed into the closure here are defined in kd.key.js.
 */ /*!*/
}(keysDown));

if (typeof module === "object" && typeof module.exports === "object") {
  // Keydrown was loaded as a CommonJS module (by Browserify, for example).
  module.exports = kd;
} else if (typeof define === "function" && define.amd) {
  // Keydrown was loaded as an AMD module.
  define(function () {
    return kd;
  });
} else {
  window.kd = kd;
}

} (window));

},{}],3:[function(require,module,exports){
// Holds last iteration timestamp.
var time = 0;

/**
 * Calls `fn` on next frame.
 *
 * @param  {Function} fn The function
 * @return {int} The request ID
 * @api private
 */
function raf(fn) {
  return window.requestAnimationFrame(function() {
    var now = Date.now();
    var elapsed = now - time;

    if (elapsed > 999) {
      elapsed = 1 / 60;
    } else {
      elapsed /= 1000;
    }

    time = now;
    fn(elapsed);
  });
}

module.exports = {
  /**
   * Calls `fn` on every frame with `elapsed` set to the elapsed
   * time in milliseconds.
   *
   * @param  {Function} fn The function
   * @return {int} The request ID
   * @api public
   */
  start: function(fn) {
    return raf(function tick(elapsed) {
      fn(elapsed);
      raf(tick);
    });
  },
  /**
   * Cancels the specified animation frame request.
   *
   * @param {int} id The request ID
   * @api public
   */
  stop: function(id) {
    window.cancelAnimationFrame(id);
  }
};

},{}],4:[function(require,module,exports){
module.exports = function(seed) {
  var random = whrandom(seed);
  var rng = {
    /**
     * Return an integer within [0, max).
     *
     * @param  {int} [max]
     * @return {int}
     * @api public
     */
    int: function(max) {
      return random() * (max || 0xfffffff) | 0;
    },
    /**
     * Return a float within [0.0, 1.0).
     *
     * @return {float}
     * @api public
     */
    float: function() {
      return random();
    },
    /**
     * Return a boolean.
     *
     * @return {Boolean}
     * @api public
     */
    bool: function() {
      return random() > 0.5;
    },
    /**
     * Return an integer within [min, max).
     *
     * @param  {int} min
     * @param  {int} max
     * @return {int}
     * @api public
     */
    range: function(min, max) {
      return rng.int(max - min) + min;
    },
    /**
     * Pick an element from the source.
     *
     * @param  {mixed[]} source
     * @return {mixed}
     * @api public
     */
    pick: function(source) {
      return source[rng.range(0, source.length)];
    }
  };

  return rng;
};

/**
 * Generate a seeded random number using Python's whrandom implementation.
 * See https://github.com/ianb/whrandom for more information.
 *
 * @param  {int} [seed]
 * @return {Function}
 * @api private
 */
function whrandom(seed) {
  if (!seed) {
    seed = Date.now();
  }

  var x = (seed % 30268) + 1;
  seed = (seed - (seed % 30268)) / 30268;
  var y = (seed % 30306) + 1;
  seed = (seed - (seed % 30306)) / 30306;
  var z = (seed % 30322) + 1;
  seed = (seed - (seed % 30322)) / 30322;

  return function() {
    x = (171 * x) % 30269;
    y = (172 * y) % 30307;
    z = (170 * z) % 30323;
    return (x / 30269.0 + y / 30307.0 + z / 30323.0) % 1.0;
  };
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy93aWxsL1Byb2plY3RzL0ZhdEJveUNyZXcvZWxlbWVudHMtc2htdXAvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi4vc3JjL21haW4iLCIvVXNlcnMvd2lsbC9Qcm9qZWN0cy9GYXRCb3lDcmV3L2VsZW1lbnRzLXNobXVwL3NyYy9rZXlkcm93bi5qcyIsIi9Vc2Vycy93aWxsL1Byb2plY3RzL0ZhdEJveUNyZXcvZWxlbWVudHMtc2htdXAvc3JjL3JhZi5qcyIsIi9Vc2Vycy93aWxsL1Byb2plY3RzL0ZhdEJveUNyZXcvZWxlbWVudHMtc2htdXAvc3JjL3JuZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcmFmID0gcmVxdWlyZSgnLi9yYWYnKTtcbnZhciByYW5kID0gcmVxdWlyZSgnLi9ybmcnKSgpO1xudmFyIGtkID0gcmVxdWlyZSgnLi9rZXlkcm93bicpO1xuXG52YXIgY2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2dhbWUnKTtcbnZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxudmFyIGNvbG9ycyA9IFtcbiAgJyMwMDc0RDknLCAnIzJFQ0M0MCcsICcjRkY0MTM2JywgJyNGRkRDMDAnXG5dO1xuXG52YXIgYmFja2dyb3VuZDtcbnZhciBwbGF5ZXI7XG5cbnZhciByZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgYmFja2dyb3VuZCA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgIGJhY2tncm91bmQucHVzaCh7XG4gICAgICAgIHg6IGkgKiBjYW52YXMud2lkdGggLyAzLFxuICAgICAgICB5OiBqICogY2FudmFzLmhlaWdodCAvIDMsXG4gICAgICAgIHdpZHRoOiBjYW52YXMud2lkdGggLyAzLFxuICAgICAgICBoZWlnaHQ6IGNhbnZhcy5oZWlnaHQgLyAzLFxuICAgICAgICBjb2xvcjogcmFuZC5waWNrKGNvbG9ycylcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHBsYXllciA9IHtcbiAgICB4OiBjYW52YXMud2lkdGgvMixcbiAgICB5OiByYW5kLmludChjYW52YXMuaGVpZ2h0IC8gMiksXG4gICAgcmFkaXVzOiByYW5kLnJhbmdlKDUwLCA2MCksXG4gICAgZHg6IHJhbmQucmFuZ2UoLTEwMCwgMTAwKSxcbiAgICBkeTogMCxcbiAgICBjb2xvcjogcmFuZC5waWNrKGNvbG9ycylcbiAgfTtcbn07XG5cbnJlc2V0KCk7XG5cbnJhZi5zdGFydChmdW5jdGlvbiAoZWxhcHNlZCkge1xuICBrZC50aWNrKCk7XG5cbiAgLy8gQ2xlYXIgdGhlIHNjcmVlblxuICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cbiAgYmFja2dyb3VuZC5mb3JFYWNoKGZ1bmN0aW9uIChiZykge1xuICAgIGN0eC5maWxsU3R5bGUgPSBiZy5jb2xvcjtcbiAgICBjdHguZmlsbFJlY3QoYmcueCwgYmcueSwgYmcud2lkdGgsIGJnLmhlaWdodCk7XG4gIH0pO1xuXG4gIC8vIEdyYXZpdHlcbiAgLy8gcGxheWVyLmR5ICs9IGVsYXBzZWQgKiAxNTAwO1xuXG4gIC8vIEhhbmRsZSBjb2xsaXNpb24gYWdhaW5zdCB0aGUgY2FudmFzJ3MgZWRnZXNcbiAgaWYgKHBsYXllci54IC0gcGxheWVyLnJhZGl1cyA8IDAgJiYgcGxheWVyLmR4IDwgMCB8fCBwbGF5ZXIueCArIHBsYXllci5yYWRpdXMgPiBjYW52YXMud2lkdGggJiYgcGxheWVyLmR4ID4gMCkgcGxheWVyLmR4ID0gLXBsYXllci5keCAqIDAuNztcbiAgaWYgKHBsYXllci55IC0gcGxheWVyLnJhZGl1cyA8IDAgJiYgcGxheWVyLmR5IDwgMCB8fCBwbGF5ZXIueSArICBwbGF5ZXIucmFkaXVzID4gY2FudmFzLmhlaWdodCAmJiBwbGF5ZXIuZHkgPiAwKSBwbGF5ZXIuZHkgPSAtcGxheWVyLmR5ICogMC43O1xuXG4gIC8vIFVwZGF0ZSBwbGF5ZXIgcG9zaXRpb25cbiAgcGxheWVyLnggKz0gcGxheWVyLmR4ICogZWxhcHNlZDtcbiAgcGxheWVyLnkgKz0gcGxheWVyLmR5ICogZWxhcHNlZDtcblxuICAvLyBSZW5kZXIgdGhlIHBsYXllclxuICBjdHguYmVnaW5QYXRoKCk7XG4gIGN0eC5hcmMocGxheWVyLngsIHBsYXllci55LCBwbGF5ZXIucmFkaXVzLCAwLCBNYXRoLlBJICogMiwgdHJ1ZSk7XG4gIGN0eC5jbG9zZVBhdGgoKTtcbiAgY3R4LmZpbGxTdHlsZSA9IHBsYXllci5jb2xvcjtcbiAgY3R4LmZpbGwoKTtcbn0pO1xuXG5rZC5TUEFDRS5kb3duKGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ1NQQUNFJyk7XG5cbiAgcGxheWVyLmNvbG9yID0gcmFuZC5waWNrKGNvbG9ycyk7XG59KTtcblxua2QuVVAuZG93bihmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdVUCcpO1xuICBwbGF5ZXIuZHkgLT0gMjA7XG59KTtcblxua2QuRE9XTi5kb3duKGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ0RPV04nKTtcbiAgcGxheWVyLmR5ICs9IDIwO1xufSk7XG5cbmtkLkxFRlQuZG93bihmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdMRUZUJyk7XG4gIHBsYXllci5keCAtPSAyMDtcbn0pO1xuXG5rZC5SSUdIVC5kb3duKGZ1bmN0aW9uICgpIHtcbiAgY29uc29sZS5sb2coJ1JJR0hUJyk7XG4gIHBsYXllci5keCArPSA1MDtcbn0pO1xuXG5rZC5FU0MuZG93bihmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKCdFU0MnKTtcbiAgcmVzZXQoKTtcbn0pO1xuIiwiLyohIGtleWRyb3duIC0gdjEuMS4wIC0gMjAxNC0wMi0xNSAtIGh0dHA6Ly9qZXJlbXlja2Fobi5naXRodWIuY29tL2tleWRyb3duICovXG47KGZ1bmN0aW9uICh3aW5kb3cpIHtcblxudmFyIHV0aWwgPSAoZnVuY3Rpb24gKCkge1xuXG4gIHZhciB1dGlsID0ge307XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIE9iamVjdCB0byBpdGVyYXRlIHRocm91Z2guXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24oKiwgc3RyaW5nKX0gaXRlcmF0b3IgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgZm9yIGVhY2ggcHJvcGVydHkuXG4gICAqL1xuICB1dGlsLmZvckVhY2ggPSBmdW5jdGlvbiAob2JqLCBpdGVyYXRvcikge1xuICAgIHZhciBwcm9wO1xuICAgIGZvciAocHJvcCBpbiBvYmopIHtcbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgaXRlcmF0b3Iob2JqW3Byb3BdLCBwcm9wKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIHZhciBmb3JFYWNoID0gdXRpbC5mb3JFYWNoO1xuXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIHRyYW5zcG9zZWQgY29weSBvZiBhbiBPYmplY3QuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cbiAgdXRpbC5nZXRUcmFuc3Bvc2UgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHRyYW5zcG9zZSA9IHt9O1xuXG4gICAgZm9yRWFjaChvYmosIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgdHJhbnNwb3NlW3ZhbF0gPSBrZXk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdHJhbnNwb3NlO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEltcGxlbWVudGF0aW9uIG9mIEFycmF5I2luZGV4T2YgYmVjYXVzZSBJRTw5IGRvZXNuJ3Qgc3VwcG9ydCBpdC5cbiAgICpcbiAgICogQHBhcmFtIHtBcnJheX0gYXJyXG4gICAqIEBwYXJhbSB7Kn0gdmFsXG4gICAqIEByZXR1cm4ge251bWJlcn0gSW5kZXggb2YgdGhlIGZvdW5kIGVsZW1lbnQgb3IgLTEgaWYgbm90IGZvdW5kLlxuICAgKi9cbiAgdXRpbC5pbmRleE9mID0gZnVuY3Rpb24gKGFyciwgdmFsKSB7XG4gICAgaWYgKGFyci5pbmRleE9mKSB7XG4gICAgICByZXR1cm4gYXJyLmluZGV4T2YodmFsKTtcbiAgICB9XG5cbiAgICB2YXIgaSwgbGVuID0gYXJyLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGlmIChhcnJbaV0gPT09IHZhbCkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gLTE7XG4gIH07XG4gIHZhciBpbmRleE9mID0gdXRpbC5pbmRleE9mO1xuXG5cbiAgLyoqXG4gICAqIFB1c2ggYSB2YWx1ZSBvbnRvIGFuIGFycmF5IGlmIGl0IGlzIG5vdCBwcmVzZW50IGluIHRoZSBhcnJheSBhbHJlYWR5LiAgT3RoZXJ3aXNlLCB0aGlzIGlzIGEgbm8tb3AuXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXl9IGFyclxuICAgKiBAcGFyYW0geyp9IHZhbFxuICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIG9yIG5vdCB0aGUgdmFsdWUgd2FzIGFkZGVkIHRvIHRoZSBhcnJheS5cbiAgICovXG4gIHV0aWwucHVzaFVuaXF1ZSA9IGZ1bmN0aW9uIChhcnIsIHZhbCkge1xuICAgIGlmIChpbmRleE9mKGFyciwgdmFsKSA9PT0gLTEpIHtcbiAgICAgIGFyci5wdXNoKHZhbCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cblxuICAvKipcbiAgICogUmVtb3ZlIGEgdmFsdWUgZnJvbSBhbiBhcnJheS4gIEFzc3VtZXMgdGhlcmUgaXMgb25seSBvbmUgaW5zdGFuY2Ugb2YgdGhlIHZhbHVlIHByZXNlbnQgaW4gdGhlIGFycmF5LlxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5fSBhcnJcbiAgICogQHBhcmFtIHsqfSB2YWxcbiAgICogQHJldHVybiB7Kn0gVGhlIHZhbHVlIHRoYXQgd2FzIHJlbW92ZWQgZnJvbSBhcnIuICBSZXR1cm5zIHVuZGVmaW5lZCBpZiBub3RoaW5nIHdhcyByZW1vdmVkLlxuICAgKi9cbiAgdXRpbC5yZW1vdmVWYWx1ZSA9IGZ1bmN0aW9uIChhcnIsIHZhbCkge1xuICAgIHZhciBpbmRleCA9IGluZGV4T2YoYXJyLCB2YWwpO1xuXG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgcmV0dXJuIGFyci5zcGxpY2UoaW5kZXgsIDEpWzBdO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDcm9zcy1icm93c2VyIGZ1bmN0aW9uIGZvciBsaXN0ZW5pbmcgZm9yIGFuZCBoYW5kbGluZyBhbiBldmVudCBvbiB0aGUgZG9jdW1lbnQgZWxlbWVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBoYW5kbGVyXG4gICAqL1xuICB1dGlsLmRvY3VtZW50T24gPSBmdW5jdGlvbiAoZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gICAgaWYgKHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LmF0dGFjaEV2ZW50KSB7XG4gICAgICBkb2N1bWVudC5hdHRhY2hFdmVudCgnb24nICsgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogU2hpbSBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lLiAgU2VlOiBodHRwOi8vcGF1bGlyaXNoLmNvbS8yMDExL3JlcXVlc3RhbmltYXRpb25mcmFtZS1mb3Itc21hcnQtYW5pbWF0aW5nL1xuICAgKi9cbiAgdXRpbC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSAoZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICB8fFxuICAgICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSAgICB8fFxuICAgICAgZnVuY3Rpb24oIGNhbGxiYWNrICl7XG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xuICAgICAgfTtcbiAgfSkoKTtcblxuXG4gIC8qKlxuICAgKiBBbiBlbXB0eSBmdW5jdGlvbi4gIE5PT1AhXG4gICAqL1xuICB1dGlsLm5vb3AgPSBmdW5jdGlvbiAoKSB7fTtcblxuICByZXR1cm4gdXRpbDtcblxufSgpKTtcblxuLyoqXG4gKiBMb29rdXAgdGFibGUgb2Yga2V5cyB0byBrZXlDb2Rlcy5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0LjxudW1iZXI+fVxuICovXG52YXIgS0VZX01BUCA9IHtcbiAgJ0EnOiA2NVxuICAsJ0InOiA2NlxuICAsJ0MnOiA2N1xuICAsJ0QnOiA2OFxuICAsJ0UnOiA2OVxuICAsJ0YnOiA3MFxuICAsJ0cnOiA3MVxuICAsJ0gnOiA3MlxuICAsJ0knOiA3M1xuICAsJ0onOiA3NFxuICAsJ0snOiA3NVxuICAsJ0wnOiA3NlxuICAsJ00nOiA3N1xuICAsJ04nOiA3OFxuICAsJ08nOiA3OVxuICAsJ1AnOiA4MFxuICAsJ1EnOiA4MVxuICAsJ1InOiA4MlxuICAsJ1MnOiA4M1xuICAsJ1QnOiA4NFxuICAsJ1UnOiA4NVxuICAsJ1YnOiA4NlxuICAsJ1cnOiA4N1xuICAsJ1gnOiA4OFxuICAsJ1knOiA4OVxuICAsJ1onOiA5MFxuICAsJ0VOVEVSJzogMTNcbiAgLCdFU0MnOiAyN1xuICAsJ1NQQUNFJzogMzJcbiAgLCdMRUZUJzogMzdcbiAgLCdVUCc6IDM4XG4gICwnUklHSFQnOiAzOVxuICAsJ0RPV04nOiA0MFxufTtcblxuXG4vKipcbiAqIFRoZSB0cmFuc3Bvc2VkIHZlcnNpb24gb2YgS0VZX01BUC5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmc+fVxuICovXG52YXIgVFJBTlNQT1NFRF9LRVlfTUFQID0gdXRpbC5nZXRUcmFuc3Bvc2UoS0VZX01BUCk7XG5cbi8qIVxuICogQHR5cGUgQXJyYXkuPHN0cmluZz5cbiAqL1xudmFyIGtleXNEb3duID0gW107XG5cbnZhciBLZXkgPSAoZnVuY3Rpb24gKCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICAvKipcbiAgICogUmVwcmVzZW50cyBhIGtleSBvbiB0aGUga2V5Ym9hcmQuICBZb3UnbGwgbmV2ZXIgYWN0dWFsbHkgY2FsbCB0aGlzIG1ldGhvZCBkaXJlY3RseTsgS2V5IE9iamVjdHMgZm9yIGV2ZXJ5IGtleSB0aGF0IEtleWRyb3duIHN1cHBvcnRzIGFyZSBjcmVhdGVkIGZvciB5b3Ugd2hlbiB0aGUgbGlicmFyeSBpcyBpbml0aWFsaXplZCAoYXMgaW4sIHdoZW4gdGhlIGZpbGUgaXMgbG9hZGVkKS4gIFlvdSB3aWxsLCBob3dldmVyLCB1c2UgdGhlIGBwcm90b3R5cGVgIG1ldGhvZHMgYmVsb3cgdG8gYmluZCBmdW5jdGlvbnMgdG8ga2V5IHN0YXRlcy5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGtleUNvZGUgVGhlIGtleUNvZGUgb2YgdGhlIGtleS5cbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBmdW5jdGlvbiBLZXkgKGtleUNvZGUpIHtcbiAgICB0aGlzLmtleUNvZGUgPSBrZXlDb2RlO1xuICB9XG5cblxuICAvKiFcbiAgICogVGhlIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgb24gZXZlcnkgdGljayB0aGF0IHRoZSBrZXkgaXMgaGVsZCBkb3duIGZvci5cbiAgICpcbiAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgKi9cbiAgS2V5LnByb3RvdHlwZS5fZG93bkhhbmRsZXIgPSB1dGlsLm5vb3A7XG5cblxuICAvKiFcbiAgICogVGhlIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgd2hlbiB0aGUga2V5IGlzIHJlbGVhc2VkLlxuICAgKlxuICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAqL1xuICBLZXkucHJvdG90eXBlLl91cEhhbmRsZXIgPSB1dGlsLm5vb3A7XG5cblxuICAvKiFcbiAgICogVGhlIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgd2hlbiB0aGUga2V5IGlzIHByZXNzZWQuXG4gICAqXG4gICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICovXG4gIEtleS5wcm90b3R5cGUuX3ByZXNzSGFuZGxlciA9IHV0aWwubm9vcDtcblxuXG4gIC8qIVxuICAgKiBQcml2YXRlIGhlbHBlciBmdW5jdGlvbiB0aGF0IGJpbmRzIG9yIGludm9rZXMgYSBoYW5kZXIgZm9yIGBkb3duYCwgYHVwJywgb3IgYHByZXNzYCBmb3IgYSBgS2V5YC5cbiAgICpcbiAgICogQHBhcmFtIHtLZXl9IGtleVxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGFuZGxlck5hbWVcbiAgICogQHBhcmFtIHtmdW5jdGlvbj19IG9wdF9oYW5kbGVyIElmIG9taXR0ZWQsIHRoZSBoYW5kbGVyIGlzIGludm9rZWQuXG4gICAqL1xuICBmdW5jdGlvbiBiaW5kT3JGaXJlIChrZXksIGhhbmRsZXJOYW1lLCBvcHRfaGFuZGxlcikge1xuICAgIGlmIChvcHRfaGFuZGxlcikge1xuICAgICAga2V5W2hhbmRsZXJOYW1lXSA9IG9wdF9oYW5kbGVyO1xuICAgIH0gZWxzZSB7XG4gICAgICBrZXlbaGFuZGxlck5hbWVdKCk7XG4gICAgfVxuICB9XG5cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBrZXkgaXMgY3VycmVudGx5IHByZXNzZWQgb3Igbm90LlxuICAgKlxuICAgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBrZXkgaXMgZG93biwgb3RoZXJ3aXNlIGZhbHNlLlxuICAgKi9cbiAgS2V5LnByb3RvdHlwZS5pc0Rvd24gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHV0aWwuaW5kZXhPZihrZXlzRG93biwgdGhpcy5rZXlDb2RlKSAhPT0gLTE7XG4gIH07XG5cblxuICAvKipcbiAgICogQmluZCBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBrZXkgaXMgaGVsZCBkb3duLlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uPX0gb3B0X2hhbmRsZXIgVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBrZXkgaXMgaGVsZCBkb3duLiAgSWYgb21pdHRlZCwgdGhpcyBmdW5jdGlvbiBpbnZva2VzIHdoYXRldmVyIGhhbmRsZXIgd2FzIHByZXZpb3VzbHkgYm91bmQuXG4gICAqL1xuICBLZXkucHJvdG90eXBlLmRvd24gPSBmdW5jdGlvbiAob3B0X2hhbmRsZXIpIHtcbiAgICBiaW5kT3JGaXJlKHRoaXMsICdfZG93bkhhbmRsZXInLCBvcHRfaGFuZGxlcik7XG4gIH07XG5cblxuICAvKipcbiAgICogQmluZCBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBrZXkgaXMgcmVsZWFzZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb249fSBvcHRfaGFuZGxlciBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGtleSBpcyByZWxlYXNlZC4gIElmIG9taXR0ZWQsIHRoaXMgZnVuY3Rpb24gaW52b2tlcyB3aGF0ZXZlciBoYW5kbGVyIHdhcyBwcmV2aW91c2x5IGJvdW5kLlxuICAgKi9cbiAgS2V5LnByb3RvdHlwZS51cCA9IGZ1bmN0aW9uIChvcHRfaGFuZGxlcikge1xuICAgIGJpbmRPckZpcmUodGhpcywgJ191cEhhbmRsZXInLCBvcHRfaGFuZGxlcik7XG4gIH07XG5cblxuICAvKipcbiAgICogQmluZCBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBrZXkgaXMgcHJlc3NlZC4gIFRoaXMgaGFuZGxlciB3aWxsIG5vdCBmaXJlIGFnYWluIHVudGlsIHRoZSBrZXkgaXMgcmVsZWFzZWQg4oCUIGl0IGRvZXMgbm90IHJlcGVhdC5cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbj19IG9wdF9oYW5kbGVyIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb25jZSB3aGVuIHRoZSBrZXkgaXMgcHJlc3NlZC4gIElmIG9taXR0ZWQsIHRoaXMgZnVuY3Rpb24gaW52b2tlcyB3aGF0ZXZlciBoYW5kbGVyIHdhcyBwcmV2aW91c2x5IGJvdW5kLlxuICAgKi9cbiAgS2V5LnByb3RvdHlwZS5wcmVzcyA9IGZ1bmN0aW9uIChvcHRfaGFuZGxlcikge1xuICAgIGJpbmRPckZpcmUodGhpcywgJ19wcmVzc0hhbmRsZXInLCBvcHRfaGFuZGxlcik7XG4gIH07XG5cblxuICAvKipcbiAgICogUmVtb3ZlIHRoZSBoYW5kbGVyIHRoYXQgd2FzIGJvdW5kIHdpdGggW2BrZC5LZXkjZG93bmBdKCNkb3duKS5cbiAgICovXG4gIEtleS5wcm90b3R5cGUudW5iaW5kRG93biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9kb3duSGFuZGxlciA9IHV0aWwubm9vcDtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIGhhbmRsZXIgdGhhdCB3YXMgYm91bmQgd2l0aCBbYGtkLktleSN1cGBdKCN1cCkuXG4gICAqL1xuICBLZXkucHJvdG90eXBlLnVuYmluZFVwID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3VwSGFuZGxlciA9IHV0aWwubm9vcDtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIGhhbmRsZXIgdGhhdCB3YXMgYm91bmQgd2l0aCBbYGtkLktleSNwcmVzc2BdKCNwcmVzcykuXG4gICAqL1xuICBLZXkucHJvdG90eXBlLnVuYmluZFByZXNzID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3ByZXNzSGFuZGxlciA9IHV0aWwubm9vcDtcbiAgfTtcblxuICByZXR1cm4gS2V5O1xuXG59KCkpO1xuXG52YXIga2QgPSAoZnVuY3Rpb24gKGtleXNEb3duKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBrZCA9IHt9O1xuICBrZC5LZXkgPSBLZXk7XG5cbiAgdmFyIGlzUnVubmluZyA9IGZhbHNlO1xuXG5cbiAgLyoqXG4gICAqIEV2YWx1YXRlIHdoaWNoIGtleXMgYXJlIGhlbGQgZG93biBhbmQgaW52b2tlIHRoZWlyIGhhbmRsZXIgZnVuY3Rpb25zLlxuICAgKi9cbiAga2QudGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaSwgbGVuID0ga2V5c0Rvd24ubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdmFyIGtleUNvZGUgPSBrZXlzRG93bltpXTtcblxuICAgICAgdmFyIGtleU5hbWUgPSBUUkFOU1BPU0VEX0tFWV9NQVBba2V5Q29kZV07XG4gICAgICBpZiAoa2V5TmFtZSkge1xuICAgICAgICBrZFtrZXlOYW1lXS5kb3duKCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIEEgYmFzaWMgcnVuIGxvb3AuICBgaGFuZGxlcmAgZ2V0cyBjYWxsZWQgYXBwcm94aW1hdGVseSA2MCB0aW1lcyBhIHNlY29uZC5cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gaGFuZGxlciBUaGUgZnVuY3Rpb24gdG8gY2FsbCBvbiBldmVyeSB0aWNrLiAgWW91IGFsbW9zdCBjZXJ0YWlubHkgd2FudCB0byBjYWxsIGBrZC50aWNrYCBpbiB0aGlzIGZ1bmN0aW9uLlxuICAgKi9cbiAga2QucnVuID0gZnVuY3Rpb24gKGhhbmRsZXIpIHtcbiAgICBpc1J1bm5pbmcgPSB0cnVlO1xuXG4gICAgdXRpbC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUuY2FsbCh3aW5kb3csIGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghaXNSdW5uaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAga2QucnVuKGhhbmRsZXIpO1xuICAgICAgaGFuZGxlcigpO1xuICAgIH0pO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIENhbmNlbHMgdGhlIGxvb3AgY3JlYXRlZCBieSBbYGtkLnJ1bmBdKCNydW4pLlxuICAgKi9cbiAga2Quc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpc1J1bm5pbmcgPSBmYWxzZTtcbiAgfTtcblxuXG4gIC8vIFNFVFVQXG4gIC8vXG5cblxuICAvLyBJbml0aWFsaXplIHRoZSBLRVkgT2JqZWN0c1xuICB1dGlsLmZvckVhY2goS0VZX01BUCwgZnVuY3Rpb24gKGtleUNvZGUsIGtleU5hbWUpIHtcbiAgICBrZFtrZXlOYW1lXSA9IG5ldyBLZXkoa2V5Q29kZSk7XG4gIH0pO1xuXG4gIHV0aWwuZG9jdW1lbnRPbigna2V5ZG93bicsIGZ1bmN0aW9uIChldnQpIHtcbiAgICB2YXIga2V5Q29kZSA9IGV2dC5rZXlDb2RlO1xuICAgIHZhciBrZXlOYW1lID0gVFJBTlNQT1NFRF9LRVlfTUFQW2tleUNvZGVdO1xuICAgIHZhciBpc05ldyA9IHV0aWwucHVzaFVuaXF1ZShrZXlzRG93biwga2V5Q29kZSk7XG5cbiAgICBpZiAoaXNOZXcgJiYga2Rba2V5TmFtZV0pIHtcbiAgICAgIGtkW2tleU5hbWVdLnByZXNzKCk7XG4gICAgfVxuICB9KTtcblxuICB1dGlsLmRvY3VtZW50T24oJ2tleXVwJywgZnVuY3Rpb24gKGV2dCkge1xuICAgIHZhciBrZXlDb2RlID0gdXRpbC5yZW1vdmVWYWx1ZShrZXlzRG93biwgZXZ0LmtleUNvZGUpO1xuXG4gICAgdmFyIGtleU5hbWUgPSBUUkFOU1BPU0VEX0tFWV9NQVBba2V5Q29kZV07XG4gICAgaWYgKGtleU5hbWUpIHtcbiAgICAgIGtkW2tleU5hbWVdLnVwKCk7XG4gICAgfVxuICB9KTtcblxuICAvLyBTdG9wIGZpcmluZyB0aGUgXCJkb3duXCIgaGFuZGxlcnMgaWYgdGhlIHVzZXIgbG9zZXMgZm9jdXMgb2YgdGhlIGJyb3dzZXJcbiAgLy8gd2luZG93LlxuICB1dGlsLmRvY3VtZW50T24oJ2JsdXInLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAga2V5c0Rvd24ubGVuZ3RoID0gMDtcbiAgfSk7XG5cblxuICByZXR1cm4ga2Q7XG5cbi8qIVxuICogVGhlIHZhcmlhYmxlcyBwYXNzZWQgaW50byB0aGUgY2xvc3VyZSBoZXJlIGFyZSBkZWZpbmVkIGluIGtkLmtleS5qcy5cbiAqLyAvKiEqL1xufShrZXlzRG93bikpO1xuXG5pZiAodHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09IFwib2JqZWN0XCIpIHtcbiAgLy8gS2V5ZHJvd24gd2FzIGxvYWRlZCBhcyBhIENvbW1vbkpTIG1vZHVsZSAoYnkgQnJvd3NlcmlmeSwgZm9yIGV4YW1wbGUpLlxuICBtb2R1bGUuZXhwb3J0cyA9IGtkO1xufSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAvLyBLZXlkcm93biB3YXMgbG9hZGVkIGFzIGFuIEFNRCBtb2R1bGUuXG4gIGRlZmluZShmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGtkO1xuICB9KTtcbn0gZWxzZSB7XG4gIHdpbmRvdy5rZCA9IGtkO1xufVxuXG59ICh3aW5kb3cpKTtcbiIsIi8vIEhvbGRzIGxhc3QgaXRlcmF0aW9uIHRpbWVzdGFtcC5cbnZhciB0aW1lID0gMDtcblxuLyoqXG4gKiBDYWxscyBgZm5gIG9uIG5leHQgZnJhbWUuXG4gKlxuICogQHBhcmFtICB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvblxuICogQHJldHVybiB7aW50fSBUaGUgcmVxdWVzdCBJRFxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHJhZihmbikge1xuICByZXR1cm4gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICB2YXIgZWxhcHNlZCA9IG5vdyAtIHRpbWU7XG5cbiAgICBpZiAoZWxhcHNlZCA+IDk5OSkge1xuICAgICAgZWxhcHNlZCA9IDEgLyA2MDtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxhcHNlZCAvPSAxMDAwO1xuICAgIH1cblxuICAgIHRpbWUgPSBub3c7XG4gICAgZm4oZWxhcHNlZCk7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLyoqXG4gICAqIENhbGxzIGBmbmAgb24gZXZlcnkgZnJhbWUgd2l0aCBgZWxhcHNlZGAgc2V0IHRvIHRoZSBlbGFwc2VkXG4gICAqIHRpbWUgaW4gbWlsbGlzZWNvbmRzLlxuICAgKlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uXG4gICAqIEByZXR1cm4ge2ludH0gVGhlIHJlcXVlc3QgSURcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG4gIHN0YXJ0OiBmdW5jdGlvbihmbikge1xuICAgIHJldHVybiByYWYoZnVuY3Rpb24gdGljayhlbGFwc2VkKSB7XG4gICAgICBmbihlbGFwc2VkKTtcbiAgICAgIHJhZih0aWNrKTtcbiAgICB9KTtcbiAgfSxcbiAgLyoqXG4gICAqIENhbmNlbHMgdGhlIHNwZWNpZmllZCBhbmltYXRpb24gZnJhbWUgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtpbnR9IGlkIFRoZSByZXF1ZXN0IElEXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuICBzdG9wOiBmdW5jdGlvbihpZCkge1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShpZCk7XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlZWQpIHtcbiAgdmFyIHJhbmRvbSA9IHdocmFuZG9tKHNlZWQpO1xuICB2YXIgcm5nID0ge1xuICAgIC8qKlxuICAgICAqIFJldHVybiBhbiBpbnRlZ2VyIHdpdGhpbiBbMCwgbWF4KS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSAge2ludH0gW21heF1cbiAgICAgKiBAcmV0dXJuIHtpbnR9XG4gICAgICogQGFwaSBwdWJsaWNcbiAgICAgKi9cbiAgICBpbnQ6IGZ1bmN0aW9uKG1heCkge1xuICAgICAgcmV0dXJuIHJhbmRvbSgpICogKG1heCB8fCAweGZmZmZmZmYpIHwgMDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFJldHVybiBhIGZsb2F0IHdpdGhpbiBbMC4wLCAxLjApLlxuICAgICAqXG4gICAgICogQHJldHVybiB7ZmxvYXR9XG4gICAgICogQGFwaSBwdWJsaWNcbiAgICAgKi9cbiAgICBmbG9hdDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcmFuZG9tKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBSZXR1cm4gYSBib29sZWFuLlxuICAgICAqXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKiBAYXBpIHB1YmxpY1xuICAgICAqL1xuICAgIGJvb2w6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJhbmRvbSgpID4gMC41O1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGFuIGludGVnZXIgd2l0aGluIFttaW4sIG1heCkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtpbnR9IG1pblxuICAgICAqIEBwYXJhbSAge2ludH0gbWF4XG4gICAgICogQHJldHVybiB7aW50fVxuICAgICAqIEBhcGkgcHVibGljXG4gICAgICovXG4gICAgcmFuZ2U6IGZ1bmN0aW9uKG1pbiwgbWF4KSB7XG4gICAgICByZXR1cm4gcm5nLmludChtYXggLSBtaW4pICsgbWluO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogUGljayBhbiBlbGVtZW50IGZyb20gdGhlIHNvdXJjZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSAge21peGVkW119IHNvdXJjZVxuICAgICAqIEByZXR1cm4ge21peGVkfVxuICAgICAqIEBhcGkgcHVibGljXG4gICAgICovXG4gICAgcGljazogZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICByZXR1cm4gc291cmNlW3JuZy5yYW5nZSgwLCBzb3VyY2UubGVuZ3RoKV07XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBybmc7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlIGEgc2VlZGVkIHJhbmRvbSBudW1iZXIgdXNpbmcgUHl0aG9uJ3Mgd2hyYW5kb20gaW1wbGVtZW50YXRpb24uXG4gKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2lhbmIvd2hyYW5kb20gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gKlxuICogQHBhcmFtICB7aW50fSBbc2VlZF1cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHdocmFuZG9tKHNlZWQpIHtcbiAgaWYgKCFzZWVkKSB7XG4gICAgc2VlZCA9IERhdGUubm93KCk7XG4gIH1cblxuICB2YXIgeCA9IChzZWVkICUgMzAyNjgpICsgMTtcbiAgc2VlZCA9IChzZWVkIC0gKHNlZWQgJSAzMDI2OCkpIC8gMzAyNjg7XG4gIHZhciB5ID0gKHNlZWQgJSAzMDMwNikgKyAxO1xuICBzZWVkID0gKHNlZWQgLSAoc2VlZCAlIDMwMzA2KSkgLyAzMDMwNjtcbiAgdmFyIHogPSAoc2VlZCAlIDMwMzIyKSArIDE7XG4gIHNlZWQgPSAoc2VlZCAtIChzZWVkICUgMzAzMjIpKSAvIDMwMzIyO1xuXG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB4ID0gKDE3MSAqIHgpICUgMzAyNjk7XG4gICAgeSA9ICgxNzIgKiB5KSAlIDMwMzA3O1xuICAgIHogPSAoMTcwICogeikgJSAzMDMyMztcbiAgICByZXR1cm4gKHggLyAzMDI2OS4wICsgeSAvIDMwMzA3LjAgKyB6IC8gMzAzMjMuMCkgJSAxLjA7XG4gIH07XG59XG4iXX0=
