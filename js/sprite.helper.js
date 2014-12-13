var SpriteHelper = {
  imageSource: 'sprites.png',
  clickMode: { pan: true }
};

SpriteHelper.reset = function() {
	var global = SpriteHelper;
  global.view = {};
  global.target = {};
  global.zoom = 1;
  global.update();
};
 
SpriteHelper.update = function() {
	var global = SpriteHelper,
      canvas = global.canvas,
      context = canvas.context,
      image = global.image,
      view = global.view,
      target = global.target,
      zoom = global.zoom,
      virtual = { width: zoom * image.width, height: zoom * image.height };
  // Width
  view.width = Math.min(virtual.width, canvas.width);
  view.x = (virtual.width - view.width) / 2;
  target.x = Math.max(0, (canvas.width - view.width) / 2);
  // Height
  view.height = Math.min(virtual.height, canvas.height);
  view.y = (virtual.height - view.height) / 2;
  target.y = Math.max(0, (canvas.height - view.height) / 2);
  // Paint background
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#bbb';
  context.fillRect(target.x, target.y, view.width, view.height);
  canvas.context.mozImageSmoothingEnabled = false;
  canvas.context.webkitImageSmoothingEnabled = false;
  canvas.context.msImageSmoothingEnabled = false;
  canvas.context.imageSmoothingEnabled = false;
  context.drawImage(global.image,
      view.x/zoom, view.y/zoom, view.width/zoom, view.height/zoom,
      target.x, target.y, view.width, view.height);
};

SpriteHelper.zoomIn = function () {
	var global = SpriteHelper;
  if (global.zoom >= 1) {
    global.zoom += 1;
  } else {
    global.zoom = 1/(Math.round(1/global.zoom) - 1);
  }
  global.update();
};
SpriteHelper.zoomOut = function () {
	var global = SpriteHelper;
  if (global.zoom > 1) {
    global.zoom -= 1;
  } else {
    global.zoom = 1/(Math.round(1/global.zoom) + 1);
  }
  global.update();
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
      global.update();
    });
  };

  $(window).keydown(function (event) {
    var keyDownHandlers = {
      68: global.zoomOut,
      70: global.zoomIn
    };
    var handler = keyDownHandlers[event.which];
    if (handler === undefined) {
      console.log('key down: '+event.which);
    } else {
      handler();
    }
  });
};

$(document).ready(SpriteHelper.load);
