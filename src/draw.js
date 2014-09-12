module.exports = function (ctx) {
  return {
    heart: function (x, y, width, height, color) {
      var leftmost = x - width / 2;
      var rightmost = x + width / 2;
      var topY = y - height / 5;
      var middleY = y + height / 5;
      var bottomY = y + (4 * height) / 5;

      ctx.beginPath();
      ctx.moveTo(x, y);

      ctx.bezierCurveTo(x, y, x - width / 20, topY, x - width / 4, topY);
      ctx.bezierCurveTo(leftmost, topY, leftmost, middleY, leftmost, middleY);
      ctx.bezierCurveTo(leftmost, y + height / 2.5, x - width / 3, y + height / 1.5, x, bottomY);

      ctx.bezierCurveTo(x + width / 3, y + height / 1.5, rightmost, y + height / 2.5, rightmost, middleY);
      ctx.bezierCurveTo(rightmost, middleY, rightmost, topY, x + width / 4, topY);
      ctx.bezierCurveTo(x + width / 20, topY, x, y, x, y);
      ctx.fillStyle = color;
      ctx.fill();
    }
  };
};
