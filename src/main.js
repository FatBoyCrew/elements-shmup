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
