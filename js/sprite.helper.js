var SpriteHelper = {
  imageSource: 'sprites.png',
  option: {
    pan: { free: true, minimumBorderPixels: 5, scaled: true }
  },
  mode: {
    click: { pan: true }
  }
};

SpriteHelper.reset = function () {
	var g = SpriteHelper,
      image = g.image;
  g.zoom = 1;
  g.scaled = { width: image.width, height: image.height };
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
      scaled = g.scaled,
      focus = g.focus,
      crop = {},
      target = {};

  // Compute the crop dimensions within the scaled image and calculate
  //  the target rectangle on the canvas. The focus is the center of the
  //  view of the scaled image. The span is the distance from the focus
  //  to the edge of the view.
  var border = g.zoom * g.option.pan.minimumBorderPixels,
    span = { x: canvas.width / g.zoom / 2,
             y: canvas.height / g.zoom / 2 };
  if (g.option.pan.free) {
    focus.x = g.between(border - span.x, focus.x,
                        scaled.width + span.x - border);
  } else {
    focus.x = g.between(Math.min(span.x, scaled.width/2), focus.x,
                        Math.max(scaled.width - span.x, scaled.width/2));
  }
  crop.x = g.between(0, focus.x - span.x, scaled.width);
  crop.width = g.between(0, focus.x + span.x, scaled.width) - crop.x;
  target.x = (crop.x - focus.x + span.x) * g.zoom;
  target.width = crop.width * g.zoom;
  if (g.option.pan.free) {
    focus.y = g.between(border - span.y, focus.y,
                        scaled.height + span.y - border);
  } else {
    focus.y = g.between(Math.min(span.y, scaled.height/2), focus.y,
                        Math.max(scaled.height - span.y, scaled.height/2));
  }
  crop.y = g.between(0, focus.y - span.y, scaled.height);
  crop.height = g.between(0, focus.y + span.y, scaled.height) - crop.y;
  target.y = (crop.y - focus.y + span.y) * g.zoom;
  target.height = crop.height * g.zoom;
  //console.log('focus: '+JSON.stringify(focus));
  //console.log('crop: '+JSON.stringify(crop));
  //console.log('target: '+JSON.stringify(target));

  // Wipe the slate clean.
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#fff';
  context.fillRect(target.x, target.y, target.width, target.height);

  // Disable fuzzy interpolation.
  canvas.context.mozImageSmoothingEnabled = false;
  canvas.context.webkitImageSmoothingEnabled = false;
  canvas.context.msImageSmoothingEnabled = false;
  canvas.context.imageSmoothingEnabled = false;

  // Scale the crop rectangle back to the native image and copy it to
  //   the target rectangle on the canvas.
  context.drawImage(g.image,
      crop.x/g.zoom, crop.y/g.zoom, crop.width/g.zoom, crop.height/g.zoom,
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

// Click and drag to pan the canvas.
SpriteHelper.mouseDownCanvas = function (event) {
	var g = SpriteHelper,
      canvas = g.canvas,
      focus = g.focus,
      focusStart = { x: focus.x, y: focus.y },
      mouseStart = { x: event.pageX, y: event.pageY };
  var mouseMove = function (event) {
    //console.log('mouse move: '+event.pageX+', '+event.pageY);
    var dx = (mouseStart.x - event.pageX),
        dy = (mouseStart.y - event.pageY);
    if (!g.option.pan.scaled) {
      dx /= g.zoom;
      dy /= g.zoom;
    }
    focus.x = focusStart.x + dx;
    focus.y = focusStart.y + dy;
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
