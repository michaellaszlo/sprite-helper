var SpriteHelper = {
  imageSource: 'sprites.png'
};

SpriteHelper.reset = function() {
	var global = SpriteHelper,
      canvas = global.canvas,
      context = canvas.context,
      image = global.image;
  // Width
  var viewWidth = Math.min(canvas.width, image.width),
      targetWidth = Math.min(viewWidth, canvas.width),
      viewX = (image.width - viewWidth) / 2,
      targetX = Math.max(0, (canvas.width - viewWidth) / 2);
  // Height
  var viewHeight = Math.min(canvas.height, image.height),
      targetHeight = Math.min(viewHeight, canvas.height),
      viewY = (image.height - viewHeight) / 2,
      targetY = Math.max(0, (canvas.height - viewHeight) / 2);
  // Background
  context.fillStyle = '#888';
  context.fillRect(targetX, targetY, targetWidth, targetHeight);
  context.drawImage(global.image,
      viewX, viewY, viewWidth, viewHeight,
      targetX, targetY, targetWidth, targetHeight);
};

SpriteHelper.load = function () {
	var global = SpriteHelper;

	var canvas = global.canvas = document.getElementById('mainCanvas');
  canvas.context = canvas.getContext('2d');
  canvas.width = $(window).width();
  canvas.height = $(window).height();

  global.image = new Image();
  global.image.src = global.imageSource;
  global.image.onload = function () {
    global.reset();
    $(window).on('resize', function () {
      canvas.width = $(window).width();
      canvas.height = $(window).height();
      global.reset();
    });
  };
};

window.onload = SpriteHelper.load;
