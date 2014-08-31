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
