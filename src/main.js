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
var farthestBackground = 0;

var background;
var player;

var reset = function () {
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
  }
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

// Other controls.

kd.SPACE.up(function () {
  ArcadeAudio.play('powerup');
  player.color = rand.pick(colors);
});

kd.ESC.up(function () {
  ArcadeAudio.play('explosion');
  reset();
});
