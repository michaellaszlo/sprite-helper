var SpriteHelper = {
  imageSource: 'sprites.png',
  border: 4,
  option: {
    pan: { free: true, scaled: false, reposition: true }
  },
  mode: {
    click: { pan: true }
  }
};

SpriteHelper.reset = function () {
	var g = SpriteHelper,
      image = g.image;
  g.zoom = 1;
  g.focus = { x: image.width / 2, y: image.height / 2 };
  g.paint();
};

SpriteHelper.between = function (low, x, high) {
  if (x < low) {
    return low;
  } else if (x > high) {
    return high;
  } else {
    return x;
  }
};
 
SpriteHelper.paint = function() {
	var g = SpriteHelper,
      canvas = g.canvas,
      context = canvas.context,
      image = g.image,
      zoom = g.zoom,
      focus = g.focus,
      crop = {},
      target = g.target = {};

  // Compute the crop dimensions within the scaled image and calculate
  //  the target rectangle on the canvas. The focus is the center of the
  //  view of the scaled image. The span is the distance from the focus
  //  to the edge of the view.
  var span = { x: canvas.width / g.zoom / 2,
             y: canvas.height / g.zoom / 2 };
  if (g.option.pan.free) {
    focus.x = g.between(-span.x, focus.x,
                        image.width + span.x);
  } else {
    focus.x = g.between(Math.min(span.x, image.width/2), focus.x,
                        Math.max(image.width - span.x, image.width/2));
  }
  crop.x = g.between(0, focus.x - span.x, image.width);
  crop.width = g.between(0, focus.x + span.x, image.width) - crop.x;
  target.x = Math.floor((crop.x - focus.x + span.x) * g.zoom);
  target.width = crop.width * g.zoom;
  if (g.option.pan.free) {
    focus.y = g.between(-span.y, focus.y,
                        image.height + span.y);
  } else {
    focus.y = g.between(Math.min(span.y, image.height/2), focus.y,
                        Math.max(image.height - span.y, image.height/2));
  }
  crop.y = g.between(0, focus.y - span.y, image.height);
  crop.height = g.between(0, focus.y + span.y, image.height) - crop.y;
  target.y = Math.floor((crop.y - focus.y + span.y) * g.zoom);
  target.height = crop.height * g.zoom;
  if (false) {
    console.log('focus: '+JSON.stringify(focus));
    console.log('span: '+JSON.stringify(span));
    console.log('crop: '+JSON.stringify(crop));
    console.log('target: '+JSON.stringify(target));
  }

  // Wipe the slate clean.
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#777';  // border
  context.fillRect(target.x - g.border*g.zoom, target.y - g.border*g.zoom,
      target.width + 2*g.border*g.zoom, target.height + 2*g.border*g.zoom);
  context.fillStyle = '#fff';  // background
  context.fillRect(target.x, target.y, target.width, target.height);

  // Disable fuzzy interpolation.
  canvas.context.mozImageSmoothingEnabled = false;
  canvas.context.webkitImageSmoothingEnabled = false;
  canvas.context.msImageSmoothingEnabled = false;
  canvas.context.imageSmoothingEnabled = false;

  // Scale the crop rectangle back to the native image and copy it to
  //   the target rectangle on the canvas.
  context.drawImage(g.image,
      crop.x, crop.y, crop.width, crop.height,
      target.x, target.y, target.width, target.height);
};

SpriteHelper.zoomBy = function (delta) {
	var g = SpriteHelper,
      zoom = g.zoom,
      focus = g.focus;
  if ((delta >= 0 && zoom >= 1) || (delta < 0 && zoom > 1)) {
    g.zoom = zoom + delta;
  } else {
    g.zoom = 1/(Math.round(1/zoom) - delta);
  }
  g.paint();
};
SpriteHelper.zoomIn = function () {
  SpriteHelper.zoomBy(1);
};
SpriteHelper.zoomOut = function () {
  SpriteHelper.zoomBy(-1);
};

// Click and drag to pan the canvas.
SpriteHelper.mouseDownCanvas = function (event) {
	var g = SpriteHelper,
      canvas = g.canvas,
      focus = g.focus,
      focusStart = { x: focus.x, y: focus.y },
      mouseStart = { x: event.pageX, y: event.pageY };
  var mouseMove = function (event) {
    //console.log('mouse move: '+event.pageX+', '+event.pageY);
    var x = event.pageX,
        y = event.pageY,
        dx = x - mouseStart.x,
        dy = y - mouseStart.y;
    if (g.zoom < 1 || !g.option.pan.scaled) {
      dx /= g.zoom;
      dy /= g.zoom;
    }
    if (g.option.pan.reposition) {
      var target = g.target,
        canvas = g.canvas;
      if (target.x == 0 && target.width == 0 && dx < 0) {
        target.x = -g.target.width;
        dx = 0;
        focusStart.x = focus.x;
        mouseStart.x = x;
      } else if (target.x == canvas.width && target.width == 0 && dx > 0) {
        target.x = canvas.width;
        dx = 0;
        focusStart.x = focus.x;
        mouseStart.x = x;
      }
      if (target.y == 0 && target.height == 0 && dy < 0) {
        target.y = -g.target.height;
        dy = 0;
        focusStart.y = focus.y;
        mouseStart.y = y;
      } else if (target.y == canvas.height && target.height == 0 && dy > 0) {
        target.y = canvas.height;
        dy = 0;
        focusStart.y = focus.y;
        mouseStart.y = y;
      }
    }
    focus.x = focusStart.x - dx;
    focus.y = focusStart.y - dy;
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
