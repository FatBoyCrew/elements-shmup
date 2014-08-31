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
  console.log(sounds);
  var soundData = sound.length > 1 ? sound[Math.floor(Math.random() * sound.length)] : sound[0];
  soundData.pool[soundData.tick].play();
  soundData.tick = soundData.tick < soundData.count - 1 ? soundData.tick + 1 : 0;
};

module.exports = {
  add: add,
  play: play
};
