var SpriteHelper = {
  imageSource: 'sprites.png',
  layout: {
    image: {
      border: 4
    },
    panel: {
      content: 49,
      border: 1,
      borderColor: '#ccc'
    }
  },
  option: {
    pan: {
      free: true,
      scaled: false,
      reposition: true,
      release: {
        ease: true,
        hertz: 60,
        factor: 0.9
      }
    }
  },
  mode: {
    click: {
      pan: true
    }
  },
  debug: false
};

SpriteHelper.message = function () {
  if (SpriteHelper.debug) {
    console.log(arguments);
  }
}

SpriteHelper.reset = function () {
  var g = SpriteHelper,
      image = g.image;
  g.zoom = 1;
  g.focus = { x: image.width / 2, y: image.height / 2 };
};

SpriteHelper.clamp = function (low, x, high) {
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

  // Compute the crop, which is the rectangle to be cut out of the image.
  //  Then compute the target, which is the rectangle on the canvas to which
  //  the crop is to be copied. The focus is the center of the crop. The
  //  span is the distance from the focus to the edge of the crop.
  var span = { x: canvas.width / zoom / 2,
             y: canvas.height / zoom / 2 };
  if (g.option.pan.free) {
    focus.x = g.clamp(-span.x, focus.x,
                      image.width + span.x);
  } else {
    focus.x = g.clamp(Math.min(span.x, image.width/2), focus.x,
                      Math.max(image.width - span.x, image.width/2));
  }
  crop.x = g.clamp(0, focus.x - span.x, image.width);
  crop.width = g.clamp(0, focus.x + span.x, image.width) - crop.x;
  target.x = Math.floor((crop.x - focus.x + span.x) * zoom);
  target.width = crop.width * zoom;
  if (g.option.pan.free) {
    focus.y = g.clamp(-span.y, focus.y,
                      image.height + span.y);
  } else {
    focus.y = g.clamp(Math.min(span.y, image.height/2), focus.y,
                      Math.max(image.height - span.y, image.height/2));
  }
  crop.y = g.clamp(0, focus.y - span.y, image.height);
  crop.height = g.clamp(0, focus.y + span.y, image.height) - crop.y;
  target.y = Math.floor((crop.y - focus.y + span.y) * zoom);
  target.height = crop.height * zoom;
  g.message('focus: '+JSON.stringify(focus));
  g.message('span: '+JSON.stringify(span));
  g.message('crop: '+JSON.stringify(crop));
  g.message('target: '+JSON.stringify(target));

  // Wipe the slate clean.
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#777';  // border color
  var border = g.layout.image.border;
  context.fillRect(target.x - border*zoom, target.y - border*zoom,
      target.width + 2*border*zoom, target.height + 2*border*zoom);
  context.fillStyle = '#fff';  // background color
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
SpriteHelper.reset1x = function () {
  var g = SpriteHelper;
  g.reset();
  g.paint();
};

SpriteHelper.autoFrame = function () {
  var g = SpriteHelper,
      image = g.image, canvas = g.canvas,
      width = image.width, height = image.height,
      imageData = g.pixelLayer.context.getImageData(0, 0, width, height),
      data = imageData.data;
  var i = 0;
  for (var y = 0; y < height; ++y) {
    for (var x = 0; x < width; ++x) {
      var r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (r+g+b != 0) {
        data[i] = data[i+1] = data[i+2] = data[i+3] = 128;
      }
      i += 4;
    }
  }
  canvas.context.putImageData(imageData, 0, 0);
};

// Click and drag to pan the canvas.
SpriteHelper.mouseDownCanvas = function (event) {
  var g = SpriteHelper,
      canvas = g.canvas,
      focus = g.focus,
      pan = g.option.pan,
      focusStart = { x: focus.x, y: focus.y },
      mouseStart = { x: event.pageX, y: event.pageY },
      mouseCurrent = { x: mouseStart.x, y: mouseStart.y },
      mouseJump = { x: 0, y: 0 };
  if (pan.release.interval) {
    window.clearInterval(pan.release.interval);
  }
  var mouseMove = function (event) {
    g.message('mouse move: '+event.pageX+', '+event.pageY);
    var x = event.pageX,
        y = event.pageY,
        dx = x - mouseStart.x,
        dy = y - mouseStart.y;
    mouseJump.x = x - mouseCurrent.x;
    mouseJump.y = y - mouseCurrent.y;
    mouseCurrent.x = x;
    mouseCurrent.y = y;
    if (g.zoom < 1 || !pan.scaled) {
      dx /= g.zoom;
      dy /= g.zoom;
    }
    if (pan.reposition) {
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
    if (pan.release.ease) {
      var dx = mouseJump.x,
          dy = mouseJump.y,
          jump = Math.sqrt(dx*dx + dy*dy),
          threshold = 1;  // Stop easing once the change is less than this.
      if (jump >= 5) {
        g.message(dx, dy, jump);
        if (g.zoom < 1 || !pan.scaled) {
          dx /= g.zoom;
          dy /= g.zoom;
          threshold /= g.zoom;
        }
        pan.release.interval = window.setInterval(function () {
          dx *= pan.release.factor;
          dy *= pan.release.factor;
          if (Math.sqrt(dx*dx + dy*dy) < threshold) {
            window.clearInterval(pan.release.interval);
          } else {
            focus.x -= dx;
            focus.y -= dy;
            g.paint();
          }
        }, 1000/pan.release.hertz);
      }
    }
    $(window).off('mousemove', mouseMove);
    $(window).off('mouseup', mouseUp);
  };
  $(window).mousemove(mouseMove);
  $(window).mouseup(mouseUp);
};

SpriteHelper.load = function () {
  var g = SpriteHelper,
      panel = g.panel = document.getElementById('controlPanel'),
      canvas = g.canvas = document.getElementById('mainCanvas');
  canvas.context = canvas.getContext('2d');
  $(canvas).mousedown(g.mouseDownCanvas);

  $(window).keydown(function (event) {
    var keyDownHandlers = {
      68: g.zoomOut,
      70: g.zoomIn
    };
    var handler = keyDownHandlers[event.which];
    if (handler === undefined) {
      g.message('key down: '+event.which);
    } else {
      handler();
    }
  });

  var layout = g.layout,
      panelSize = layout.panel.content + layout.panel.border;

  $('#reset1x').mousedown(g.reset1x);
  $('#autoFrame').mousedown(g.autoFrame);

  var resize = function () {
    canvas.style.top = panelSize + 'px';
    canvas.height = $(window).height() - panelSize;
    canvas.width = $(window).width();
    panel.style.width = canvas.width + 'px';
    panel.style.height = layout.panel.content + 'px';
    panel.style.borderBottom = layout.panel.border + 'px solid ' +
        layout.panel.borderColor;
    canvas.width = $(window).width();
    canvas.height = $(window).height() - panelSize;
    g.paint();
  };

  $(window).on('resize', resize);

  g.image = new Image();
  g.image.src = g.imageSource;
  g.image.onload = function () {
    g.reset();
    resize();
    canvas.style.display = 'block';
    panel.style.display = 'block';
    var boxLayer = g.boxLayer = document.getElementById('boxLayer'),
        pixelLayer = g.pixelLayer = document.getElementById('pixelLayer');
    boxLayer.width = pixelLayer.width = g.image.width;
    boxLayer.height = pixelLayer.height = g.image.height;
    pixelLayer.context = pixelLayer.getContext('2d');
    pixelLayer.context.drawImage(g.image, 0, 0);
    g.autoFrame();
  };

};

$(document).ready(SpriteHelper.load);
