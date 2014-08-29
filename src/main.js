var raf = require('./modules/raf');
var rand = require('./modules/rng')();
var kd = require('./modules/keydrown');

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

var colors = [
  '#0074D9', '#2ECC40', '#FF4136', '#FFDC00'
];

var W = canvas.width;
var H = canvas.height;

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

reset();

raf.start(function (elapsed) {
  kd.tick();

  // Clear the screen
  ctx.clearRect(0, 0, W, H);

  background.forEach(function (bg) {
    ctx.fillStyle = bg.color;
    ctx.fillRect(bg.x, bg.y, bg.width, bg.height);
  });

  // Gravity
  // player.dy += elapsed * 1500;

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
});

kd.SPACE.up(function () {
  console.log('SPACE');

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
  reset();
});
