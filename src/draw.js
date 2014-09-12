module.exports = function (ctx) {
  return {
    heart: function (x, y, size) {
      x = 75; y = 40; size= 100;
      x = 300; y = 200; size= 100;
      // Quadratric curves example
      ctx.beginPath();
      ctx.moveTo(x,y);
      //ctx.fillRect(x, y, 40, 40);
      ctx.bezierCurveTo(x, y, x - 5, y - 15, x - 25, y - 15);
      ctx.bezierCurveTo(x - 55, y - 15, x - 55, y + 22.5, x - 55, y + 22.5);
      ctx.bezierCurveTo(x - 55, y + 40, x - 35, y + 62, x, y + 80);
      ctx.bezierCurveTo(x + 35, y + 62, x + 55, y + 40, x + 55,y + 22.5);
      ctx.bezierCurveTo(x + 55, y + 22.5, x + 55, y - 15, x + 25, y - 15);
      ctx.bezierCurveTo(x + 10, y - 15, x, y, x, y);
      ctx.fillStyle = 'red';
      ctx.fill();
    }
  };
};
