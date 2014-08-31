var raf = require('./lib/raf');
var rand = require('./lib/rng')();
var kd = require('./lib/keydrown');
var ArcadeAudio = require('./ArcadeAudio');

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

ArcadeAudio.add('explosion', 1, [
  [3,,0.3708,0.5822,0.3851,0.0584,,-0.0268,,,,-0.0749,0.7624,,,,,,1,,,,,0.5]
]);
ArcadeAudio.add('powerup', 1, [
  [0,,0.1812,,0.1349,0.4524,,0.2365,,,,,,0.0819,,,,,1,,,,,0.5],
  [0,,0.3739,,0.2617,0.3589,,0.2292,,,,,,0.4031,,,,,1,,,0.0548,,0.5],
  [0,,0.3634,,0.1398,0.577,,0.1121,,,,,,0.5917,,,,,1,,,0.2916,,0.5],
]);

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

var background;
var player;

var reset = function () {
  background = [];

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      background.push({
        x: i * W / 3,
        y: j * H / 3,
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
    color: rand.pick(colors)
  };
};

var getColorAmount = function (x, y, w, h, color) {
  var pixels = ctx.getImageData(x, y, w, h);
  var all = pixels.data.length;
  var amount = 0;
  for (var i = 0; i < all; i += 4) {
    if (pixels.data[i] === color.r && pixels.data[i + 1] === color.g && pixels.data[i + 2] === color.b) {
      amount++;
    }
  }
  return amount;
};

var getPointColor = function (x, y) {
  var pixel = ctx.getImageData(x, y, 1, 1);
  return {
    r: pixel.data[0],
    g: pixel.data[1],
    b: pixel.data[2],
    a: pixel.data[3]
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
  });

  playerColorAmount = getColorAmount(player.x - player.radius - 10, player.y - player.radius - 10, player.radius * 2 + 20, player.radius * 2 + 20, playerColor);

  console.log(playerColorAmount);

  // Handle collision against the canvas's edges
  if (player.x - player.radius < 0 && player.dx < 0 || player.x + player.radius > W && player.dx > 0) player.dx = -player.dx * 0.4;
  if (player.y - player.radius < 0 && player.dy < 0 || player.y +  player.radius > H && player.dy > 0) player.dy = -player.dy * 0.4;

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

  playerColor = getPointColor(player.x + player.radius / 2, player.y + player.radius / 2);

  if (playerColorAmount < 10000) {
    ctx.globalAlpha = 0.8 / (1 + rand.range(0, 50) / 100);
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius / 3, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = 'black';
    ctx.fill();
  }
});

kd.SPACE.down(function () {
  ctx.globalAlpha = 0.8 / (1 + rand.range(0, 50) / 100);
});

kd.SPACE.up(function () {
  console.log('SPACE');

  ctx.globalAlpha = 1;

  //jsfxr.playSound([0,,0.1812,,0.1349,0.4524,,0.2365,,,,,,0.0819,,,,,1,,,,,0.5]);
  ArcadeAudio.play('powerup');

  player.color = rand.pick(colors);
});

kd.UP.down(function () {
  console.log('UP');
  player.dy = Math.max(player.dy - 10, -player.maxdy);
});

kd.DOWN.down(function () {
  console.log('DOWN');
  player.dy = Math.min(player.dy + 10, player.maxdy);
});

kd.LEFT.down(function () {
  console.log('LEFT');
  player.dx = Math.max(player.dx - 10, -player.maxdx);
});

kd.RIGHT.down(function () {
  console.log('RIGHT');
  player.dx = Math.min(player.dx + 10, player.maxdx);
});

kd.ESC.up(function () {
  console.log('ESC');
  ArcadeAudio.play('explosion');
  //jsfxr.playSound();

  reset();
});
