module.exports = function (ctx) {
  return {
    heart: function (x, y, width, height) {
      x = 75; y = 40; width= 110;
      x = 300; y = 200; width= 110;

      var leftmost = x - width / 2;
      var rightmost = x + width / 2;
      var middleY = y + 22.5;
      var bottomY = y + 80;
      // Quadratric curves example
      ctx.beginPath();
      ctx.moveTo(x,y);
      // first half
      ctx.bezierCurveTo(x, y, x - 5, y - 15, x - 25, y - 15);
      ctx.bezierCurveTo(leftmost, y - 15, leftmost, middleY, leftmost, middleY);
      ctx.bezierCurveTo(leftmost, y + 40, x - 35, y + 62, x, bottomY);
      // secund half
      ctx.bezierCurveTo(x + 35, y + 62, rightmost, y + 40, rightmost, middleY);
      ctx.bezierCurveTo(rightmost, middleY, rightmost, y - 15, x + 25, y - 15);
      ctx.bezierCurveTo(x + 10, y - 15, x, y, x, y);
      ctx.fillStyle = 'red';
      ctx.fill();
    }
  };
};