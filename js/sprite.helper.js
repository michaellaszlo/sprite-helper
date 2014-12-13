var SpriteHelper = {
  imageSource: 'sprites.png',
  clickMode: { pan: true }
};

SpriteHelper.reset = function() {
	var g = SpriteHelper,
      image = g.image;
  g.zoom = 1;
  g.scaled = { width: image.width, height: image.height };
  g.focus = { x: image.width / 2, y: image.height / 2 };
  g.paint();
};
 
SpriteHelper.paint = function() {
	var g = SpriteHelper,
      canvas = g.canvas,
      context = canvas.context,
      image = g.image,
      zoom = g.zoom,
      scaled = g.scaled,
      focus = g.focus,
      view = {},
      target = {};

  // Compute the view dimensions within the scaled image, adjust the focus
  //  if necessary to keep the view rectangle within the image, and
  //  calculate the target rectangle on the canvas.
  if (canvas.width >= scaled.width) {
    view.width = scaled.width;
    view.x = 0;
    target.x = (canvas.width - view.width) / 2;
    target.width = view.width;
  } else {
    view.width = canvas.width;
    focus.x = Math.max(view.width/2, focus.x);
    focus.x = Math.min(focus.x, scaled.width - view.width/2);
    view.x = focus.x - view.width/2;
    target.x = 0;
    target.width = canvas.width;
  }
  if (canvas.height >= scaled.height) {
    view.height = scaled.height;
    view.y = 0;
    target.y = (canvas.height - view.height) / 2;
    target.height = view.height;
  } else {
    view.height = canvas.height;
    focus.y = Math.max(view.height/2, focus.y);
    focus.y = Math.min(focus.y, scaled.height - view.height/2);
    view.y = focus.y - view.height/2;
    target.y = 0;
    target.height = canvas.height;
  }

  // Wipe the slate clean.
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#fff';
  context.fillRect(target.x, target.y, view.width, view.height);

  // Disable fuzzy interpolation.
  canvas.context.mozImageSmoothingEnabled = false;
  canvas.context.webkitImageSmoothingEnabled = false;
  canvas.context.msImageSmoothingEnabled = false;
  canvas.context.imageSmoothingEnabled = false;

  // Scale the view rectangle back to the native image and copy it to
  //   the target rectangle on the canvas.
  context.drawImage(g.image,
      view.x/g.zoom, view.y/g.zoom, view.width/g.zoom, view.height/g.zoom,
      target.x, target.y, target.width, target.height);
};

SpriteHelper.zoomBy = function (delta) {
	var g = SpriteHelper,
      image = g.image,
      oldZoom = g.zoom,
      newZoom,
      scaled = g.scaled,
      focus = g.focus;
  if ((delta >= 0 && oldZoom >= 1) || (delta < 0 && oldZoom > 1)) {
    newZoom = oldZoom + delta;
  } else {
    newZoom = 1/(Math.round(1/oldZoom) - delta);
  }
  scaled.width = newZoom * image.width;
  scaled.height = newZoom * image.height;
  focus.x = newZoom * focus.x / oldZoom;
  focus.y = newZoom * focus.y / oldZoom;
  g.zoom = newZoom;
  g.paint();
};
SpriteHelper.zoomIn = function () {
  SpriteHelper.zoomBy(1);
};
SpriteHelper.zoomOut = function () {
  SpriteHelper.zoomBy(-1);
};

SpriteHelper.mouseDownCanvas = function (event) {
	var g = SpriteHelper,
      canvas = g.canvas,
      focus = g.focus,
      focusStart = { x: focus.x, y: focus.y },
      mouseStart = { x: event.pageX, y: event.pageY };
  //console.log('mouse down: '+event.pageX+', '+event.pageY);
  //
  var mouseMove = function (event) {
    //console.log('mouse move: '+event.pageX+', '+event.pageY);
    var x = event.pageX, y = event.pageY;
    focus.x = focusStart.x + mouseStart.x - x;
    focus.y = focusStart.y + mouseStart.y - y;
    g.paint();
  };
  var mouseUp = function (event) {
    //console.log('mouse up: '+event.pageX+', '+event.pageY);
    $(window).off('mousemove', mouseMove);
    $(window).off('mouseup', mouseUp);
  };
  $(window).mousemove(mouseMove);
  $(window).mouseup(mouseUp);
};

SpriteHelper.load = function () {
	var g = SpriteHelper;

	var canvas = g.canvas = document.getElementById('mainCanvas');
  canvas.context = canvas.getContext('2d');
  canvas.width = $(window).width();
  canvas.height = $(window).height();

  $(canvas).mousedown(g.mouseDownCanvas);

  g.image = new Image();
  g.image.src = g.imageSource;
  g.image.onload = function () {
    g.reset();
    $(window).on('resize', function () {
      canvas.width = $(window).width();
      canvas.height = $(window).height();
      g.paint();
    });
  };

  $(window).keydown(function (event) {
    var keyDownHandlers = {
      68: g.zoomOut,
      70: g.zoomIn
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
