(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var raf = require('./lib/raf');
var rand = require('./lib/rng')();
var kd = require('./lib/keydrown');

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

var ArcadeAudio = require('./ArcadeAudio');
var ColorCollision = require('./ColorCollision')(ctx);
var sounds = require('./sounds');


ArcadeAudio.add('explosion', 5, sounds.explosion);
ArcadeAudio.add('powerup', 1, sounds.powerup);
ArcadeAudio.add('alarm', 1, [sounds.random.alarm]);

var colors = [
  '#0074D9', '#2ECC40', '#FF4136', '#FFDC00'
];

var W = canvas.width;
var H = canvas.height;

var playerColor = {
  r: 0,
  g: 0,
  b: 0,
  a: 0
};

var playerColorAmount;
var farthestBackground;
var score;
var life;

var background;
var player;

var reset = function () {
  farthestBackground = 0;
  score = 0;
  life = 100;
  background = [];

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 5; j++) {
      background.push({
        x: i * W / 3,
        y: H - j * H / 3,
        width: W / 3,
        height: H / 3,
        color: rand.pick(colors)
      });
    }
  }

  player = {
    x: W / 2,
    y: rand.int(H / 2),
    radius: rand.range(50, 60),
    dx: 0,
    dy: 0,
    maxdx: 200,
    maxdy: 200,
    bounce: 0.4,
    color: rand.pick(colors)
  };
};

reset();

raf.start(function (elapsed) {
  kd.tick();

  // Clear the screen
  ctx.clearRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  background.forEach(function (bg) {
    ctx.fillStyle = bg.color;
    ctx.fillRect(bg.x, bg.y, bg.width, bg.height);
    bg.y++;
    farthestBackground = Math.min(farthestBackground, bg.y);
    if (bg.y > H) {
      bg.y = farthestBackground;
      bg.color = rand.pick(colors);
      score+=1;
    }
  });

  playerColorAmount = ColorCollision.getColorAmount(player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2, playerColor);

  // Handle collision against the canvas's edges
  if (player.x - player.radius < 0 && player.dx < 0 || player.x + player.radius > W && player.dx > 0) player.dx = -player.dx * player.bounce;
  if (player.y - player.radius < 0 && player.dy < 0 || player.y +  player.radius > H && player.dy > 0) player.dy = -player.dy * player.bounce;

  // Update player position
  player.x += player.dx * elapsed;
  player.y += player.dy * elapsed;

  // Render the player
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.fillRect(player.x - player.radius, player.y, player.radius, player.radius);
  ctx.fillRect(player.x, player.y, player.radius, player.radius);

  playerColor = ColorCollision.getPointColor(player.x + player.radius / 2, player.y + player.radius / 2);
  var playerColorMax = ColorCollision.getColorAmount(player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2, playerColor);

  if (playerColorAmount < playerColorMax - 1000) {
    ctx.globalAlpha = 0.8 / (1 + rand.range(0, 50) / 100);
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius / 3, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = 'black';
    ctx.fill();
    //ArcadeAudio.play('alarm');
    life = Math.max(life - 1, 0);
  }
  else {
    life = Math.min(100, life + 1);
  }

  if (life === 0) {
    // reset();
    // ArcadeAudio.play('explosion');
  }

  ctx.globalAlpha = 1;
  ctx.font = '30px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText('Score: ' + score, W - 130, 30);

  ctx.fillText('Life: ' + life, 20, 30);
});

/*
 * Keyboard controls.
 */

// Player moves.

kd.UP.down(function () {
  player.dy = Math.max(player.dy - 10, -player.maxdy);
});

kd.DOWN.down(function () {
  player.dy = Math.min(player.dy + 10, player.maxdy);
});

kd.LEFT.down(function () {
  player.dx = Math.max(player.dx - 10, -player.maxdx);
});

kd.RIGHT.down(function () {
  player.dx = Math.min(player.dx + 10, player.maxdx);
});

kd.Z.up(function () {
  player.color = '#0074D9';
  ArcadeAudio.play('powerup');
});

kd.S.up(function () {
  player.color = '#FF4136';
  ArcadeAudio.play('powerup');
});

kd.Q.up(function () {
  player.color = '#FFDC00';
  ArcadeAudio.play('powerup');
});

kd.D.up(function () {
  player.color = '#2ECC40';
  ArcadeAudio.play('powerup');
});

// Other controls.

kd.SPACE.up(function () {
  ArcadeAudio.play('powerup');
  player.color = rand.pick(colors);
});

kd.ESC.up(function () {
  reset();
  ArcadeAudio.play('explosion');
});

},{"./ArcadeAudio":2,"./ColorCollision":3,"./lib/keydrown":5,"./lib/raf":6,"./lib/rng":7,"./sounds":8}],2:[function(require,module,exports){
var jsfxr = require('./lib/jsfxr');

var sounds = {};

var add = function(key, count, settings) {
  sounds[key] = [];
  settings.forEach(function(elem, index) {
    sounds[key].push({
      tick: 0,
      count: count,
      pool: []
    });
    for (var i = 0; i < count; i++) {
      var audio = new Audio();
      audio.src = jsfxr(elem);
      sounds[key][index].pool.push(audio);
    }
  }, this);
};

var play = function(key) {
  var sound = sounds[key];
  var soundData = sound.length > 1 ? sound[Math.floor(Math.random() * sound.length)] : sound[0];
  soundData.pool[soundData.tick].play();
  soundData.tick = soundData.tick < soundData.count - 1 ? soundData.tick + 1 : 0;
};

module.exports = {
  add: add,
  play: play
};

},{"./lib/jsfxr":4}],3:[function(require,module,exports){
module.exports = function (ctx) {
  return {
    getColorAmount: function (x, y, w, h, color) {
      var pixels = ctx.getImageData(x, y, w, h);
      var all = pixels.data.length;
      var amount = 0;
      for (var i = 0; i < all; i += 4) {
        if (pixels.data[i] === color.r && pixels.data[i + 1] === color.g && pixels.data[i + 2] === color.b) {
          amount++;
        }
      }
      return amount;
    },
    getPointColor: function (x, y) {
      var pixel = ctx.getImageData(x, y, 1, 1);
      return {
        r: pixel.data[0],
        g: pixel.data[1],
        b: pixel.data[2],
        a: pixel.data[3]
      };
    }
  };
};

},{}],4:[function(require,module,exports){
/**
 * SfxrParams
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
/** @constructor */
function SfxrParams() {
  //--------------------------------------------------------------------------
  //
  //  Settings String Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Parses a settings array into the parameters
   * @param array Array of the settings values, where elements 0 - 23 are
   *                a: waveType
   *                b: attackTime
   *                c: sustainTime
   *                d: sustainPunch
   *                e: decayTime
   *                f: startFrequency
   *                g: minFrequency
   *                h: slide
   *                i: deltaSlide
   *                j: vibratoDepth
   *                k: vibratoSpeed
   *                l: changeAmount
   *                m: changeSpeed
   *                n: squareDuty
   *                o: dutySweep
   *                p: repeatSpeed
   *                q: phaserOffset
   *                r: phaserSweep
   *                s: lpFilterCutoff
   *                t: lpFilterCutoffSweep
   *                u: lpFilterResonance
   *                v: hpFilterCutoff
   *                w: hpFilterCutoffSweep
   *                x: masterVolume
   * @return If the string successfully parsed
   */
  this.setSettings = function(values)
  {
    for ( var i = 0; i < 24; i++ )
    {
      this[String.fromCharCode( 97 + i )] = values[i] || 0;
    }

    // I moved this here from the reset(true) function
    if (this['c'] < .01) {
      this['c'] = .01;
    }

    var totalTime = this['b'] + this['c'] + this['e'];
    if (totalTime < .18) {
      var multiplier = .18 / totalTime;
      this['b']  *= multiplier;
      this['c'] *= multiplier;
      this['e']   *= multiplier;
    }
  }
}

/**
 * SfxrSynth
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
/** @constructor */
function SfxrSynth() {
  // All variables are kept alive through function closures

  //--------------------------------------------------------------------------
  //
  //  Sound Parameters
  //
  //--------------------------------------------------------------------------

  this._params = new SfxrParams();  // Params instance

  //--------------------------------------------------------------------------
  //
  //  Synth Variables
  //
  //--------------------------------------------------------------------------

  var _envelopeLength0, // Length of the attack stage
      _envelopeLength1, // Length of the sustain stage
      _envelopeLength2, // Length of the decay stage

      _period,          // Period of the wave
      _maxPeriod,       // Maximum period before sound stops (from minFrequency)

      _slide,           // Note slide
      _deltaSlide,      // Change in slide

      _changeAmount,    // Amount to change the note by
      _changeTime,      // Counter for the note change
      _changeLimit,     // Once the time reaches this limit, the note changes

      _squareDuty,      // Offset of center switching point in the square wave
      _dutySweep;       // Amount to change the duty by

  //--------------------------------------------------------------------------
  //
  //  Synth Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Resets the runing variables from the params
   * Used once at the start (total reset) and for the repeat effect (partial reset)
   */
  this.reset = function() {
    // Shorter reference
    var p = this._params;

    _period       = 100 / (p['f'] * p['f'] + .001);
    _maxPeriod    = 100 / (p['g']   * p['g']   + .001);

    _slide        = 1 - p['h'] * p['h'] * p['h'] * .01;
    _deltaSlide   = -p['i'] * p['i'] * p['i'] * .000001;

    if (!p['a']) {
      _squareDuty = .5 - p['n'] / 2;
      _dutySweep  = -p['o'] * .00005;
    }

    _changeAmount =  1 + p['l'] * p['l'] * (p['l'] > 0 ? -.9 : 10);
    _changeTime   = 0;
    _changeLimit  = p['m'] == 1 ? 0 : (1 - p['m']) * (1 - p['m']) * 20000 + 32;
  }

  // I split the reset() function into two functions for better readability
  this.totalReset = function() {
    this.reset();

    // Shorter reference
    var p = this._params;

    // Calculating the length is all that remained here, everything else moved somewhere
    _envelopeLength0 = p['b']  * p['b']  * 100000;
    _envelopeLength1 = p['c'] * p['c'] * 100000;
    _envelopeLength2 = p['e']   * p['e']   * 100000 + 12;
    // Full length of the volume envelop (and therefore sound)
    // Make sure the length can be divided by 3 so we will not need the padding "==" after base64 encode
    return ((_envelopeLength0 + _envelopeLength1 + _envelopeLength2) / 3 | 0) * 3;
  }

  /**
   * Writes the wave to the supplied buffer ByteArray
   * @param buffer A ByteArray to write the wave to
   * @return If the wave is finished
   */
  this.synthWave = function(buffer, length) {
    // Shorter reference
    var p = this._params;

    // If the filters are active
    var _filters = p['s'] != 1 || p['v'],
        // Cutoff multiplier which adjusts the amount the wave position can move
        _hpFilterCutoff = p['v'] * p['v'] * .1,
        // Speed of the high-pass cutoff multiplier
        _hpFilterDeltaCutoff = 1 + p['w'] * .0003,
        // Cutoff multiplier which adjusts the amount the wave position can move
        _lpFilterCutoff = p['s'] * p['s'] * p['s'] * .1,
        // Speed of the low-pass cutoff multiplier
        _lpFilterDeltaCutoff = 1 + p['t'] * .0001,
        // If the low pass filter is active
        _lpFilterOn = p['s'] != 1,
        // masterVolume * masterVolume (for quick calculations)
        _masterVolume = p['x'] * p['x'],
        // Minimum frequency before stopping
        _minFreqency = p['g'],
        // If the phaser is active
        _phaser = p['q'] || p['r'],
        // Change in phase offset
        _phaserDeltaOffset = p['r'] * p['r'] * p['r'] * .2,
        // Phase offset for phaser effect
        _phaserOffset = p['q'] * p['q'] * (p['q'] < 0 ? -1020 : 1020),
        // Once the time reaches this limit, some of the    iables are reset
        _repeatLimit = p['p'] ? ((1 - p['p']) * (1 - p['p']) * 20000 | 0) + 32 : 0,
        // The punch factor (louder at begining of sustain)
        _sustainPunch = p['d'],
        // Amount to change the period of the wave by at the peak of the vibrato wave
        _vibratoAmplitude = p['j'] / 2,
        // Speed at which the vibrato phase moves
        _vibratoSpeed = p['k'] * p['k'] * .01,
        // The type of wave to generate
        _waveType = p['a'];

    var _envelopeLength      = _envelopeLength0,     // Length of the current envelope stage
        _envelopeOverLength0 = 1 / _envelopeLength0, // (for quick calculations)
        _envelopeOverLength1 = 1 / _envelopeLength1, // (for quick calculations)
        _envelopeOverLength2 = 1 / _envelopeLength2; // (for quick calculations)

    // Damping muliplier which restricts how fast the wave position can move
    var _lpFilterDamping = 5 / (1 + p['u'] * p['u'] * 20) * (.01 + _lpFilterCutoff);
    if (_lpFilterDamping > .8) {
      _lpFilterDamping = .8;
    }
    _lpFilterDamping = 1 - _lpFilterDamping;

    var _finished = false,     // If the sound has finished
        _envelopeStage    = 0, // Current stage of the envelope (attack, sustain, decay, end)
        _envelopeTime     = 0, // Current time through current enelope stage
        _envelopeVolume   = 0, // Current volume of the envelope
        _hpFilterPos      = 0, // Adjusted wave position after high-pass filter
        _lpFilterDeltaPos = 0, // Change in low-pass wave position, as allowed by the cutoff and damping
        _lpFilterOldPos,       // Previous low-pass wave position
        _lpFilterPos      = 0, // Adjusted wave position after low-pass filter
        _periodTemp,           // Period modified by vibrato
        _phase            = 0, // Phase through the wave
        _phaserInt,            // Integer phaser offset, for bit maths
        _phaserPos        = 0, // Position through the phaser buffer
        _pos,                  // Phase expresed as a Number from 0-1, used for fast sin approx
        _repeatTime       = 0, // Counter for the repeats
        _sample,               // Sub-sample calculated 8 times per actual sample, averaged out to get the super sample
        _superSample,          // Actual sample writen to the wave
        _vibratoPhase     = 0; // Phase through the vibrato sine wave

    // Buffer of wave values used to create the out of phase second wave
    var _phaserBuffer = new Array(1024),
        // Buffer of random values used to generate noise
        _noiseBuffer  = new Array(32);
    for (var i = _phaserBuffer.length; i--; ) {
      _phaserBuffer[i] = 0;
    }
    for (var i = _noiseBuffer.length; i--; ) {
      _noiseBuffer[i] = Math.random() * 2 - 1;
    }

    for (var i = 0; i < length; i++) {
      if (_finished) {
        return i;
      }

      // Repeats every _repeatLimit times, partially resetting the sound parameters
      if (_repeatLimit) {
        if (++_repeatTime >= _repeatLimit) {
          _repeatTime = 0;
          this.reset();
        }
      }

      // If _changeLimit is reached, shifts the pitch
      if (_changeLimit) {
        if (++_changeTime >= _changeLimit) {
          _changeLimit = 0;
          _period *= _changeAmount;
        }
      }

      // Acccelerate and apply slide
      _slide += _deltaSlide;
      _period *= _slide;

      // Checks for frequency getting too low, and stops the sound if a minFrequency was set
      if (_period > _maxPeriod) {
        _period = _maxPeriod;
        if (_minFreqency > 0) {
          _finished = true;
        }
      }

      _periodTemp = _period;

      // Applies the vibrato effect
      if (_vibratoAmplitude > 0) {
        _vibratoPhase += _vibratoSpeed;
        _periodTemp *= 1 + Math.sin(_vibratoPhase) * _vibratoAmplitude;
      }

      _periodTemp |= 0;
      if (_periodTemp < 8) {
        _periodTemp = 8;
      }

      // Sweeps the square duty
      if (!_waveType) {
        _squareDuty += _dutySweep;
        if (_squareDuty < 0) {
          _squareDuty = 0;
        } else if (_squareDuty > .5) {
          _squareDuty = .5;
        }
      }

      // Moves through the different stages of the volume envelope
      if (++_envelopeTime > _envelopeLength) {
        _envelopeTime = 0;

        switch (++_envelopeStage)  {
          case 1:
            _envelopeLength = _envelopeLength1;
            break;
          case 2:
            _envelopeLength = _envelopeLength2;
        }
      }

      // Sets the volume based on the position in the envelope
      switch (_envelopeStage) {
        case 0:
          _envelopeVolume = _envelopeTime * _envelopeOverLength0;
          break;
        case 1:
          _envelopeVolume = 1 + (1 - _envelopeTime * _envelopeOverLength1) * 2 * _sustainPunch;
          break;
        case 2:
          _envelopeVolume = 1 - _envelopeTime * _envelopeOverLength2;
          break;
        case 3:
          _envelopeVolume = 0;
          _finished = true;
      }

      // Moves the phaser offset
      if (_phaser) {
        _phaserOffset += _phaserDeltaOffset;
        _phaserInt = _phaserOffset | 0;
        if (_phaserInt < 0) {
          _phaserInt = -_phaserInt;
        } else if (_phaserInt > 1023) {
          _phaserInt = 1023;
        }
      }

      // Moves the high-pass filter cutoff
      if (_filters && _hpFilterDeltaCutoff) {
        _hpFilterCutoff *= _hpFilterDeltaCutoff;
        if (_hpFilterCutoff < .00001) {
          _hpFilterCutoff = .00001;
        } else if (_hpFilterCutoff > .1) {
          _hpFilterCutoff = .1;
        }
      }

      _superSample = 0;
      for (var j = 8; j--; ) {
        // Cycles through the period
        _phase++;
        if (_phase >= _periodTemp) {
          _phase %= _periodTemp;

          // Generates new random noise for this period
          if (_waveType == 3) {
            for (var n = _noiseBuffer.length; n--; ) {
              _noiseBuffer[n] = Math.random() * 2 - 1;
            }
          }
        }

        // Gets the sample from the oscillator
        switch (_waveType) {
          case 0: // Square wave
            _sample = ((_phase / _periodTemp) < _squareDuty) ? .5 : -.5;
            break;
          case 1: // Saw wave
            _sample = 1 - _phase / _periodTemp * 2;
            break;
          case 2: // Sine wave (fast and accurate approx)
            _pos = _phase / _periodTemp;
            _pos = (_pos > .5 ? _pos - 1 : _pos) * 6.28318531;
            _sample = 1.27323954 * _pos + .405284735 * _pos * _pos * (_pos < 0 ? 1 : -1);
            _sample = .225 * ((_sample < 0 ? -1 : 1) * _sample * _sample  - _sample) + _sample;
            break;
          case 3: // Noise
            _sample = _noiseBuffer[Math.abs(_phase * 32 / _periodTemp | 0)];
        }

        // Applies the low and high pass filters
        if (_filters) {
          _lpFilterOldPos = _lpFilterPos;
          _lpFilterCutoff *= _lpFilterDeltaCutoff;
          if (_lpFilterCutoff < 0) {
            _lpFilterCutoff = 0;
          } else if (_lpFilterCutoff > .1) {
            _lpFilterCutoff = .1;
          }

          if (_lpFilterOn) {
            _lpFilterDeltaPos += (_sample - _lpFilterPos) * _lpFilterCutoff;
            _lpFilterDeltaPos *= _lpFilterDamping;
          } else {
            _lpFilterPos = _sample;
            _lpFilterDeltaPos = 0;
          }

          _lpFilterPos += _lpFilterDeltaPos;

          _hpFilterPos += _lpFilterPos - _lpFilterOldPos;
          _hpFilterPos *= 1 - _hpFilterCutoff;
          _sample = _hpFilterPos;
        }

        // Applies the phaser effect
        if (_phaser) {
          _phaserBuffer[_phaserPos % 1024] = _sample;
          _sample += _phaserBuffer[(_phaserPos - _phaserInt + 1024) % 1024];
          _phaserPos++;
        }

        _superSample += _sample;
      }

      // Averages out the super samples and applies volumes
      _superSample *= .125 * _envelopeVolume * _masterVolume;

      // Clipping if too loud
      buffer[i] = _superSample >= 1 ? 32767 : _superSample <= -1 ? -32768 : _superSample * 32767 | 0;
    }

    return length;
  }
}

// Adapted from http://codebase.es/riffwave/
var synth = new SfxrSynth();
// Export for the Closure Compiler
window['jsfxr'] = function(settings) {
  // Initialize SfxrParams
  synth._params.setSettings(settings);
  // Synthesize Wave
  var envelopeFullLength = synth.totalReset();
  var data = new Uint8Array(((envelopeFullLength + 1) / 2 | 0) * 4 + 44);
  var used = synth.synthWave(new Uint16Array(data.buffer, 44), envelopeFullLength) * 2;
  var dv = new Uint32Array(data.buffer, 0, 44);
  // Initialize header
  dv[0] = 0x46464952; // "RIFF"
  dv[1] = used + 36;  // put total size here
  dv[2] = 0x45564157; // "WAVE"
  dv[3] = 0x20746D66; // "fmt "
  dv[4] = 0x00000010; // size of the following
  dv[5] = 0x00010001; // Mono: 1 channel, PCM format
  dv[6] = 0x0000AC44; // 44,100 samples per second
  dv[7] = 0x00015888; // byte rate: two bytes per sample
  dv[8] = 0x00100002; // 16 bits per sample, aligned on every two bytes
  dv[9] = 0x61746164; // "data"
  dv[10] = used;      // put number of samples here

  // Base64 encoding written by me, @maettig
  used += 44;
  var i = 0,
      base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
      output = 'data:audio/wav;base64,';
  for (; i < used; i += 3)
  {
    var a = data[i] << 16 | data[i + 1] << 8 | data[i + 2];
    output += base64Characters[a >> 18] + base64Characters[a >> 12 & 63] + base64Characters[a >> 6 & 63] + base64Characters[a & 63];
  }
  return output;
}

var url = window.URL || window.webkitURL;

function playSound(params) {
  try {
    var soundURL = jsfxr(params);
    var player = new Audio();
    player.addEventListener('error', function(e) {
      console.log("Error: " + player.error.code);
    }, false);
    player.src = soundURL;
    player.play();
    player.addEventListener('ended', function(e) {
      url.revokeObjectURL(soundURL);
    }, false);
  } catch(e) {
    console.log(e.message);
  }
}

function playString(str) {
   var temp = str.split(",");
   var params = new Array();
   for(var i = 0; i < temp.length; i++) {
     params[i] = parseFloat(temp[i]);
   }
   playSound(params);
}

module.exports = window['jsfxr'];

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
module.exports = {
  pickup: [
    [0,,0.0773,0.4067,0.3563,0.8876,,,,,,0.2595,0.654,,,,,,1,,,,,0.5],
    [0,,0.052,0.4582,0.4829,0.535,,,,,,,,,,,,,1,,,,,0.5],
    [0,,0.0489,0.4239,0.3662,0.4199,,,,,,,,,,,,,1,,,,,0.5],
    [0,,0.01,0.3617,0.4302,0.8503,,,,,,0.4216,0.657,,,,,,1,,,,,0.5]
  ],
  shoot: [
    [0,,0.203,0.0484,0.2532,0.5447,0.2,-0.1881,,,,,,0.4098,0.0548,,,,1,,,,,0.5],
    [0,,0.217,,0.1882,0.7753,0.57,-0.1622,,,,,,0.3833,0.1735,,0.1421,-0.0571,1,,,0.0338,,0.5],
    [0,,0.2392,0.0914,0.3074,0.9501,0.3432,-0.2234,,,,,,0.6875,-0.4322,,,,1,,,,,0.5],
    [0,,0.2838,,0.307,0.8343,0.2,-0.213,,,,,,0.7166,-0.4537,,0.1533,-0.1513,1,,,,,0.5]
  ],
  explosion: [
    [3,,0.3792,0.367,0.4666,0.1024,,-0.0753,,,,0.7261,0.8152,,,,,,1,,,,,0.5],
    [3,,0.227,0.5364,0.2872,0.1028,,-0.2194,,,,-0.7061,0.6051,,,0.6789,0.4125,-0.06,1,,,,,0.5],
    [3,,0.2684,0.6737,0.4909,0.0739,,,,,,,,,,0.5857,,,1,,,,,0.5],
    [3,,0.3539,0.6333,0.3581,0.2274,,-0.3134,,,,,,,,,-0.1656,-0.0497,1,,,,,0.5]
  ],
  powerup: [
    [1,,0.1188,,0.3601,0.3183,,0.3083,,,,,,,,0.5257,,,1,,,,,0.5],
    [0,,0.3188,,0.217,0.4533,,0.2727,,,,,,0.3839,,0.4121,,,1,,,,,0.5],
    [0,,0.3206,,0.1451,0.3981,,0.2471,,,,,,0.0061,,,,,1,,,,,0.5],
    [1,,0.242,,0.1957,0.4771,,0.1517,,,,,,,,,,,1,,,,,0.5]
  ],
  hit: [
    [3,,0.0758,,0.2147,0.3302,,-0.6789,,,,,,,,,,,1,,,0.2232,,0.5],
    [3,,0.0287,,0.2282,0.2272,,-0.3679,,,,,,,,,,,1,,,0.0241,,0.5],
    [0,,0.0886,,0.2277,0.2471,,-0.5731,,,,,,0.4369,,,,,1,,,,,0.5],
    [3,,0.0109,,0.169,0.7592,,-0.315,,,,,,,,,,,1,,,0.2178,,0.5]
  ],
  jump: [
    [0,,0.1244,,0.2656,0.4644,,0.1849,,,,,,0.0234,,,,,0.6028,,,,,0.5],
    [0,,0.2782,,0.1533,0.3093,,0.2479,,,,,,0.5554,,,,,1,,,0.0823,,0.5],
    [0,,0.3101,,0.1337,0.3608,,0.148,,,,,,0.0327,,,,,0.6047,,,0.2031,,0.5],
    [0,,0.3879,,0.2496,0.5005,,0.1534,,,,,,0.5597,,,,,0.8403,,,0.1661,,0.5]
  ],
  blip: [
    [0,,0.1699,,0.1388,0.5767,,,,,,,,0.2625,,,,,1,,,0.1,,0.5],
    [0,,0.1295,,0.1736,0.4812,,,,,,,,,,,,,1,,,0.1,,0.5],
    [0,,0.1505,,0.1985,0.2462,,,,,,,,0.4479,,,,,1,,,0.1,,0.5],
    [0,,0.1529,,0.0366,0.2317,,,,,,,,0.4497,,,,,1,,,0.1,,0.5]
  ],
  random: {
    alert: [0,0.0054,0.393,0.0104,0.8446,0.5106,,0.0004,0.0437,0.003,0.2383,-0.9632,0.4183,-0.37,0.0113,0.1482,0.2138,-0.9841,0.8786,0.8635,-0.4097,,0.0076,0.5],
    engine: [3,0.2925,0.1169,0.05,0.7035,0.154,,0.1544,-0.0002,0.0861,-0.1473,-0.1484,,0.537,0.0029,,-0.2222,0.0199,0.9989,-0.0017,0.1253,,-0.4104,0.5],
    warp: [3,0.6757,0.2303,0.168,0.8118,0.5001,,0.0603,0.2908,,-0.3478,-0.6831,-0.8598,,-0.2341,-0.6197,0.0355,0.5477,0.9363,-0.0165,0.0116,0.0457,,0.5],
    spaceengine: [3,,0.6841,0.004,0.6957,0.0165,,0.0568,0.1263,0.0618,,0.8752,,0.678,0.2629,0.4395,0.0011,-0.885,0.1749,,-0.8661,0.09,-0.0229,0.5],
    spacewarp: [3,,0.295,0.4169,0.7152,0.502,,-0.1323,-0.1027,,-0.5849,-0.0416,0.6022,0.048,-0.0054,,,0.0667,0.9147,0.5005,0.4985,0.0094,0.321,0.5],
    alarm: [0,0.3272,0.052,0.0147,0.4403,0.5745,,0.1735,0.0425,,,-0.483,-0.9894,0.1761,-0.1204,0.2522,0.6231,-0.0109,0.999,-0.0342,,0.2604,0.0163,0.5]
  }
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy93aWxsL1Byb2plY3RzL0ZhdEJveUNyZXcvZWxlbWVudHMtc2htdXAvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi4vc3JjL21haW4iLCIvVXNlcnMvd2lsbC9Qcm9qZWN0cy9GYXRCb3lDcmV3L2VsZW1lbnRzLXNobXVwL3NyYy9BcmNhZGVBdWRpby5qcyIsIi9Vc2Vycy93aWxsL1Byb2plY3RzL0ZhdEJveUNyZXcvZWxlbWVudHMtc2htdXAvc3JjL0NvbG9yQ29sbGlzaW9uLmpzIiwiL1VzZXJzL3dpbGwvUHJvamVjdHMvRmF0Qm95Q3Jldy9lbGVtZW50cy1zaG11cC9zcmMvbGliL2pzZnhyLmpzIiwiL1VzZXJzL3dpbGwvUHJvamVjdHMvRmF0Qm95Q3Jldy9lbGVtZW50cy1zaG11cC9zcmMvbGliL2tleWRyb3duLmpzIiwiL1VzZXJzL3dpbGwvUHJvamVjdHMvRmF0Qm95Q3Jldy9lbGVtZW50cy1zaG11cC9zcmMvbGliL3JhZi5qcyIsIi9Vc2Vycy93aWxsL1Byb2plY3RzL0ZhdEJveUNyZXcvZWxlbWVudHMtc2htdXAvc3JjL2xpYi9ybmcuanMiLCIvVXNlcnMvd2lsbC9Qcm9qZWN0cy9GYXRCb3lDcmV3L2VsZW1lbnRzLXNobXVwL3NyYy9zb3VuZHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoZ0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2phQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHJhZiA9IHJlcXVpcmUoJy4vbGliL3JhZicpO1xudmFyIHJhbmQgPSByZXF1aXJlKCcuL2xpYi9ybmcnKSgpO1xudmFyIGtkID0gcmVxdWlyZSgnLi9saWIva2V5ZHJvd24nKTtcblxudmFyIGNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNnYW1lJyk7XG52YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbnZhciBBcmNhZGVBdWRpbyA9IHJlcXVpcmUoJy4vQXJjYWRlQXVkaW8nKTtcbnZhciBDb2xvckNvbGxpc2lvbiA9IHJlcXVpcmUoJy4vQ29sb3JDb2xsaXNpb24nKShjdHgpO1xudmFyIHNvdW5kcyA9IHJlcXVpcmUoJy4vc291bmRzJyk7XG5cblxuQXJjYWRlQXVkaW8uYWRkKCdleHBsb3Npb24nLCA1LCBzb3VuZHMuZXhwbG9zaW9uKTtcbkFyY2FkZUF1ZGlvLmFkZCgncG93ZXJ1cCcsIDEsIHNvdW5kcy5wb3dlcnVwKTtcbkFyY2FkZUF1ZGlvLmFkZCgnYWxhcm0nLCAxLCBbc291bmRzLnJhbmRvbS5hbGFybV0pO1xuXG52YXIgY29sb3JzID0gW1xuICAnIzAwNzREOScsICcjMkVDQzQwJywgJyNGRjQxMzYnLCAnI0ZGREMwMCdcbl07XG5cbnZhciBXID0gY2FudmFzLndpZHRoO1xudmFyIEggPSBjYW52YXMuaGVpZ2h0O1xuXG52YXIgcGxheWVyQ29sb3IgPSB7XG4gIHI6IDAsXG4gIGc6IDAsXG4gIGI6IDAsXG4gIGE6IDBcbn07XG5cbnZhciBwbGF5ZXJDb2xvckFtb3VudDtcbnZhciBmYXJ0aGVzdEJhY2tncm91bmQ7XG52YXIgc2NvcmU7XG52YXIgbGlmZTtcblxudmFyIGJhY2tncm91bmQ7XG52YXIgcGxheWVyO1xuXG52YXIgcmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gIGZhcnRoZXN0QmFja2dyb3VuZCA9IDA7XG4gIHNjb3JlID0gMDtcbiAgbGlmZSA9IDEwMDtcbiAgYmFja2dyb3VuZCA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCA1OyBqKyspIHtcbiAgICAgIGJhY2tncm91bmQucHVzaCh7XG4gICAgICAgIHg6IGkgKiBXIC8gMyxcbiAgICAgICAgeTogSCAtIGogKiBIIC8gMyxcbiAgICAgICAgd2lkdGg6IFcgLyAzLFxuICAgICAgICBoZWlnaHQ6IEggLyAzLFxuICAgICAgICBjb2xvcjogcmFuZC5waWNrKGNvbG9ycylcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHBsYXllciA9IHtcbiAgICB4OiBXIC8gMixcbiAgICB5OiByYW5kLmludChIIC8gMiksXG4gICAgcmFkaXVzOiByYW5kLnJhbmdlKDUwLCA2MCksXG4gICAgZHg6IDAsXG4gICAgZHk6IDAsXG4gICAgbWF4ZHg6IDIwMCxcbiAgICBtYXhkeTogMjAwLFxuICAgIGJvdW5jZTogMC40LFxuICAgIGNvbG9yOiByYW5kLnBpY2soY29sb3JzKVxuICB9O1xufTtcblxucmVzZXQoKTtcblxucmFmLnN0YXJ0KGZ1bmN0aW9uIChlbGFwc2VkKSB7XG4gIGtkLnRpY2soKTtcblxuICAvLyBDbGVhciB0aGUgc2NyZWVuXG4gIGN0eC5jbGVhclJlY3QoMCwgMCwgVywgSCk7XG4gIGN0eC5nbG9iYWxBbHBoYSA9IDE7XG5cbiAgYmFja2dyb3VuZC5mb3JFYWNoKGZ1bmN0aW9uIChiZykge1xuICAgIGN0eC5maWxsU3R5bGUgPSBiZy5jb2xvcjtcbiAgICBjdHguZmlsbFJlY3QoYmcueCwgYmcueSwgYmcud2lkdGgsIGJnLmhlaWdodCk7XG4gICAgYmcueSsrO1xuICAgIGZhcnRoZXN0QmFja2dyb3VuZCA9IE1hdGgubWluKGZhcnRoZXN0QmFja2dyb3VuZCwgYmcueSk7XG4gICAgaWYgKGJnLnkgPiBIKSB7XG4gICAgICBiZy55ID0gZmFydGhlc3RCYWNrZ3JvdW5kO1xuICAgICAgYmcuY29sb3IgPSByYW5kLnBpY2soY29sb3JzKTtcbiAgICAgIHNjb3JlKz0xO1xuICAgIH1cbiAgfSk7XG5cbiAgcGxheWVyQ29sb3JBbW91bnQgPSBDb2xvckNvbGxpc2lvbi5nZXRDb2xvckFtb3VudChwbGF5ZXIueCAtIHBsYXllci5yYWRpdXMsIHBsYXllci55IC0gcGxheWVyLnJhZGl1cywgcGxheWVyLnJhZGl1cyAqIDIsIHBsYXllci5yYWRpdXMgKiAyLCBwbGF5ZXJDb2xvcik7XG5cbiAgLy8gSGFuZGxlIGNvbGxpc2lvbiBhZ2FpbnN0IHRoZSBjYW52YXMncyBlZGdlc1xuICBpZiAocGxheWVyLnggLSBwbGF5ZXIucmFkaXVzIDwgMCAmJiBwbGF5ZXIuZHggPCAwIHx8IHBsYXllci54ICsgcGxheWVyLnJhZGl1cyA+IFcgJiYgcGxheWVyLmR4ID4gMCkgcGxheWVyLmR4ID0gLXBsYXllci5keCAqIHBsYXllci5ib3VuY2U7XG4gIGlmIChwbGF5ZXIueSAtIHBsYXllci5yYWRpdXMgPCAwICYmIHBsYXllci5keSA8IDAgfHwgcGxheWVyLnkgKyAgcGxheWVyLnJhZGl1cyA+IEggJiYgcGxheWVyLmR5ID4gMCkgcGxheWVyLmR5ID0gLXBsYXllci5keSAqIHBsYXllci5ib3VuY2U7XG5cbiAgLy8gVXBkYXRlIHBsYXllciBwb3NpdGlvblxuICBwbGF5ZXIueCArPSBwbGF5ZXIuZHggKiBlbGFwc2VkO1xuICBwbGF5ZXIueSArPSBwbGF5ZXIuZHkgKiBlbGFwc2VkO1xuXG4gIC8vIFJlbmRlciB0aGUgcGxheWVyXG4gIGN0eC5iZWdpblBhdGgoKTtcbiAgY3R4LmFyYyhwbGF5ZXIueCwgcGxheWVyLnksIHBsYXllci5yYWRpdXMsIDAsIE1hdGguUEkgKiAyLCB0cnVlKTtcbiAgY3R4LmNsb3NlUGF0aCgpO1xuICBjdHguZmlsbFN0eWxlID0gcGxheWVyLmNvbG9yO1xuICBjdHguZmlsbCgpO1xuICBjdHguZmlsbFJlY3QocGxheWVyLnggLSBwbGF5ZXIucmFkaXVzLCBwbGF5ZXIueSwgcGxheWVyLnJhZGl1cywgcGxheWVyLnJhZGl1cyk7XG4gIGN0eC5maWxsUmVjdChwbGF5ZXIueCwgcGxheWVyLnksIHBsYXllci5yYWRpdXMsIHBsYXllci5yYWRpdXMpO1xuXG4gIHBsYXllckNvbG9yID0gQ29sb3JDb2xsaXNpb24uZ2V0UG9pbnRDb2xvcihwbGF5ZXIueCArIHBsYXllci5yYWRpdXMgLyAyLCBwbGF5ZXIueSArIHBsYXllci5yYWRpdXMgLyAyKTtcbiAgdmFyIHBsYXllckNvbG9yTWF4ID0gQ29sb3JDb2xsaXNpb24uZ2V0Q29sb3JBbW91bnQocGxheWVyLnggLSBwbGF5ZXIucmFkaXVzLCBwbGF5ZXIueSAtIHBsYXllci5yYWRpdXMsIHBsYXllci5yYWRpdXMgKiAyLCBwbGF5ZXIucmFkaXVzICogMiwgcGxheWVyQ29sb3IpO1xuXG4gIGlmIChwbGF5ZXJDb2xvckFtb3VudCA8IHBsYXllckNvbG9yTWF4IC0gMTAwMCkge1xuICAgIGN0eC5nbG9iYWxBbHBoYSA9IDAuOCAvICgxICsgcmFuZC5yYW5nZSgwLCA1MCkgLyAxMDApO1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHguYXJjKHBsYXllci54LCBwbGF5ZXIueSwgcGxheWVyLnJhZGl1cyAvIDMsIDAsIE1hdGguUEkgKiAyLCB0cnVlKTtcbiAgICBjdHguY2xvc2VQYXRoKCk7XG4gICAgY3R4LmZpbGxTdHlsZSA9ICdibGFjayc7XG4gICAgY3R4LmZpbGwoKTtcbiAgICAvL0FyY2FkZUF1ZGlvLnBsYXkoJ2FsYXJtJyk7XG4gICAgbGlmZSA9IE1hdGgubWF4KGxpZmUgLSAxLCAwKTtcbiAgfVxuICBlbHNlIHtcbiAgICBsaWZlID0gTWF0aC5taW4oMTAwLCBsaWZlICsgMSk7XG4gIH1cblxuICBpZiAobGlmZSA9PT0gMCkge1xuICAgIC8vIHJlc2V0KCk7XG4gICAgLy8gQXJjYWRlQXVkaW8ucGxheSgnZXhwbG9zaW9uJyk7XG4gIH1cblxuICBjdHguZ2xvYmFsQWxwaGEgPSAxO1xuICBjdHguZm9udCA9ICczMHB4IEFyaWFsJztcbiAgY3R4LmZpbGxTdHlsZSA9ICcjZmZmJztcbiAgY3R4LmZpbGxUZXh0KCdTY29yZTogJyArIHNjb3JlLCBXIC0gMTMwLCAzMCk7XG5cbiAgY3R4LmZpbGxUZXh0KCdMaWZlOiAnICsgbGlmZSwgMjAsIDMwKTtcbn0pO1xuXG4vKlxuICogS2V5Ym9hcmQgY29udHJvbHMuXG4gKi9cblxuLy8gUGxheWVyIG1vdmVzLlxuXG5rZC5VUC5kb3duKGZ1bmN0aW9uICgpIHtcbiAgcGxheWVyLmR5ID0gTWF0aC5tYXgocGxheWVyLmR5IC0gMTAsIC1wbGF5ZXIubWF4ZHkpO1xufSk7XG5cbmtkLkRPV04uZG93bihmdW5jdGlvbiAoKSB7XG4gIHBsYXllci5keSA9IE1hdGgubWluKHBsYXllci5keSArIDEwLCBwbGF5ZXIubWF4ZHkpO1xufSk7XG5cbmtkLkxFRlQuZG93bihmdW5jdGlvbiAoKSB7XG4gIHBsYXllci5keCA9IE1hdGgubWF4KHBsYXllci5keCAtIDEwLCAtcGxheWVyLm1heGR4KTtcbn0pO1xuXG5rZC5SSUdIVC5kb3duKGZ1bmN0aW9uICgpIHtcbiAgcGxheWVyLmR4ID0gTWF0aC5taW4ocGxheWVyLmR4ICsgMTAsIHBsYXllci5tYXhkeCk7XG59KTtcblxua2QuWi51cChmdW5jdGlvbiAoKSB7XG4gIHBsYXllci5jb2xvciA9ICcjMDA3NEQ5JztcbiAgQXJjYWRlQXVkaW8ucGxheSgncG93ZXJ1cCcpO1xufSk7XG5cbmtkLlMudXAoZnVuY3Rpb24gKCkge1xuICBwbGF5ZXIuY29sb3IgPSAnI0ZGNDEzNic7XG4gIEFyY2FkZUF1ZGlvLnBsYXkoJ3Bvd2VydXAnKTtcbn0pO1xuXG5rZC5RLnVwKGZ1bmN0aW9uICgpIHtcbiAgcGxheWVyLmNvbG9yID0gJyNGRkRDMDAnO1xuICBBcmNhZGVBdWRpby5wbGF5KCdwb3dlcnVwJyk7XG59KTtcblxua2QuRC51cChmdW5jdGlvbiAoKSB7XG4gIHBsYXllci5jb2xvciA9ICcjMkVDQzQwJztcbiAgQXJjYWRlQXVkaW8ucGxheSgncG93ZXJ1cCcpO1xufSk7XG5cbi8vIE90aGVyIGNvbnRyb2xzLlxuXG5rZC5TUEFDRS51cChmdW5jdGlvbiAoKSB7XG4gIEFyY2FkZUF1ZGlvLnBsYXkoJ3Bvd2VydXAnKTtcbiAgcGxheWVyLmNvbG9yID0gcmFuZC5waWNrKGNvbG9ycyk7XG59KTtcblxua2QuRVNDLnVwKGZ1bmN0aW9uICgpIHtcbiAgcmVzZXQoKTtcbiAgQXJjYWRlQXVkaW8ucGxheSgnZXhwbG9zaW9uJyk7XG59KTtcbiIsInZhciBqc2Z4ciA9IHJlcXVpcmUoJy4vbGliL2pzZnhyJyk7XG5cbnZhciBzb3VuZHMgPSB7fTtcblxudmFyIGFkZCA9IGZ1bmN0aW9uKGtleSwgY291bnQsIHNldHRpbmdzKSB7XG4gIHNvdW5kc1trZXldID0gW107XG4gIHNldHRpbmdzLmZvckVhY2goZnVuY3Rpb24oZWxlbSwgaW5kZXgpIHtcbiAgICBzb3VuZHNba2V5XS5wdXNoKHtcbiAgICAgIHRpY2s6IDAsXG4gICAgICBjb3VudDogY291bnQsXG4gICAgICBwb29sOiBbXVxuICAgIH0pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgdmFyIGF1ZGlvID0gbmV3IEF1ZGlvKCk7XG4gICAgICBhdWRpby5zcmMgPSBqc2Z4cihlbGVtKTtcbiAgICAgIHNvdW5kc1trZXldW2luZGV4XS5wb29sLnB1c2goYXVkaW8pO1xuICAgIH1cbiAgfSwgdGhpcyk7XG59O1xuXG52YXIgcGxheSA9IGZ1bmN0aW9uKGtleSkge1xuICB2YXIgc291bmQgPSBzb3VuZHNba2V5XTtcbiAgdmFyIHNvdW5kRGF0YSA9IHNvdW5kLmxlbmd0aCA+IDEgPyBzb3VuZFtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzb3VuZC5sZW5ndGgpXSA6IHNvdW5kWzBdO1xuICBzb3VuZERhdGEucG9vbFtzb3VuZERhdGEudGlja10ucGxheSgpO1xuICBzb3VuZERhdGEudGljayA9IHNvdW5kRGF0YS50aWNrIDwgc291bmREYXRhLmNvdW50IC0gMSA/IHNvdW5kRGF0YS50aWNrICsgMSA6IDA7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkOiBhZGQsXG4gIHBsYXk6IHBsYXlcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjdHgpIHtcbiAgcmV0dXJuIHtcbiAgICBnZXRDb2xvckFtb3VudDogZnVuY3Rpb24gKHgsIHksIHcsIGgsIGNvbG9yKSB7XG4gICAgICB2YXIgcGl4ZWxzID0gY3R4LmdldEltYWdlRGF0YSh4LCB5LCB3LCBoKTtcbiAgICAgIHZhciBhbGwgPSBwaXhlbHMuZGF0YS5sZW5ndGg7XG4gICAgICB2YXIgYW1vdW50ID0gMDtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWxsOyBpICs9IDQpIHtcbiAgICAgICAgaWYgKHBpeGVscy5kYXRhW2ldID09PSBjb2xvci5yICYmIHBpeGVscy5kYXRhW2kgKyAxXSA9PT0gY29sb3IuZyAmJiBwaXhlbHMuZGF0YVtpICsgMl0gPT09IGNvbG9yLmIpIHtcbiAgICAgICAgICBhbW91bnQrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGFtb3VudDtcbiAgICB9LFxuICAgIGdldFBvaW50Q29sb3I6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICB2YXIgcGl4ZWwgPSBjdHguZ2V0SW1hZ2VEYXRhKHgsIHksIDEsIDEpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcjogcGl4ZWwuZGF0YVswXSxcbiAgICAgICAgZzogcGl4ZWwuZGF0YVsxXSxcbiAgICAgICAgYjogcGl4ZWwuZGF0YVsyXSxcbiAgICAgICAgYTogcGl4ZWwuZGF0YVszXVxuICAgICAgfTtcbiAgICB9XG4gIH07XG59O1xuIiwiLyoqXG4gKiBTZnhyUGFyYW1zXG4gKlxuICogQ29weXJpZ2h0IDIwMTAgVGhvbWFzIFZpYW5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICpcbiAqIEBhdXRob3IgVGhvbWFzIFZpYW5cbiAqL1xuLyoqIEBjb25zdHJ1Y3RvciAqL1xuZnVuY3Rpb24gU2Z4clBhcmFtcygpIHtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvL1xuICAvLyAgU2V0dGluZ3MgU3RyaW5nIE1ldGhvZHNcbiAgLy9cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBQYXJzZXMgYSBzZXR0aW5ncyBhcnJheSBpbnRvIHRoZSBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBhcnJheSBBcnJheSBvZiB0aGUgc2V0dGluZ3MgdmFsdWVzLCB3aGVyZSBlbGVtZW50cyAwIC0gMjMgYXJlXG4gICAqICAgICAgICAgICAgICAgIGE6IHdhdmVUeXBlXG4gICAqICAgICAgICAgICAgICAgIGI6IGF0dGFja1RpbWVcbiAgICogICAgICAgICAgICAgICAgYzogc3VzdGFpblRpbWVcbiAgICogICAgICAgICAgICAgICAgZDogc3VzdGFpblB1bmNoXG4gICAqICAgICAgICAgICAgICAgIGU6IGRlY2F5VGltZVxuICAgKiAgICAgICAgICAgICAgICBmOiBzdGFydEZyZXF1ZW5jeVxuICAgKiAgICAgICAgICAgICAgICBnOiBtaW5GcmVxdWVuY3lcbiAgICogICAgICAgICAgICAgICAgaDogc2xpZGVcbiAgICogICAgICAgICAgICAgICAgaTogZGVsdGFTbGlkZVxuICAgKiAgICAgICAgICAgICAgICBqOiB2aWJyYXRvRGVwdGhcbiAgICogICAgICAgICAgICAgICAgazogdmlicmF0b1NwZWVkXG4gICAqICAgICAgICAgICAgICAgIGw6IGNoYW5nZUFtb3VudFxuICAgKiAgICAgICAgICAgICAgICBtOiBjaGFuZ2VTcGVlZFxuICAgKiAgICAgICAgICAgICAgICBuOiBzcXVhcmVEdXR5XG4gICAqICAgICAgICAgICAgICAgIG86IGR1dHlTd2VlcFxuICAgKiAgICAgICAgICAgICAgICBwOiByZXBlYXRTcGVlZFxuICAgKiAgICAgICAgICAgICAgICBxOiBwaGFzZXJPZmZzZXRcbiAgICogICAgICAgICAgICAgICAgcjogcGhhc2VyU3dlZXBcbiAgICogICAgICAgICAgICAgICAgczogbHBGaWx0ZXJDdXRvZmZcbiAgICogICAgICAgICAgICAgICAgdDogbHBGaWx0ZXJDdXRvZmZTd2VlcFxuICAgKiAgICAgICAgICAgICAgICB1OiBscEZpbHRlclJlc29uYW5jZVxuICAgKiAgICAgICAgICAgICAgICB2OiBocEZpbHRlckN1dG9mZlxuICAgKiAgICAgICAgICAgICAgICB3OiBocEZpbHRlckN1dG9mZlN3ZWVwXG4gICAqICAgICAgICAgICAgICAgIHg6IG1hc3RlclZvbHVtZVxuICAgKiBAcmV0dXJuIElmIHRoZSBzdHJpbmcgc3VjY2Vzc2Z1bGx5IHBhcnNlZFxuICAgKi9cbiAgdGhpcy5zZXRTZXR0aW5ncyA9IGZ1bmN0aW9uKHZhbHVlcylcbiAge1xuICAgIGZvciAoIHZhciBpID0gMDsgaSA8IDI0OyBpKysgKVxuICAgIHtcbiAgICAgIHRoaXNbU3RyaW5nLmZyb21DaGFyQ29kZSggOTcgKyBpICldID0gdmFsdWVzW2ldIHx8IDA7XG4gICAgfVxuXG4gICAgLy8gSSBtb3ZlZCB0aGlzIGhlcmUgZnJvbSB0aGUgcmVzZXQodHJ1ZSkgZnVuY3Rpb25cbiAgICBpZiAodGhpc1snYyddIDwgLjAxKSB7XG4gICAgICB0aGlzWydjJ10gPSAuMDE7XG4gICAgfVxuXG4gICAgdmFyIHRvdGFsVGltZSA9IHRoaXNbJ2InXSArIHRoaXNbJ2MnXSArIHRoaXNbJ2UnXTtcbiAgICBpZiAodG90YWxUaW1lIDwgLjE4KSB7XG4gICAgICB2YXIgbXVsdGlwbGllciA9IC4xOCAvIHRvdGFsVGltZTtcbiAgICAgIHRoaXNbJ2InXSAgKj0gbXVsdGlwbGllcjtcbiAgICAgIHRoaXNbJ2MnXSAqPSBtdWx0aXBsaWVyO1xuICAgICAgdGhpc1snZSddICAgKj0gbXVsdGlwbGllcjtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZnhyU3ludGhcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMCBUaG9tYXMgVmlhblxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICogQGF1dGhvciBUaG9tYXMgVmlhblxuICovXG4vKiogQGNvbnN0cnVjdG9yICovXG5mdW5jdGlvbiBTZnhyU3ludGgoKSB7XG4gIC8vIEFsbCB2YXJpYWJsZXMgYXJlIGtlcHQgYWxpdmUgdGhyb3VnaCBmdW5jdGlvbiBjbG9zdXJlc1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy9cbiAgLy8gIFNvdW5kIFBhcmFtZXRlcnNcbiAgLy9cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHRoaXMuX3BhcmFtcyA9IG5ldyBTZnhyUGFyYW1zKCk7ICAvLyBQYXJhbXMgaW5zdGFuY2VcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vXG4gIC8vICBTeW50aCBWYXJpYWJsZXNcbiAgLy9cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHZhciBfZW52ZWxvcGVMZW5ndGgwLCAvLyBMZW5ndGggb2YgdGhlIGF0dGFjayBzdGFnZVxuICAgICAgX2VudmVsb3BlTGVuZ3RoMSwgLy8gTGVuZ3RoIG9mIHRoZSBzdXN0YWluIHN0YWdlXG4gICAgICBfZW52ZWxvcGVMZW5ndGgyLCAvLyBMZW5ndGggb2YgdGhlIGRlY2F5IHN0YWdlXG5cbiAgICAgIF9wZXJpb2QsICAgICAgICAgIC8vIFBlcmlvZCBvZiB0aGUgd2F2ZVxuICAgICAgX21heFBlcmlvZCwgICAgICAgLy8gTWF4aW11bSBwZXJpb2QgYmVmb3JlIHNvdW5kIHN0b3BzIChmcm9tIG1pbkZyZXF1ZW5jeSlcblxuICAgICAgX3NsaWRlLCAgICAgICAgICAgLy8gTm90ZSBzbGlkZVxuICAgICAgX2RlbHRhU2xpZGUsICAgICAgLy8gQ2hhbmdlIGluIHNsaWRlXG5cbiAgICAgIF9jaGFuZ2VBbW91bnQsICAgIC8vIEFtb3VudCB0byBjaGFuZ2UgdGhlIG5vdGUgYnlcbiAgICAgIF9jaGFuZ2VUaW1lLCAgICAgIC8vIENvdW50ZXIgZm9yIHRoZSBub3RlIGNoYW5nZVxuICAgICAgX2NoYW5nZUxpbWl0LCAgICAgLy8gT25jZSB0aGUgdGltZSByZWFjaGVzIHRoaXMgbGltaXQsIHRoZSBub3RlIGNoYW5nZXNcblxuICAgICAgX3NxdWFyZUR1dHksICAgICAgLy8gT2Zmc2V0IG9mIGNlbnRlciBzd2l0Y2hpbmcgcG9pbnQgaW4gdGhlIHNxdWFyZSB3YXZlXG4gICAgICBfZHV0eVN3ZWVwOyAgICAgICAvLyBBbW91bnQgdG8gY2hhbmdlIHRoZSBkdXR5IGJ5XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvL1xuICAvLyAgU3ludGggTWV0aG9kc1xuICAvL1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIFJlc2V0cyB0aGUgcnVuaW5nIHZhcmlhYmxlcyBmcm9tIHRoZSBwYXJhbXNcbiAgICogVXNlZCBvbmNlIGF0IHRoZSBzdGFydCAodG90YWwgcmVzZXQpIGFuZCBmb3IgdGhlIHJlcGVhdCBlZmZlY3QgKHBhcnRpYWwgcmVzZXQpXG4gICAqL1xuICB0aGlzLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gU2hvcnRlciByZWZlcmVuY2VcbiAgICB2YXIgcCA9IHRoaXMuX3BhcmFtcztcblxuICAgIF9wZXJpb2QgICAgICAgPSAxMDAgLyAocFsnZiddICogcFsnZiddICsgLjAwMSk7XG4gICAgX21heFBlcmlvZCAgICA9IDEwMCAvIChwWydnJ10gICAqIHBbJ2cnXSAgICsgLjAwMSk7XG5cbiAgICBfc2xpZGUgICAgICAgID0gMSAtIHBbJ2gnXSAqIHBbJ2gnXSAqIHBbJ2gnXSAqIC4wMTtcbiAgICBfZGVsdGFTbGlkZSAgID0gLXBbJ2knXSAqIHBbJ2knXSAqIHBbJ2knXSAqIC4wMDAwMDE7XG5cbiAgICBpZiAoIXBbJ2EnXSkge1xuICAgICAgX3NxdWFyZUR1dHkgPSAuNSAtIHBbJ24nXSAvIDI7XG4gICAgICBfZHV0eVN3ZWVwICA9IC1wWydvJ10gKiAuMDAwMDU7XG4gICAgfVxuXG4gICAgX2NoYW5nZUFtb3VudCA9ICAxICsgcFsnbCddICogcFsnbCddICogKHBbJ2wnXSA+IDAgPyAtLjkgOiAxMCk7XG4gICAgX2NoYW5nZVRpbWUgICA9IDA7XG4gICAgX2NoYW5nZUxpbWl0ICA9IHBbJ20nXSA9PSAxID8gMCA6ICgxIC0gcFsnbSddKSAqICgxIC0gcFsnbSddKSAqIDIwMDAwICsgMzI7XG4gIH1cblxuICAvLyBJIHNwbGl0IHRoZSByZXNldCgpIGZ1bmN0aW9uIGludG8gdHdvIGZ1bmN0aW9ucyBmb3IgYmV0dGVyIHJlYWRhYmlsaXR5XG4gIHRoaXMudG90YWxSZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucmVzZXQoKTtcblxuICAgIC8vIFNob3J0ZXIgcmVmZXJlbmNlXG4gICAgdmFyIHAgPSB0aGlzLl9wYXJhbXM7XG5cbiAgICAvLyBDYWxjdWxhdGluZyB0aGUgbGVuZ3RoIGlzIGFsbCB0aGF0IHJlbWFpbmVkIGhlcmUsIGV2ZXJ5dGhpbmcgZWxzZSBtb3ZlZCBzb21ld2hlcmVcbiAgICBfZW52ZWxvcGVMZW5ndGgwID0gcFsnYiddICAqIHBbJ2InXSAgKiAxMDAwMDA7XG4gICAgX2VudmVsb3BlTGVuZ3RoMSA9IHBbJ2MnXSAqIHBbJ2MnXSAqIDEwMDAwMDtcbiAgICBfZW52ZWxvcGVMZW5ndGgyID0gcFsnZSddICAgKiBwWydlJ10gICAqIDEwMDAwMCArIDEyO1xuICAgIC8vIEZ1bGwgbGVuZ3RoIG9mIHRoZSB2b2x1bWUgZW52ZWxvcCAoYW5kIHRoZXJlZm9yZSBzb3VuZClcbiAgICAvLyBNYWtlIHN1cmUgdGhlIGxlbmd0aCBjYW4gYmUgZGl2aWRlZCBieSAzIHNvIHdlIHdpbGwgbm90IG5lZWQgdGhlIHBhZGRpbmcgXCI9PVwiIGFmdGVyIGJhc2U2NCBlbmNvZGVcbiAgICByZXR1cm4gKChfZW52ZWxvcGVMZW5ndGgwICsgX2VudmVsb3BlTGVuZ3RoMSArIF9lbnZlbG9wZUxlbmd0aDIpIC8gMyB8IDApICogMztcbiAgfVxuXG4gIC8qKlxuICAgKiBXcml0ZXMgdGhlIHdhdmUgdG8gdGhlIHN1cHBsaWVkIGJ1ZmZlciBCeXRlQXJyYXlcbiAgICogQHBhcmFtIGJ1ZmZlciBBIEJ5dGVBcnJheSB0byB3cml0ZSB0aGUgd2F2ZSB0b1xuICAgKiBAcmV0dXJuIElmIHRoZSB3YXZlIGlzIGZpbmlzaGVkXG4gICAqL1xuICB0aGlzLnN5bnRoV2F2ZSA9IGZ1bmN0aW9uKGJ1ZmZlciwgbGVuZ3RoKSB7XG4gICAgLy8gU2hvcnRlciByZWZlcmVuY2VcbiAgICB2YXIgcCA9IHRoaXMuX3BhcmFtcztcblxuICAgIC8vIElmIHRoZSBmaWx0ZXJzIGFyZSBhY3RpdmVcbiAgICB2YXIgX2ZpbHRlcnMgPSBwWydzJ10gIT0gMSB8fCBwWyd2J10sXG4gICAgICAgIC8vIEN1dG9mZiBtdWx0aXBsaWVyIHdoaWNoIGFkanVzdHMgdGhlIGFtb3VudCB0aGUgd2F2ZSBwb3NpdGlvbiBjYW4gbW92ZVxuICAgICAgICBfaHBGaWx0ZXJDdXRvZmYgPSBwWyd2J10gKiBwWyd2J10gKiAuMSxcbiAgICAgICAgLy8gU3BlZWQgb2YgdGhlIGhpZ2gtcGFzcyBjdXRvZmYgbXVsdGlwbGllclxuICAgICAgICBfaHBGaWx0ZXJEZWx0YUN1dG9mZiA9IDEgKyBwWyd3J10gKiAuMDAwMyxcbiAgICAgICAgLy8gQ3V0b2ZmIG11bHRpcGxpZXIgd2hpY2ggYWRqdXN0cyB0aGUgYW1vdW50IHRoZSB3YXZlIHBvc2l0aW9uIGNhbiBtb3ZlXG4gICAgICAgIF9scEZpbHRlckN1dG9mZiA9IHBbJ3MnXSAqIHBbJ3MnXSAqIHBbJ3MnXSAqIC4xLFxuICAgICAgICAvLyBTcGVlZCBvZiB0aGUgbG93LXBhc3MgY3V0b2ZmIG11bHRpcGxpZXJcbiAgICAgICAgX2xwRmlsdGVyRGVsdGFDdXRvZmYgPSAxICsgcFsndCddICogLjAwMDEsXG4gICAgICAgIC8vIElmIHRoZSBsb3cgcGFzcyBmaWx0ZXIgaXMgYWN0aXZlXG4gICAgICAgIF9scEZpbHRlck9uID0gcFsncyddICE9IDEsXG4gICAgICAgIC8vIG1hc3RlclZvbHVtZSAqIG1hc3RlclZvbHVtZSAoZm9yIHF1aWNrIGNhbGN1bGF0aW9ucylcbiAgICAgICAgX21hc3RlclZvbHVtZSA9IHBbJ3gnXSAqIHBbJ3gnXSxcbiAgICAgICAgLy8gTWluaW11bSBmcmVxdWVuY3kgYmVmb3JlIHN0b3BwaW5nXG4gICAgICAgIF9taW5GcmVxZW5jeSA9IHBbJ2cnXSxcbiAgICAgICAgLy8gSWYgdGhlIHBoYXNlciBpcyBhY3RpdmVcbiAgICAgICAgX3BoYXNlciA9IHBbJ3EnXSB8fCBwWydyJ10sXG4gICAgICAgIC8vIENoYW5nZSBpbiBwaGFzZSBvZmZzZXRcbiAgICAgICAgX3BoYXNlckRlbHRhT2Zmc2V0ID0gcFsnciddICogcFsnciddICogcFsnciddICogLjIsXG4gICAgICAgIC8vIFBoYXNlIG9mZnNldCBmb3IgcGhhc2VyIGVmZmVjdFxuICAgICAgICBfcGhhc2VyT2Zmc2V0ID0gcFsncSddICogcFsncSddICogKHBbJ3EnXSA8IDAgPyAtMTAyMCA6IDEwMjApLFxuICAgICAgICAvLyBPbmNlIHRoZSB0aW1lIHJlYWNoZXMgdGhpcyBsaW1pdCwgc29tZSBvZiB0aGUgICAgaWFibGVzIGFyZSByZXNldFxuICAgICAgICBfcmVwZWF0TGltaXQgPSBwWydwJ10gPyAoKDEgLSBwWydwJ10pICogKDEgLSBwWydwJ10pICogMjAwMDAgfCAwKSArIDMyIDogMCxcbiAgICAgICAgLy8gVGhlIHB1bmNoIGZhY3RvciAobG91ZGVyIGF0IGJlZ2luaW5nIG9mIHN1c3RhaW4pXG4gICAgICAgIF9zdXN0YWluUHVuY2ggPSBwWydkJ10sXG4gICAgICAgIC8vIEFtb3VudCB0byBjaGFuZ2UgdGhlIHBlcmlvZCBvZiB0aGUgd2F2ZSBieSBhdCB0aGUgcGVhayBvZiB0aGUgdmlicmF0byB3YXZlXG4gICAgICAgIF92aWJyYXRvQW1wbGl0dWRlID0gcFsnaiddIC8gMixcbiAgICAgICAgLy8gU3BlZWQgYXQgd2hpY2ggdGhlIHZpYnJhdG8gcGhhc2UgbW92ZXNcbiAgICAgICAgX3ZpYnJhdG9TcGVlZCA9IHBbJ2snXSAqIHBbJ2snXSAqIC4wMSxcbiAgICAgICAgLy8gVGhlIHR5cGUgb2Ygd2F2ZSB0byBnZW5lcmF0ZVxuICAgICAgICBfd2F2ZVR5cGUgPSBwWydhJ107XG5cbiAgICB2YXIgX2VudmVsb3BlTGVuZ3RoICAgICAgPSBfZW52ZWxvcGVMZW5ndGgwLCAgICAgLy8gTGVuZ3RoIG9mIHRoZSBjdXJyZW50IGVudmVsb3BlIHN0YWdlXG4gICAgICAgIF9lbnZlbG9wZU92ZXJMZW5ndGgwID0gMSAvIF9lbnZlbG9wZUxlbmd0aDAsIC8vIChmb3IgcXVpY2sgY2FsY3VsYXRpb25zKVxuICAgICAgICBfZW52ZWxvcGVPdmVyTGVuZ3RoMSA9IDEgLyBfZW52ZWxvcGVMZW5ndGgxLCAvLyAoZm9yIHF1aWNrIGNhbGN1bGF0aW9ucylcbiAgICAgICAgX2VudmVsb3BlT3Zlckxlbmd0aDIgPSAxIC8gX2VudmVsb3BlTGVuZ3RoMjsgLy8gKGZvciBxdWljayBjYWxjdWxhdGlvbnMpXG5cbiAgICAvLyBEYW1waW5nIG11bGlwbGllciB3aGljaCByZXN0cmljdHMgaG93IGZhc3QgdGhlIHdhdmUgcG9zaXRpb24gY2FuIG1vdmVcbiAgICB2YXIgX2xwRmlsdGVyRGFtcGluZyA9IDUgLyAoMSArIHBbJ3UnXSAqIHBbJ3UnXSAqIDIwKSAqICguMDEgKyBfbHBGaWx0ZXJDdXRvZmYpO1xuICAgIGlmIChfbHBGaWx0ZXJEYW1waW5nID4gLjgpIHtcbiAgICAgIF9scEZpbHRlckRhbXBpbmcgPSAuODtcbiAgICB9XG4gICAgX2xwRmlsdGVyRGFtcGluZyA9IDEgLSBfbHBGaWx0ZXJEYW1waW5nO1xuXG4gICAgdmFyIF9maW5pc2hlZCA9IGZhbHNlLCAgICAgLy8gSWYgdGhlIHNvdW5kIGhhcyBmaW5pc2hlZFxuICAgICAgICBfZW52ZWxvcGVTdGFnZSAgICA9IDAsIC8vIEN1cnJlbnQgc3RhZ2Ugb2YgdGhlIGVudmVsb3BlIChhdHRhY2ssIHN1c3RhaW4sIGRlY2F5LCBlbmQpXG4gICAgICAgIF9lbnZlbG9wZVRpbWUgICAgID0gMCwgLy8gQ3VycmVudCB0aW1lIHRocm91Z2ggY3VycmVudCBlbmVsb3BlIHN0YWdlXG4gICAgICAgIF9lbnZlbG9wZVZvbHVtZSAgID0gMCwgLy8gQ3VycmVudCB2b2x1bWUgb2YgdGhlIGVudmVsb3BlXG4gICAgICAgIF9ocEZpbHRlclBvcyAgICAgID0gMCwgLy8gQWRqdXN0ZWQgd2F2ZSBwb3NpdGlvbiBhZnRlciBoaWdoLXBhc3MgZmlsdGVyXG4gICAgICAgIF9scEZpbHRlckRlbHRhUG9zID0gMCwgLy8gQ2hhbmdlIGluIGxvdy1wYXNzIHdhdmUgcG9zaXRpb24sIGFzIGFsbG93ZWQgYnkgdGhlIGN1dG9mZiBhbmQgZGFtcGluZ1xuICAgICAgICBfbHBGaWx0ZXJPbGRQb3MsICAgICAgIC8vIFByZXZpb3VzIGxvdy1wYXNzIHdhdmUgcG9zaXRpb25cbiAgICAgICAgX2xwRmlsdGVyUG9zICAgICAgPSAwLCAvLyBBZGp1c3RlZCB3YXZlIHBvc2l0aW9uIGFmdGVyIGxvdy1wYXNzIGZpbHRlclxuICAgICAgICBfcGVyaW9kVGVtcCwgICAgICAgICAgIC8vIFBlcmlvZCBtb2RpZmllZCBieSB2aWJyYXRvXG4gICAgICAgIF9waGFzZSAgICAgICAgICAgID0gMCwgLy8gUGhhc2UgdGhyb3VnaCB0aGUgd2F2ZVxuICAgICAgICBfcGhhc2VySW50LCAgICAgICAgICAgIC8vIEludGVnZXIgcGhhc2VyIG9mZnNldCwgZm9yIGJpdCBtYXRoc1xuICAgICAgICBfcGhhc2VyUG9zICAgICAgICA9IDAsIC8vIFBvc2l0aW9uIHRocm91Z2ggdGhlIHBoYXNlciBidWZmZXJcbiAgICAgICAgX3BvcywgICAgICAgICAgICAgICAgICAvLyBQaGFzZSBleHByZXNlZCBhcyBhIE51bWJlciBmcm9tIDAtMSwgdXNlZCBmb3IgZmFzdCBzaW4gYXBwcm94XG4gICAgICAgIF9yZXBlYXRUaW1lICAgICAgID0gMCwgLy8gQ291bnRlciBmb3IgdGhlIHJlcGVhdHNcbiAgICAgICAgX3NhbXBsZSwgICAgICAgICAgICAgICAvLyBTdWItc2FtcGxlIGNhbGN1bGF0ZWQgOCB0aW1lcyBwZXIgYWN0dWFsIHNhbXBsZSwgYXZlcmFnZWQgb3V0IHRvIGdldCB0aGUgc3VwZXIgc2FtcGxlXG4gICAgICAgIF9zdXBlclNhbXBsZSwgICAgICAgICAgLy8gQWN0dWFsIHNhbXBsZSB3cml0ZW4gdG8gdGhlIHdhdmVcbiAgICAgICAgX3ZpYnJhdG9QaGFzZSAgICAgPSAwOyAvLyBQaGFzZSB0aHJvdWdoIHRoZSB2aWJyYXRvIHNpbmUgd2F2ZVxuXG4gICAgLy8gQnVmZmVyIG9mIHdhdmUgdmFsdWVzIHVzZWQgdG8gY3JlYXRlIHRoZSBvdXQgb2YgcGhhc2Ugc2Vjb25kIHdhdmVcbiAgICB2YXIgX3BoYXNlckJ1ZmZlciA9IG5ldyBBcnJheSgxMDI0KSxcbiAgICAgICAgLy8gQnVmZmVyIG9mIHJhbmRvbSB2YWx1ZXMgdXNlZCB0byBnZW5lcmF0ZSBub2lzZVxuICAgICAgICBfbm9pc2VCdWZmZXIgID0gbmV3IEFycmF5KDMyKTtcbiAgICBmb3IgKHZhciBpID0gX3BoYXNlckJ1ZmZlci5sZW5ndGg7IGktLTsgKSB7XG4gICAgICBfcGhhc2VyQnVmZmVyW2ldID0gMDtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IF9ub2lzZUJ1ZmZlci5sZW5ndGg7IGktLTsgKSB7XG4gICAgICBfbm9pc2VCdWZmZXJbaV0gPSBNYXRoLnJhbmRvbSgpICogMiAtIDE7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKF9maW5pc2hlZCkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVwZWF0cyBldmVyeSBfcmVwZWF0TGltaXQgdGltZXMsIHBhcnRpYWxseSByZXNldHRpbmcgdGhlIHNvdW5kIHBhcmFtZXRlcnNcbiAgICAgIGlmIChfcmVwZWF0TGltaXQpIHtcbiAgICAgICAgaWYgKCsrX3JlcGVhdFRpbWUgPj0gX3JlcGVhdExpbWl0KSB7XG4gICAgICAgICAgX3JlcGVhdFRpbWUgPSAwO1xuICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBfY2hhbmdlTGltaXQgaXMgcmVhY2hlZCwgc2hpZnRzIHRoZSBwaXRjaFxuICAgICAgaWYgKF9jaGFuZ2VMaW1pdCkge1xuICAgICAgICBpZiAoKytfY2hhbmdlVGltZSA+PSBfY2hhbmdlTGltaXQpIHtcbiAgICAgICAgICBfY2hhbmdlTGltaXQgPSAwO1xuICAgICAgICAgIF9wZXJpb2QgKj0gX2NoYW5nZUFtb3VudDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBY2NjZWxlcmF0ZSBhbmQgYXBwbHkgc2xpZGVcbiAgICAgIF9zbGlkZSArPSBfZGVsdGFTbGlkZTtcbiAgICAgIF9wZXJpb2QgKj0gX3NsaWRlO1xuXG4gICAgICAvLyBDaGVja3MgZm9yIGZyZXF1ZW5jeSBnZXR0aW5nIHRvbyBsb3csIGFuZCBzdG9wcyB0aGUgc291bmQgaWYgYSBtaW5GcmVxdWVuY3kgd2FzIHNldFxuICAgICAgaWYgKF9wZXJpb2QgPiBfbWF4UGVyaW9kKSB7XG4gICAgICAgIF9wZXJpb2QgPSBfbWF4UGVyaW9kO1xuICAgICAgICBpZiAoX21pbkZyZXFlbmN5ID4gMCkge1xuICAgICAgICAgIF9maW5pc2hlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgX3BlcmlvZFRlbXAgPSBfcGVyaW9kO1xuXG4gICAgICAvLyBBcHBsaWVzIHRoZSB2aWJyYXRvIGVmZmVjdFxuICAgICAgaWYgKF92aWJyYXRvQW1wbGl0dWRlID4gMCkge1xuICAgICAgICBfdmlicmF0b1BoYXNlICs9IF92aWJyYXRvU3BlZWQ7XG4gICAgICAgIF9wZXJpb2RUZW1wICo9IDEgKyBNYXRoLnNpbihfdmlicmF0b1BoYXNlKSAqIF92aWJyYXRvQW1wbGl0dWRlO1xuICAgICAgfVxuXG4gICAgICBfcGVyaW9kVGVtcCB8PSAwO1xuICAgICAgaWYgKF9wZXJpb2RUZW1wIDwgOCkge1xuICAgICAgICBfcGVyaW9kVGVtcCA9IDg7XG4gICAgICB9XG5cbiAgICAgIC8vIFN3ZWVwcyB0aGUgc3F1YXJlIGR1dHlcbiAgICAgIGlmICghX3dhdmVUeXBlKSB7XG4gICAgICAgIF9zcXVhcmVEdXR5ICs9IF9kdXR5U3dlZXA7XG4gICAgICAgIGlmIChfc3F1YXJlRHV0eSA8IDApIHtcbiAgICAgICAgICBfc3F1YXJlRHV0eSA9IDA7XG4gICAgICAgIH0gZWxzZSBpZiAoX3NxdWFyZUR1dHkgPiAuNSkge1xuICAgICAgICAgIF9zcXVhcmVEdXR5ID0gLjU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTW92ZXMgdGhyb3VnaCB0aGUgZGlmZmVyZW50IHN0YWdlcyBvZiB0aGUgdm9sdW1lIGVudmVsb3BlXG4gICAgICBpZiAoKytfZW52ZWxvcGVUaW1lID4gX2VudmVsb3BlTGVuZ3RoKSB7XG4gICAgICAgIF9lbnZlbG9wZVRpbWUgPSAwO1xuXG4gICAgICAgIHN3aXRjaCAoKytfZW52ZWxvcGVTdGFnZSkgIHtcbiAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBfZW52ZWxvcGVMZW5ndGggPSBfZW52ZWxvcGVMZW5ndGgxO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgX2VudmVsb3BlTGVuZ3RoID0gX2VudmVsb3BlTGVuZ3RoMjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBTZXRzIHRoZSB2b2x1bWUgYmFzZWQgb24gdGhlIHBvc2l0aW9uIGluIHRoZSBlbnZlbG9wZVxuICAgICAgc3dpdGNoIChfZW52ZWxvcGVTdGFnZSkge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgX2VudmVsb3BlVm9sdW1lID0gX2VudmVsb3BlVGltZSAqIF9lbnZlbG9wZU92ZXJMZW5ndGgwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgX2VudmVsb3BlVm9sdW1lID0gMSArICgxIC0gX2VudmVsb3BlVGltZSAqIF9lbnZlbG9wZU92ZXJMZW5ndGgxKSAqIDIgKiBfc3VzdGFpblB1bmNoO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgX2VudmVsb3BlVm9sdW1lID0gMSAtIF9lbnZlbG9wZVRpbWUgKiBfZW52ZWxvcGVPdmVyTGVuZ3RoMjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIF9lbnZlbG9wZVZvbHVtZSA9IDA7XG4gICAgICAgICAgX2ZpbmlzaGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gTW92ZXMgdGhlIHBoYXNlciBvZmZzZXRcbiAgICAgIGlmIChfcGhhc2VyKSB7XG4gICAgICAgIF9waGFzZXJPZmZzZXQgKz0gX3BoYXNlckRlbHRhT2Zmc2V0O1xuICAgICAgICBfcGhhc2VySW50ID0gX3BoYXNlck9mZnNldCB8IDA7XG4gICAgICAgIGlmIChfcGhhc2VySW50IDwgMCkge1xuICAgICAgICAgIF9waGFzZXJJbnQgPSAtX3BoYXNlckludDtcbiAgICAgICAgfSBlbHNlIGlmIChfcGhhc2VySW50ID4gMTAyMykge1xuICAgICAgICAgIF9waGFzZXJJbnQgPSAxMDIzO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1vdmVzIHRoZSBoaWdoLXBhc3MgZmlsdGVyIGN1dG9mZlxuICAgICAgaWYgKF9maWx0ZXJzICYmIF9ocEZpbHRlckRlbHRhQ3V0b2ZmKSB7XG4gICAgICAgIF9ocEZpbHRlckN1dG9mZiAqPSBfaHBGaWx0ZXJEZWx0YUN1dG9mZjtcbiAgICAgICAgaWYgKF9ocEZpbHRlckN1dG9mZiA8IC4wMDAwMSkge1xuICAgICAgICAgIF9ocEZpbHRlckN1dG9mZiA9IC4wMDAwMTtcbiAgICAgICAgfSBlbHNlIGlmIChfaHBGaWx0ZXJDdXRvZmYgPiAuMSkge1xuICAgICAgICAgIF9ocEZpbHRlckN1dG9mZiA9IC4xO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIF9zdXBlclNhbXBsZSA9IDA7XG4gICAgICBmb3IgKHZhciBqID0gODsgai0tOyApIHtcbiAgICAgICAgLy8gQ3ljbGVzIHRocm91Z2ggdGhlIHBlcmlvZFxuICAgICAgICBfcGhhc2UrKztcbiAgICAgICAgaWYgKF9waGFzZSA+PSBfcGVyaW9kVGVtcCkge1xuICAgICAgICAgIF9waGFzZSAlPSBfcGVyaW9kVGVtcDtcblxuICAgICAgICAgIC8vIEdlbmVyYXRlcyBuZXcgcmFuZG9tIG5vaXNlIGZvciB0aGlzIHBlcmlvZFxuICAgICAgICAgIGlmIChfd2F2ZVR5cGUgPT0gMykge1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IF9ub2lzZUJ1ZmZlci5sZW5ndGg7IG4tLTsgKSB7XG4gICAgICAgICAgICAgIF9ub2lzZUJ1ZmZlcltuXSA9IE1hdGgucmFuZG9tKCkgKiAyIC0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXRzIHRoZSBzYW1wbGUgZnJvbSB0aGUgb3NjaWxsYXRvclxuICAgICAgICBzd2l0Y2ggKF93YXZlVHlwZSkge1xuICAgICAgICAgIGNhc2UgMDogLy8gU3F1YXJlIHdhdmVcbiAgICAgICAgICAgIF9zYW1wbGUgPSAoKF9waGFzZSAvIF9wZXJpb2RUZW1wKSA8IF9zcXVhcmVEdXR5KSA/IC41IDogLS41O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxOiAvLyBTYXcgd2F2ZVxuICAgICAgICAgICAgX3NhbXBsZSA9IDEgLSBfcGhhc2UgLyBfcGVyaW9kVGVtcCAqIDI7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDI6IC8vIFNpbmUgd2F2ZSAoZmFzdCBhbmQgYWNjdXJhdGUgYXBwcm94KVxuICAgICAgICAgICAgX3BvcyA9IF9waGFzZSAvIF9wZXJpb2RUZW1wO1xuICAgICAgICAgICAgX3BvcyA9IChfcG9zID4gLjUgPyBfcG9zIC0gMSA6IF9wb3MpICogNi4yODMxODUzMTtcbiAgICAgICAgICAgIF9zYW1wbGUgPSAxLjI3MzIzOTU0ICogX3BvcyArIC40MDUyODQ3MzUgKiBfcG9zICogX3BvcyAqIChfcG9zIDwgMCA/IDEgOiAtMSk7XG4gICAgICAgICAgICBfc2FtcGxlID0gLjIyNSAqICgoX3NhbXBsZSA8IDAgPyAtMSA6IDEpICogX3NhbXBsZSAqIF9zYW1wbGUgIC0gX3NhbXBsZSkgKyBfc2FtcGxlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAzOiAvLyBOb2lzZVxuICAgICAgICAgICAgX3NhbXBsZSA9IF9ub2lzZUJ1ZmZlcltNYXRoLmFicyhfcGhhc2UgKiAzMiAvIF9wZXJpb2RUZW1wIHwgMCldO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXBwbGllcyB0aGUgbG93IGFuZCBoaWdoIHBhc3MgZmlsdGVyc1xuICAgICAgICBpZiAoX2ZpbHRlcnMpIHtcbiAgICAgICAgICBfbHBGaWx0ZXJPbGRQb3MgPSBfbHBGaWx0ZXJQb3M7XG4gICAgICAgICAgX2xwRmlsdGVyQ3V0b2ZmICo9IF9scEZpbHRlckRlbHRhQ3V0b2ZmO1xuICAgICAgICAgIGlmIChfbHBGaWx0ZXJDdXRvZmYgPCAwKSB7XG4gICAgICAgICAgICBfbHBGaWx0ZXJDdXRvZmYgPSAwO1xuICAgICAgICAgIH0gZWxzZSBpZiAoX2xwRmlsdGVyQ3V0b2ZmID4gLjEpIHtcbiAgICAgICAgICAgIF9scEZpbHRlckN1dG9mZiA9IC4xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChfbHBGaWx0ZXJPbikge1xuICAgICAgICAgICAgX2xwRmlsdGVyRGVsdGFQb3MgKz0gKF9zYW1wbGUgLSBfbHBGaWx0ZXJQb3MpICogX2xwRmlsdGVyQ3V0b2ZmO1xuICAgICAgICAgICAgX2xwRmlsdGVyRGVsdGFQb3MgKj0gX2xwRmlsdGVyRGFtcGluZztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX2xwRmlsdGVyUG9zID0gX3NhbXBsZTtcbiAgICAgICAgICAgIF9scEZpbHRlckRlbHRhUG9zID0gMDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBfbHBGaWx0ZXJQb3MgKz0gX2xwRmlsdGVyRGVsdGFQb3M7XG5cbiAgICAgICAgICBfaHBGaWx0ZXJQb3MgKz0gX2xwRmlsdGVyUG9zIC0gX2xwRmlsdGVyT2xkUG9zO1xuICAgICAgICAgIF9ocEZpbHRlclBvcyAqPSAxIC0gX2hwRmlsdGVyQ3V0b2ZmO1xuICAgICAgICAgIF9zYW1wbGUgPSBfaHBGaWx0ZXJQb3M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBcHBsaWVzIHRoZSBwaGFzZXIgZWZmZWN0XG4gICAgICAgIGlmIChfcGhhc2VyKSB7XG4gICAgICAgICAgX3BoYXNlckJ1ZmZlcltfcGhhc2VyUG9zICUgMTAyNF0gPSBfc2FtcGxlO1xuICAgICAgICAgIF9zYW1wbGUgKz0gX3BoYXNlckJ1ZmZlclsoX3BoYXNlclBvcyAtIF9waGFzZXJJbnQgKyAxMDI0KSAlIDEwMjRdO1xuICAgICAgICAgIF9waGFzZXJQb3MrKztcbiAgICAgICAgfVxuXG4gICAgICAgIF9zdXBlclNhbXBsZSArPSBfc2FtcGxlO1xuICAgICAgfVxuXG4gICAgICAvLyBBdmVyYWdlcyBvdXQgdGhlIHN1cGVyIHNhbXBsZXMgYW5kIGFwcGxpZXMgdm9sdW1lc1xuICAgICAgX3N1cGVyU2FtcGxlICo9IC4xMjUgKiBfZW52ZWxvcGVWb2x1bWUgKiBfbWFzdGVyVm9sdW1lO1xuXG4gICAgICAvLyBDbGlwcGluZyBpZiB0b28gbG91ZFxuICAgICAgYnVmZmVyW2ldID0gX3N1cGVyU2FtcGxlID49IDEgPyAzMjc2NyA6IF9zdXBlclNhbXBsZSA8PSAtMSA/IC0zMjc2OCA6IF9zdXBlclNhbXBsZSAqIDMyNzY3IHwgMDtcbiAgICB9XG5cbiAgICByZXR1cm4gbGVuZ3RoO1xuICB9XG59XG5cbi8vIEFkYXB0ZWQgZnJvbSBodHRwOi8vY29kZWJhc2UuZXMvcmlmZndhdmUvXG52YXIgc3ludGggPSBuZXcgU2Z4clN5bnRoKCk7XG4vLyBFeHBvcnQgZm9yIHRoZSBDbG9zdXJlIENvbXBpbGVyXG53aW5kb3dbJ2pzZnhyJ10gPSBmdW5jdGlvbihzZXR0aW5ncykge1xuICAvLyBJbml0aWFsaXplIFNmeHJQYXJhbXNcbiAgc3ludGguX3BhcmFtcy5zZXRTZXR0aW5ncyhzZXR0aW5ncyk7XG4gIC8vIFN5bnRoZXNpemUgV2F2ZVxuICB2YXIgZW52ZWxvcGVGdWxsTGVuZ3RoID0gc3ludGgudG90YWxSZXNldCgpO1xuICB2YXIgZGF0YSA9IG5ldyBVaW50OEFycmF5KCgoZW52ZWxvcGVGdWxsTGVuZ3RoICsgMSkgLyAyIHwgMCkgKiA0ICsgNDQpO1xuICB2YXIgdXNlZCA9IHN5bnRoLnN5bnRoV2F2ZShuZXcgVWludDE2QXJyYXkoZGF0YS5idWZmZXIsIDQ0KSwgZW52ZWxvcGVGdWxsTGVuZ3RoKSAqIDI7XG4gIHZhciBkdiA9IG5ldyBVaW50MzJBcnJheShkYXRhLmJ1ZmZlciwgMCwgNDQpO1xuICAvLyBJbml0aWFsaXplIGhlYWRlclxuICBkdlswXSA9IDB4NDY0NjQ5NTI7IC8vIFwiUklGRlwiXG4gIGR2WzFdID0gdXNlZCArIDM2OyAgLy8gcHV0IHRvdGFsIHNpemUgaGVyZVxuICBkdlsyXSA9IDB4NDU1NjQxNTc7IC8vIFwiV0FWRVwiXG4gIGR2WzNdID0gMHgyMDc0NkQ2NjsgLy8gXCJmbXQgXCJcbiAgZHZbNF0gPSAweDAwMDAwMDEwOyAvLyBzaXplIG9mIHRoZSBmb2xsb3dpbmdcbiAgZHZbNV0gPSAweDAwMDEwMDAxOyAvLyBNb25vOiAxIGNoYW5uZWwsIFBDTSBmb3JtYXRcbiAgZHZbNl0gPSAweDAwMDBBQzQ0OyAvLyA0NCwxMDAgc2FtcGxlcyBwZXIgc2Vjb25kXG4gIGR2WzddID0gMHgwMDAxNTg4ODsgLy8gYnl0ZSByYXRlOiB0d28gYnl0ZXMgcGVyIHNhbXBsZVxuICBkdls4XSA9IDB4MDAxMDAwMDI7IC8vIDE2IGJpdHMgcGVyIHNhbXBsZSwgYWxpZ25lZCBvbiBldmVyeSB0d28gYnl0ZXNcbiAgZHZbOV0gPSAweDYxNzQ2MTY0OyAvLyBcImRhdGFcIlxuICBkdlsxMF0gPSB1c2VkOyAgICAgIC8vIHB1dCBudW1iZXIgb2Ygc2FtcGxlcyBoZXJlXG5cbiAgLy8gQmFzZTY0IGVuY29kaW5nIHdyaXR0ZW4gYnkgbWUsIEBtYWV0dGlnXG4gIHVzZWQgKz0gNDQ7XG4gIHZhciBpID0gMCxcbiAgICAgIGJhc2U2NENoYXJhY3RlcnMgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLycsXG4gICAgICBvdXRwdXQgPSAnZGF0YTphdWRpby93YXY7YmFzZTY0LCc7XG4gIGZvciAoOyBpIDwgdXNlZDsgaSArPSAzKVxuICB7XG4gICAgdmFyIGEgPSBkYXRhW2ldIDw8IDE2IHwgZGF0YVtpICsgMV0gPDwgOCB8IGRhdGFbaSArIDJdO1xuICAgIG91dHB1dCArPSBiYXNlNjRDaGFyYWN0ZXJzW2EgPj4gMThdICsgYmFzZTY0Q2hhcmFjdGVyc1thID4+IDEyICYgNjNdICsgYmFzZTY0Q2hhcmFjdGVyc1thID4+IDYgJiA2M10gKyBiYXNlNjRDaGFyYWN0ZXJzW2EgJiA2M107XG4gIH1cbiAgcmV0dXJuIG91dHB1dDtcbn1cblxudmFyIHVybCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTDtcblxuZnVuY3Rpb24gcGxheVNvdW5kKHBhcmFtcykge1xuICB0cnkge1xuICAgIHZhciBzb3VuZFVSTCA9IGpzZnhyKHBhcmFtcyk7XG4gICAgdmFyIHBsYXllciA9IG5ldyBBdWRpbygpO1xuICAgIHBsYXllci5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiRXJyb3I6IFwiICsgcGxheWVyLmVycm9yLmNvZGUpO1xuICAgIH0sIGZhbHNlKTtcbiAgICBwbGF5ZXIuc3JjID0gc291bmRVUkw7XG4gICAgcGxheWVyLnBsYXkoKTtcbiAgICBwbGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICB1cmwucmV2b2tlT2JqZWN0VVJMKHNvdW5kVVJMKTtcbiAgICB9LCBmYWxzZSk7XG4gIH0gY2F0Y2goZSkge1xuICAgIGNvbnNvbGUubG9nKGUubWVzc2FnZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcGxheVN0cmluZyhzdHIpIHtcbiAgIHZhciB0ZW1wID0gc3RyLnNwbGl0KFwiLFwiKTtcbiAgIHZhciBwYXJhbXMgPSBuZXcgQXJyYXkoKTtcbiAgIGZvcih2YXIgaSA9IDA7IGkgPCB0ZW1wLmxlbmd0aDsgaSsrKSB7XG4gICAgIHBhcmFtc1tpXSA9IHBhcnNlRmxvYXQodGVtcFtpXSk7XG4gICB9XG4gICBwbGF5U291bmQocGFyYW1zKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB3aW5kb3dbJ2pzZnhyJ107XG4iLCIvKiEga2V5ZHJvd24gLSB2MS4xLjAgLSAyMDE0LTAyLTE1IC0gaHR0cDovL2plcmVteWNrYWhuLmdpdGh1Yi5jb20va2V5ZHJvd24gKi9cbjsoZnVuY3Rpb24gKHdpbmRvdykge1xuXG52YXIgdXRpbCA9IChmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIHV0aWwgPSB7fTtcblxuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgT2JqZWN0IHRvIGl0ZXJhdGUgdGhyb3VnaC5cbiAgICogQHBhcmFtIHtmdW5jdGlvbigqLCBzdHJpbmcpfSBpdGVyYXRvciBUaGUgZnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCBwcm9wZXJ0eS5cbiAgICovXG4gIHV0aWwuZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmosIGl0ZXJhdG9yKSB7XG4gICAgdmFyIHByb3A7XG4gICAgZm9yIChwcm9wIGluIG9iaikge1xuICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICBpdGVyYXRvcihvYmpbcHJvcF0sIHByb3ApO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgdmFyIGZvckVhY2ggPSB1dGlsLmZvckVhY2g7XG5cblxuICAvKipcbiAgICogQ3JlYXRlIGEgdHJhbnNwb3NlZCBjb3B5IG9mIGFuIE9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9ialxuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuICB1dGlsLmdldFRyYW5zcG9zZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgdHJhbnNwb3NlID0ge307XG5cbiAgICBmb3JFYWNoKG9iaiwgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgICB0cmFuc3Bvc2VbdmFsXSA9IGtleTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0cmFuc3Bvc2U7XG4gIH07XG5cblxuICAvKipcbiAgICogSW1wbGVtZW50YXRpb24gb2YgQXJyYXkjaW5kZXhPZiBiZWNhdXNlIElFPDkgZG9lc24ndCBzdXBwb3J0IGl0LlxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5fSBhcnJcbiAgICogQHBhcmFtIHsqfSB2YWxcbiAgICogQHJldHVybiB7bnVtYmVyfSBJbmRleCBvZiB0aGUgZm91bmQgZWxlbWVudCBvciAtMSBpZiBub3QgZm91bmQuXG4gICAqL1xuICB1dGlsLmluZGV4T2YgPSBmdW5jdGlvbiAoYXJyLCB2YWwpIHtcbiAgICBpZiAoYXJyLmluZGV4T2YpIHtcbiAgICAgIHJldHVybiBhcnIuaW5kZXhPZih2YWwpO1xuICAgIH1cblxuICAgIHZhciBpLCBsZW4gPSBhcnIubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgaWYgKGFycltpXSA9PT0gdmFsKSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAtMTtcbiAgfTtcbiAgdmFyIGluZGV4T2YgPSB1dGlsLmluZGV4T2Y7XG5cblxuICAvKipcbiAgICogUHVzaCBhIHZhbHVlIG9udG8gYW4gYXJyYXkgaWYgaXQgaXMgbm90IHByZXNlbnQgaW4gdGhlIGFycmF5IGFscmVhZHkuICBPdGhlcndpc2UsIHRoaXMgaXMgYSBuby1vcC5cbiAgICpcbiAgICogQHBhcmFtIHtBcnJheX0gYXJyXG4gICAqIEBwYXJhbSB7Kn0gdmFsXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgb3Igbm90IHRoZSB2YWx1ZSB3YXMgYWRkZWQgdG8gdGhlIGFycmF5LlxuICAgKi9cbiAgdXRpbC5wdXNoVW5pcXVlID0gZnVuY3Rpb24gKGFyciwgdmFsKSB7XG4gICAgaWYgKGluZGV4T2YoYXJyLCB2YWwpID09PSAtMSkge1xuICAgICAgYXJyLnB1c2godmFsKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSB2YWx1ZSBmcm9tIGFuIGFycmF5LiAgQXNzdW1lcyB0aGVyZSBpcyBvbmx5IG9uZSBpbnN0YW5jZSBvZiB0aGUgdmFsdWUgcHJlc2VudCBpbiB0aGUgYXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXl9IGFyclxuICAgKiBAcGFyYW0geyp9IHZhbFxuICAgKiBAcmV0dXJuIHsqfSBUaGUgdmFsdWUgdGhhdCB3YXMgcmVtb3ZlZCBmcm9tIGFyci4gIFJldHVybnMgdW5kZWZpbmVkIGlmIG5vdGhpbmcgd2FzIHJlbW92ZWQuXG4gICAqL1xuICB1dGlsLnJlbW92ZVZhbHVlID0gZnVuY3Rpb24gKGFyciwgdmFsKSB7XG4gICAgdmFyIGluZGV4ID0gaW5kZXhPZihhcnIsIHZhbCk7XG5cbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICByZXR1cm4gYXJyLnNwbGljZShpbmRleCwgMSlbMF07XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIENyb3NzLWJyb3dzZXIgZnVuY3Rpb24gZm9yIGxpc3RlbmluZyBmb3IgYW5kIGhhbmRsaW5nIGFuIGV2ZW50IG9uIHRoZSBkb2N1bWVudCBlbGVtZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGhhbmRsZXJcbiAgICovXG4gIHV0aWwuZG9jdW1lbnRPbiA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICBpZiAod2luZG93LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQuYXR0YWNoRXZlbnQpIHtcbiAgICAgIGRvY3VtZW50LmF0dGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBTaGltIGZvciByZXF1ZXN0QW5pbWF0aW9uRnJhbWUuICBTZWU6IGh0dHA6Ly9wYXVsaXJpc2guY29tLzIwMTEvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1hbmltYXRpbmcvXG4gICAqL1xuICB1dGlsLnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIHx8XG4gICAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lICAgIHx8XG4gICAgICBmdW5jdGlvbiggY2FsbGJhY2sgKXtcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoY2FsbGJhY2ssIDEwMDAgLyA2MCk7XG4gICAgICB9O1xuICB9KSgpO1xuXG5cbiAgLyoqXG4gICAqIEFuIGVtcHR5IGZ1bmN0aW9uLiAgTk9PUCFcbiAgICovXG4gIHV0aWwubm9vcCA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gIHJldHVybiB1dGlsO1xuXG59KCkpO1xuXG4vKipcbiAqIExvb2t1cCB0YWJsZSBvZiBrZXlzIHRvIGtleUNvZGVzLlxuICpcbiAqIEB0eXBlIHtPYmplY3QuPG51bWJlcj59XG4gKi9cbnZhciBLRVlfTUFQID0ge1xuICAnQSc6IDY1XG4gICwnQic6IDY2XG4gICwnQyc6IDY3XG4gICwnRCc6IDY4XG4gICwnRSc6IDY5XG4gICwnRic6IDcwXG4gICwnRyc6IDcxXG4gICwnSCc6IDcyXG4gICwnSSc6IDczXG4gICwnSic6IDc0XG4gICwnSyc6IDc1XG4gICwnTCc6IDc2XG4gICwnTSc6IDc3XG4gICwnTic6IDc4XG4gICwnTyc6IDc5XG4gICwnUCc6IDgwXG4gICwnUSc6IDgxXG4gICwnUic6IDgyXG4gICwnUyc6IDgzXG4gICwnVCc6IDg0XG4gICwnVSc6IDg1XG4gICwnVic6IDg2XG4gICwnVyc6IDg3XG4gICwnWCc6IDg4XG4gICwnWSc6IDg5XG4gICwnWic6IDkwXG4gICwnRU5URVInOiAxM1xuICAsJ0VTQyc6IDI3XG4gICwnU1BBQ0UnOiAzMlxuICAsJ0xFRlQnOiAzN1xuICAsJ1VQJzogMzhcbiAgLCdSSUdIVCc6IDM5XG4gICwnRE9XTic6IDQwXG59O1xuXG5cbi8qKlxuICogVGhlIHRyYW5zcG9zZWQgdmVyc2lvbiBvZiBLRVlfTUFQLlxuICpcbiAqIEB0eXBlIHtPYmplY3QuPHN0cmluZz59XG4gKi9cbnZhciBUUkFOU1BPU0VEX0tFWV9NQVAgPSB1dGlsLmdldFRyYW5zcG9zZShLRVlfTUFQKTtcblxuLyohXG4gKiBAdHlwZSBBcnJheS48c3RyaW5nPlxuICovXG52YXIga2V5c0Rvd24gPSBbXTtcblxudmFyIEtleSA9IChmdW5jdGlvbiAoKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qKlxuICAgKiBSZXByZXNlbnRzIGEga2V5IG9uIHRoZSBrZXlib2FyZC4gIFlvdSdsbCBuZXZlciBhY3R1YWxseSBjYWxsIHRoaXMgbWV0aG9kIGRpcmVjdGx5OyBLZXkgT2JqZWN0cyBmb3IgZXZlcnkga2V5IHRoYXQgS2V5ZHJvd24gc3VwcG9ydHMgYXJlIGNyZWF0ZWQgZm9yIHlvdSB3aGVuIHRoZSBsaWJyYXJ5IGlzIGluaXRpYWxpemVkIChhcyBpbiwgd2hlbiB0aGUgZmlsZSBpcyBsb2FkZWQpLiAgWW91IHdpbGwsIGhvd2V2ZXIsIHVzZSB0aGUgYHByb3RvdHlwZWAgbWV0aG9kcyBiZWxvdyB0byBiaW5kIGZ1bmN0aW9ucyB0byBrZXkgc3RhdGVzLlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0ga2V5Q29kZSBUaGUga2V5Q29kZSBvZiB0aGUga2V5LlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGZ1bmN0aW9uIEtleSAoa2V5Q29kZSkge1xuICAgIHRoaXMua2V5Q29kZSA9IGtleUNvZGU7XG4gIH1cblxuXG4gIC8qIVxuICAgKiBUaGUgZnVuY3Rpb24gdG8gYmUgaW52b2tlZCBvbiBldmVyeSB0aWNrIHRoYXQgdGhlIGtleSBpcyBoZWxkIGRvd24gZm9yLlxuICAgKlxuICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAqL1xuICBLZXkucHJvdG90eXBlLl9kb3duSGFuZGxlciA9IHV0aWwubm9vcDtcblxuXG4gIC8qIVxuICAgKiBUaGUgZnVuY3Rpb24gdG8gYmUgaW52b2tlZCB3aGVuIHRoZSBrZXkgaXMgcmVsZWFzZWQuXG4gICAqXG4gICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICovXG4gIEtleS5wcm90b3R5cGUuX3VwSGFuZGxlciA9IHV0aWwubm9vcDtcblxuXG4gIC8qIVxuICAgKiBUaGUgZnVuY3Rpb24gdG8gYmUgaW52b2tlZCB3aGVuIHRoZSBrZXkgaXMgcHJlc3NlZC5cbiAgICpcbiAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgKi9cbiAgS2V5LnByb3RvdHlwZS5fcHJlc3NIYW5kbGVyID0gdXRpbC5ub29wO1xuXG5cbiAgLyohXG4gICAqIFByaXZhdGUgaGVscGVyIGZ1bmN0aW9uIHRoYXQgYmluZHMgb3IgaW52b2tlcyBhIGhhbmRlciBmb3IgYGRvd25gLCBgdXAnLCBvciBgcHJlc3NgIGZvciBhIGBLZXlgLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleX0ga2V5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBoYW5kbGVyTmFtZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uPX0gb3B0X2hhbmRsZXIgSWYgb21pdHRlZCwgdGhlIGhhbmRsZXIgaXMgaW52b2tlZC5cbiAgICovXG4gIGZ1bmN0aW9uIGJpbmRPckZpcmUgKGtleSwgaGFuZGxlck5hbWUsIG9wdF9oYW5kbGVyKSB7XG4gICAgaWYgKG9wdF9oYW5kbGVyKSB7XG4gICAgICBrZXlbaGFuZGxlck5hbWVdID0gb3B0X2hhbmRsZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleVtoYW5kbGVyTmFtZV0oKTtcbiAgICB9XG4gIH1cblxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGtleSBpcyBjdXJyZW50bHkgcHJlc3NlZCBvciBub3QuXG4gICAqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIGtleSBpcyBkb3duLCBvdGhlcndpc2UgZmFsc2UuXG4gICAqL1xuICBLZXkucHJvdG90eXBlLmlzRG93biA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdXRpbC5pbmRleE9mKGtleXNEb3duLCB0aGlzLmtleUNvZGUpICE9PSAtMTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBCaW5kIGEgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGtleSBpcyBoZWxkIGRvd24uXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb249fSBvcHRfaGFuZGxlciBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGtleSBpcyBoZWxkIGRvd24uICBJZiBvbWl0dGVkLCB0aGlzIGZ1bmN0aW9uIGludm9rZXMgd2hhdGV2ZXIgaGFuZGxlciB3YXMgcHJldmlvdXNseSBib3VuZC5cbiAgICovXG4gIEtleS5wcm90b3R5cGUuZG93biA9IGZ1bmN0aW9uIChvcHRfaGFuZGxlcikge1xuICAgIGJpbmRPckZpcmUodGhpcywgJ19kb3duSGFuZGxlcicsIG9wdF9oYW5kbGVyKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBCaW5kIGEgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGtleSBpcyByZWxlYXNlZC5cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbj19IG9wdF9oYW5kbGVyIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGUga2V5IGlzIHJlbGVhc2VkLiAgSWYgb21pdHRlZCwgdGhpcyBmdW5jdGlvbiBpbnZva2VzIHdoYXRldmVyIGhhbmRsZXIgd2FzIHByZXZpb3VzbHkgYm91bmQuXG4gICAqL1xuICBLZXkucHJvdG90eXBlLnVwID0gZnVuY3Rpb24gKG9wdF9oYW5kbGVyKSB7XG4gICAgYmluZE9yRmlyZSh0aGlzLCAnX3VwSGFuZGxlcicsIG9wdF9oYW5kbGVyKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBCaW5kIGEgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGtleSBpcyBwcmVzc2VkLiAgVGhpcyBoYW5kbGVyIHdpbGwgbm90IGZpcmUgYWdhaW4gdW50aWwgdGhlIGtleSBpcyByZWxlYXNlZCDigJQgaXQgZG9lcyBub3QgcmVwZWF0LlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uPX0gb3B0X2hhbmRsZXIgVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbmNlIHdoZW4gdGhlIGtleSBpcyBwcmVzc2VkLiAgSWYgb21pdHRlZCwgdGhpcyBmdW5jdGlvbiBpbnZva2VzIHdoYXRldmVyIGhhbmRsZXIgd2FzIHByZXZpb3VzbHkgYm91bmQuXG4gICAqL1xuICBLZXkucHJvdG90eXBlLnByZXNzID0gZnVuY3Rpb24gKG9wdF9oYW5kbGVyKSB7XG4gICAgYmluZE9yRmlyZSh0aGlzLCAnX3ByZXNzSGFuZGxlcicsIG9wdF9oYW5kbGVyKTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIGhhbmRsZXIgdGhhdCB3YXMgYm91bmQgd2l0aCBbYGtkLktleSNkb3duYF0oI2Rvd24pLlxuICAgKi9cbiAgS2V5LnByb3RvdHlwZS51bmJpbmREb3duID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2Rvd25IYW5kbGVyID0gdXRpbC5ub29wO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIFJlbW92ZSB0aGUgaGFuZGxlciB0aGF0IHdhcyBib3VuZCB3aXRoIFtga2QuS2V5I3VwYF0oI3VwKS5cbiAgICovXG4gIEtleS5wcm90b3R5cGUudW5iaW5kVXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fdXBIYW5kbGVyID0gdXRpbC5ub29wO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIFJlbW92ZSB0aGUgaGFuZGxlciB0aGF0IHdhcyBib3VuZCB3aXRoIFtga2QuS2V5I3ByZXNzYF0oI3ByZXNzKS5cbiAgICovXG4gIEtleS5wcm90b3R5cGUudW5iaW5kUHJlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fcHJlc3NIYW5kbGVyID0gdXRpbC5ub29wO1xuICB9O1xuXG4gIHJldHVybiBLZXk7XG5cbn0oKSk7XG5cbnZhciBrZCA9IChmdW5jdGlvbiAoa2V5c0Rvd24pIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIGtkID0ge307XG4gIGtkLktleSA9IEtleTtcblxuICB2YXIgaXNSdW5uaW5nID0gZmFsc2U7XG5cblxuICAvKipcbiAgICogRXZhbHVhdGUgd2hpY2gga2V5cyBhcmUgaGVsZCBkb3duIGFuZCBpbnZva2UgdGhlaXIgaGFuZGxlciBmdW5jdGlvbnMuXG4gICAqL1xuICBrZC50aWNrID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBpLCBsZW4gPSBrZXlzRG93bi5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB2YXIga2V5Q29kZSA9IGtleXNEb3duW2ldO1xuXG4gICAgICB2YXIga2V5TmFtZSA9IFRSQU5TUE9TRURfS0VZX01BUFtrZXlDb2RlXTtcbiAgICAgIGlmIChrZXlOYW1lKSB7XG4gICAgICAgIGtkW2tleU5hbWVdLmRvd24oKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogQSBiYXNpYyBydW4gbG9vcC4gIGBoYW5kbGVyYCBnZXRzIGNhbGxlZCBhcHByb3hpbWF0ZWx5IDYwIHRpbWVzIGEgc2Vjb25kLlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBoYW5kbGVyIFRoZSBmdW5jdGlvbiB0byBjYWxsIG9uIGV2ZXJ5IHRpY2suICBZb3UgYWxtb3N0IGNlcnRhaW5seSB3YW50IHRvIGNhbGwgYGtkLnRpY2tgIGluIHRoaXMgZnVuY3Rpb24uXG4gICAqL1xuICBrZC5ydW4gPSBmdW5jdGlvbiAoaGFuZGxlcikge1xuICAgIGlzUnVubmluZyA9IHRydWU7XG5cbiAgICB1dGlsLnJlcXVlc3RBbmltYXRpb25GcmFtZS5jYWxsKHdpbmRvdywgZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCFpc1J1bm5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBrZC5ydW4oaGFuZGxlcik7XG4gICAgICBoYW5kbGVyKCk7XG4gICAgfSk7XG4gIH07XG5cblxuICAvKipcbiAgICogQ2FuY2VscyB0aGUgbG9vcCBjcmVhdGVkIGJ5IFtga2QucnVuYF0oI3J1bikuXG4gICAqL1xuICBrZC5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgIGlzUnVubmluZyA9IGZhbHNlO1xuICB9O1xuXG5cbiAgLy8gU0VUVVBcbiAgLy9cblxuXG4gIC8vIEluaXRpYWxpemUgdGhlIEtFWSBPYmplY3RzXG4gIHV0aWwuZm9yRWFjaChLRVlfTUFQLCBmdW5jdGlvbiAoa2V5Q29kZSwga2V5TmFtZSkge1xuICAgIGtkW2tleU5hbWVdID0gbmV3IEtleShrZXlDb2RlKTtcbiAgfSk7XG5cbiAgdXRpbC5kb2N1bWVudE9uKCdrZXlkb3duJywgZnVuY3Rpb24gKGV2dCkge1xuICAgIHZhciBrZXlDb2RlID0gZXZ0LmtleUNvZGU7XG4gICAgdmFyIGtleU5hbWUgPSBUUkFOU1BPU0VEX0tFWV9NQVBba2V5Q29kZV07XG4gICAgdmFyIGlzTmV3ID0gdXRpbC5wdXNoVW5pcXVlKGtleXNEb3duLCBrZXlDb2RlKTtcblxuICAgIGlmIChpc05ldyAmJiBrZFtrZXlOYW1lXSkge1xuICAgICAga2Rba2V5TmFtZV0ucHJlc3MoKTtcbiAgICB9XG4gIH0pO1xuXG4gIHV0aWwuZG9jdW1lbnRPbigna2V5dXAnLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgdmFyIGtleUNvZGUgPSB1dGlsLnJlbW92ZVZhbHVlKGtleXNEb3duLCBldnQua2V5Q29kZSk7XG5cbiAgICB2YXIga2V5TmFtZSA9IFRSQU5TUE9TRURfS0VZX01BUFtrZXlDb2RlXTtcbiAgICBpZiAoa2V5TmFtZSkge1xuICAgICAga2Rba2V5TmFtZV0udXAoKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIFN0b3AgZmlyaW5nIHRoZSBcImRvd25cIiBoYW5kbGVycyBpZiB0aGUgdXNlciBsb3NlcyBmb2N1cyBvZiB0aGUgYnJvd3NlclxuICAvLyB3aW5kb3cuXG4gIHV0aWwuZG9jdW1lbnRPbignYmx1cicsIGZ1bmN0aW9uIChldnQpIHtcbiAgICBrZXlzRG93bi5sZW5ndGggPSAwO1xuICB9KTtcblxuXG4gIHJldHVybiBrZDtcblxuLyohXG4gKiBUaGUgdmFyaWFibGVzIHBhc3NlZCBpbnRvIHRoZSBjbG9zdXJlIGhlcmUgYXJlIGRlZmluZWQgaW4ga2Qua2V5LmpzLlxuICovIC8qISovXG59KGtleXNEb3duKSk7XG5cbmlmICh0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gXCJvYmplY3RcIikge1xuICAvLyBLZXlkcm93biB3YXMgbG9hZGVkIGFzIGEgQ29tbW9uSlMgbW9kdWxlIChieSBCcm93c2VyaWZ5LCBmb3IgZXhhbXBsZSkuXG4gIG1vZHVsZS5leHBvcnRzID0ga2Q7XG59IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gIC8vIEtleWRyb3duIHdhcyBsb2FkZWQgYXMgYW4gQU1EIG1vZHVsZS5cbiAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ga2Q7XG4gIH0pO1xufSBlbHNlIHtcbiAgd2luZG93LmtkID0ga2Q7XG59XG5cbn0gKHdpbmRvdykpO1xuIiwiLy8gSG9sZHMgbGFzdCBpdGVyYXRpb24gdGltZXN0YW1wLlxudmFyIHRpbWUgPSAwO1xuXG4vKipcbiAqIENhbGxzIGBmbmAgb24gbmV4dCBmcmFtZS5cbiAqXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uXG4gKiBAcmV0dXJuIHtpbnR9IFRoZSByZXF1ZXN0IElEXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gcmFmKGZuKSB7XG4gIHJldHVybiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIHZhciBlbGFwc2VkID0gbm93IC0gdGltZTtcblxuICAgIGlmIChlbGFwc2VkID4gOTk5KSB7XG4gICAgICBlbGFwc2VkID0gMSAvIDYwO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbGFwc2VkIC89IDEwMDA7XG4gICAgfVxuXG4gICAgdGltZSA9IG5vdztcbiAgICBmbihlbGFwc2VkKTtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAvKipcbiAgICogQ2FsbHMgYGZuYCBvbiBldmVyeSBmcmFtZSB3aXRoIGBlbGFwc2VkYCBzZXQgdG8gdGhlIGVsYXBzZWRcbiAgICogdGltZSBpbiBtaWxsaXNlY29uZHMuXG4gICAqXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb25cbiAgICogQHJldHVybiB7aW50fSBUaGUgcmVxdWVzdCBJRFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cbiAgc3RhcnQ6IGZ1bmN0aW9uKGZuKSB7XG4gICAgcmV0dXJuIHJhZihmdW5jdGlvbiB0aWNrKGVsYXBzZWQpIHtcbiAgICAgIGZuKGVsYXBzZWQpO1xuICAgICAgcmFmKHRpY2spO1xuICAgIH0pO1xuICB9LFxuICAvKipcbiAgICogQ2FuY2VscyB0aGUgc3BlY2lmaWVkIGFuaW1hdGlvbiBmcmFtZSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge2ludH0gaWQgVGhlIHJlcXVlc3QgSURcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG4gIHN0b3A6IGZ1bmN0aW9uKGlkKSB7XG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKTtcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VlZCkge1xuICB2YXIgcmFuZG9tID0gd2hyYW5kb20oc2VlZCk7XG4gIHZhciBybmcgPSB7XG4gICAgLyoqXG4gICAgICogUmV0dXJuIGFuIGludGVnZXIgd2l0aGluIFswLCBtYXgpLlxuICAgICAqXG4gICAgICogQHBhcmFtICB7aW50fSBbbWF4XVxuICAgICAqIEByZXR1cm4ge2ludH1cbiAgICAgKiBAYXBpIHB1YmxpY1xuICAgICAqL1xuICAgIGludDogZnVuY3Rpb24obWF4KSB7XG4gICAgICByZXR1cm4gcmFuZG9tKCkgKiAobWF4IHx8IDB4ZmZmZmZmZikgfCAwO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGEgZmxvYXQgd2l0aGluIFswLjAsIDEuMCkuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtmbG9hdH1cbiAgICAgKiBAYXBpIHB1YmxpY1xuICAgICAqL1xuICAgIGZsb2F0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByYW5kb20oKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFJldHVybiBhIGJvb2xlYW4uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqIEBhcGkgcHVibGljXG4gICAgICovXG4gICAgYm9vbDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcmFuZG9tKCkgPiAwLjU7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBSZXR1cm4gYW4gaW50ZWdlciB3aXRoaW4gW21pbiwgbWF4KS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSAge2ludH0gbWluXG4gICAgICogQHBhcmFtICB7aW50fSBtYXhcbiAgICAgKiBAcmV0dXJuIHtpbnR9XG4gICAgICogQGFwaSBwdWJsaWNcbiAgICAgKi9cbiAgICByYW5nZTogZnVuY3Rpb24obWluLCBtYXgpIHtcbiAgICAgIHJldHVybiBybmcuaW50KG1heCAtIG1pbikgKyBtaW47XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBQaWNrIGFuIGVsZW1lbnQgZnJvbSB0aGUgc291cmNlLlxuICAgICAqXG4gICAgICogQHBhcmFtICB7bWl4ZWRbXX0gc291cmNlXG4gICAgICogQHJldHVybiB7bWl4ZWR9XG4gICAgICogQGFwaSBwdWJsaWNcbiAgICAgKi9cbiAgICBwaWNrOiBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIHJldHVybiBzb3VyY2Vbcm5nLnJhbmdlKDAsIHNvdXJjZS5sZW5ndGgpXTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHJuZztcbn07XG5cbi8qKlxuICogR2VuZXJhdGUgYSBzZWVkZWQgcmFuZG9tIG51bWJlciB1c2luZyBQeXRob24ncyB3aHJhbmRvbSBpbXBsZW1lbnRhdGlvbi5cbiAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vaWFuYi93aHJhbmRvbSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAqXG4gKiBAcGFyYW0gIHtpbnR9IFtzZWVkXVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gd2hyYW5kb20oc2VlZCkge1xuICBpZiAoIXNlZWQpIHtcbiAgICBzZWVkID0gRGF0ZS5ub3coKTtcbiAgfVxuXG4gIHZhciB4ID0gKHNlZWQgJSAzMDI2OCkgKyAxO1xuICBzZWVkID0gKHNlZWQgLSAoc2VlZCAlIDMwMjY4KSkgLyAzMDI2ODtcbiAgdmFyIHkgPSAoc2VlZCAlIDMwMzA2KSArIDE7XG4gIHNlZWQgPSAoc2VlZCAtIChzZWVkICUgMzAzMDYpKSAvIDMwMzA2O1xuICB2YXIgeiA9IChzZWVkICUgMzAzMjIpICsgMTtcbiAgc2VlZCA9IChzZWVkIC0gKHNlZWQgJSAzMDMyMikpIC8gMzAzMjI7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHggPSAoMTcxICogeCkgJSAzMDI2OTtcbiAgICB5ID0gKDE3MiAqIHkpICUgMzAzMDc7XG4gICAgeiA9ICgxNzAgKiB6KSAlIDMwMzIzO1xuICAgIHJldHVybiAoeCAvIDMwMjY5LjAgKyB5IC8gMzAzMDcuMCArIHogLyAzMDMyMy4wKSAlIDEuMDtcbiAgfTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBwaWNrdXA6IFtcbiAgICBbMCwsMC4wNzczLDAuNDA2NywwLjM1NjMsMC44ODc2LCwsLCwsMC4yNTk1LDAuNjU0LCwsLCwsMSwsLCwsMC41XSxcbiAgICBbMCwsMC4wNTIsMC40NTgyLDAuNDgyOSwwLjUzNSwsLCwsLCwsLCwsLCwxLCwsLCwwLjVdLFxuICAgIFswLCwwLjA0ODksMC40MjM5LDAuMzY2MiwwLjQxOTksLCwsLCwsLCwsLCwsMSwsLCwsMC41XSxcbiAgICBbMCwsMC4wMSwwLjM2MTcsMC40MzAyLDAuODUwMywsLCwsLDAuNDIxNiwwLjY1NywsLCwsLDEsLCwsLDAuNV1cbiAgXSxcbiAgc2hvb3Q6IFtcbiAgICBbMCwsMC4yMDMsMC4wNDg0LDAuMjUzMiwwLjU0NDcsMC4yLC0wLjE4ODEsLCwsLCwwLjQwOTgsMC4wNTQ4LCwsLDEsLCwsLDAuNV0sXG4gICAgWzAsLDAuMjE3LCwwLjE4ODIsMC43NzUzLDAuNTcsLTAuMTYyMiwsLCwsLDAuMzgzMywwLjE3MzUsLDAuMTQyMSwtMC4wNTcxLDEsLCwwLjAzMzgsLDAuNV0sXG4gICAgWzAsLDAuMjM5MiwwLjA5MTQsMC4zMDc0LDAuOTUwMSwwLjM0MzIsLTAuMjIzNCwsLCwsLDAuNjg3NSwtMC40MzIyLCwsLDEsLCwsLDAuNV0sXG4gICAgWzAsLDAuMjgzOCwsMC4zMDcsMC44MzQzLDAuMiwtMC4yMTMsLCwsLCwwLjcxNjYsLTAuNDUzNywsMC4xNTMzLC0wLjE1MTMsMSwsLCwsMC41XVxuICBdLFxuICBleHBsb3Npb246IFtcbiAgICBbMywsMC4zNzkyLDAuMzY3LDAuNDY2NiwwLjEwMjQsLC0wLjA3NTMsLCwsMC43MjYxLDAuODE1MiwsLCwsLDEsLCwsLDAuNV0sXG4gICAgWzMsLDAuMjI3LDAuNTM2NCwwLjI4NzIsMC4xMDI4LCwtMC4yMTk0LCwsLC0wLjcwNjEsMC42MDUxLCwsMC42Nzg5LDAuNDEyNSwtMC4wNiwxLCwsLCwwLjVdLFxuICAgIFszLCwwLjI2ODQsMC42NzM3LDAuNDkwOSwwLjA3MzksLCwsLCwsLCwsMC41ODU3LCwsMSwsLCwsMC41XSxcbiAgICBbMywsMC4zNTM5LDAuNjMzMywwLjM1ODEsMC4yMjc0LCwtMC4zMTM0LCwsLCwsLCwsLTAuMTY1NiwtMC4wNDk3LDEsLCwsLDAuNV1cbiAgXSxcbiAgcG93ZXJ1cDogW1xuICAgIFsxLCwwLjExODgsLDAuMzYwMSwwLjMxODMsLDAuMzA4MywsLCwsLCwsMC41MjU3LCwsMSwsLCwsMC41XSxcbiAgICBbMCwsMC4zMTg4LCwwLjIxNywwLjQ1MzMsLDAuMjcyNywsLCwsLDAuMzgzOSwsMC40MTIxLCwsMSwsLCwsMC41XSxcbiAgICBbMCwsMC4zMjA2LCwwLjE0NTEsMC4zOTgxLCwwLjI0NzEsLCwsLCwwLjAwNjEsLCwsLDEsLCwsLDAuNV0sXG4gICAgWzEsLDAuMjQyLCwwLjE5NTcsMC40NzcxLCwwLjE1MTcsLCwsLCwsLCwsLDEsLCwsLDAuNV1cbiAgXSxcbiAgaGl0OiBbXG4gICAgWzMsLDAuMDc1OCwsMC4yMTQ3LDAuMzMwMiwsLTAuNjc4OSwsLCwsLCwsLCwsMSwsLDAuMjIzMiwsMC41XSxcbiAgICBbMywsMC4wMjg3LCwwLjIyODIsMC4yMjcyLCwtMC4zNjc5LCwsLCwsLCwsLCwxLCwsMC4wMjQxLCwwLjVdLFxuICAgIFswLCwwLjA4ODYsLDAuMjI3NywwLjI0NzEsLC0wLjU3MzEsLCwsLCwwLjQzNjksLCwsLDEsLCwsLDAuNV0sXG4gICAgWzMsLDAuMDEwOSwsMC4xNjksMC43NTkyLCwtMC4zMTUsLCwsLCwsLCwsLDEsLCwwLjIxNzgsLDAuNV1cbiAgXSxcbiAganVtcDogW1xuICAgIFswLCwwLjEyNDQsLDAuMjY1NiwwLjQ2NDQsLDAuMTg0OSwsLCwsLDAuMDIzNCwsLCwsMC42MDI4LCwsLCwwLjVdLFxuICAgIFswLCwwLjI3ODIsLDAuMTUzMywwLjMwOTMsLDAuMjQ3OSwsLCwsLDAuNTU1NCwsLCwsMSwsLDAuMDgyMywsMC41XSxcbiAgICBbMCwsMC4zMTAxLCwwLjEzMzcsMC4zNjA4LCwwLjE0OCwsLCwsLDAuMDMyNywsLCwsMC42MDQ3LCwsMC4yMDMxLCwwLjVdLFxuICAgIFswLCwwLjM4NzksLDAuMjQ5NiwwLjUwMDUsLDAuMTUzNCwsLCwsLDAuNTU5NywsLCwsMC44NDAzLCwsMC4xNjYxLCwwLjVdXG4gIF0sXG4gIGJsaXA6IFtcbiAgICBbMCwsMC4xNjk5LCwwLjEzODgsMC41NzY3LCwsLCwsLCwwLjI2MjUsLCwsLDEsLCwwLjEsLDAuNV0sXG4gICAgWzAsLDAuMTI5NSwsMC4xNzM2LDAuNDgxMiwsLCwsLCwsLCwsLCwxLCwsMC4xLCwwLjVdLFxuICAgIFswLCwwLjE1MDUsLDAuMTk4NSwwLjI0NjIsLCwsLCwsLDAuNDQ3OSwsLCwsMSwsLDAuMSwsMC41XSxcbiAgICBbMCwsMC4xNTI5LCwwLjAzNjYsMC4yMzE3LCwsLCwsLCwwLjQ0OTcsLCwsLDEsLCwwLjEsLDAuNV1cbiAgXSxcbiAgcmFuZG9tOiB7XG4gICAgYWxlcnQ6IFswLDAuMDA1NCwwLjM5MywwLjAxMDQsMC44NDQ2LDAuNTEwNiwsMC4wMDA0LDAuMDQzNywwLjAwMywwLjIzODMsLTAuOTYzMiwwLjQxODMsLTAuMzcsMC4wMTEzLDAuMTQ4MiwwLjIxMzgsLTAuOTg0MSwwLjg3ODYsMC44NjM1LC0wLjQwOTcsLDAuMDA3NiwwLjVdLFxuICAgIGVuZ2luZTogWzMsMC4yOTI1LDAuMTE2OSwwLjA1LDAuNzAzNSwwLjE1NCwsMC4xNTQ0LC0wLjAwMDIsMC4wODYxLC0wLjE0NzMsLTAuMTQ4NCwsMC41MzcsMC4wMDI5LCwtMC4yMjIyLDAuMDE5OSwwLjk5ODksLTAuMDAxNywwLjEyNTMsLC0wLjQxMDQsMC41XSxcbiAgICB3YXJwOiBbMywwLjY3NTcsMC4yMzAzLDAuMTY4LDAuODExOCwwLjUwMDEsLDAuMDYwMywwLjI5MDgsLC0wLjM0NzgsLTAuNjgzMSwtMC44NTk4LCwtMC4yMzQxLC0wLjYxOTcsMC4wMzU1LDAuNTQ3NywwLjkzNjMsLTAuMDE2NSwwLjAxMTYsMC4wNDU3LCwwLjVdLFxuICAgIHNwYWNlZW5naW5lOiBbMywsMC42ODQxLDAuMDA0LDAuNjk1NywwLjAxNjUsLDAuMDU2OCwwLjEyNjMsMC4wNjE4LCwwLjg3NTIsLDAuNjc4LDAuMjYyOSwwLjQzOTUsMC4wMDExLC0wLjg4NSwwLjE3NDksLC0wLjg2NjEsMC4wOSwtMC4wMjI5LDAuNV0sXG4gICAgc3BhY2V3YXJwOiBbMywsMC4yOTUsMC40MTY5LDAuNzE1MiwwLjUwMiwsLTAuMTMyMywtMC4xMDI3LCwtMC41ODQ5LC0wLjA0MTYsMC42MDIyLDAuMDQ4LC0wLjAwNTQsLCwwLjA2NjcsMC45MTQ3LDAuNTAwNSwwLjQ5ODUsMC4wMDk0LDAuMzIxLDAuNV0sXG4gICAgYWxhcm06IFswLDAuMzI3MiwwLjA1MiwwLjAxNDcsMC40NDAzLDAuNTc0NSwsMC4xNzM1LDAuMDQyNSwsLC0wLjQ4MywtMC45ODk0LDAuMTc2MSwtMC4xMjA0LDAuMjUyMiwwLjYyMzEsLTAuMDEwOSwwLjk5OSwtMC4wMzQyLCwwLjI2MDQsMC4wMTYzLDAuNV1cbiAgfVxufTtcbiJdfQ==
