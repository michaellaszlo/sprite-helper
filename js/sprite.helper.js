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
  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;
  context.msImageSmoothingEnabled = false;
  context.imageSmoothingEnabled = false;

  // Scale the crop rectangle back to the native image and copy it to
  //   the target rectangle on the canvas.
  var names = ['autobox', 'shadow', 'image'];
  for (var i = 0; i < names.length; ++i) {
    var layer = g.layers[names[i]];
    console.log('painting layer '+names[i]);
    context.drawImage(layer.canvas,
        crop.x, crop.y, crop.width, crop.height,
        target.x, target.y, target.width, target.height);
  }
  context.drawImage(g.layers.autobox.canvas, 0, 0);
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

SpriteHelper.autoPaint = function () {
  var g = SpriteHelper,
      image = g.image,
      width = image.width,
      height = image.height,
      canvas = g.canvas,
      layers = g.layers,
      autoboxContext = layers.autobox.canvas.context,
      shadowContext = layers.shadow.canvas.context,
      imageContext = layers.image.canvas.context,
      data = imageContext.getImageData(0, 0, width, height).data,
      grid = new Array(height);
  imageContext.drawImage(g.image, 0, 0);
  var i = 0;
  for (var y = 0; y < height; ++y) {
    grid[y] = new Array(width);
    for (var x = 0; x < width; ++x) {
      var cell = grid[y][x] = {
        r: data[i], g: data[i+1], b: data[i+2], a: data[i+3]
      };
      cell.visible = (cell.r+cell.g+cell.b != 0);
      i += 4;
    }
  }
  var groups = [], dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0];
  function flood(x, y, id) {
    grid[y][x].id = id;
    var group = groups[id];
    group.min.x = Math.min(group.min.x, x);
    group.min.y = Math.min(group.min.y, y);
    group.max.x = Math.max(group.max.x, x);
    group.max.y = Math.max(group.max.y, y);
    for (var i = 0; i < 4; ++i) {
      var X = x+dx[i], Y = y+dy[i];
      if (X >= 0 && X < width && Y >= 0 && Y < height) {
        var cell = grid[Y][X];
        if (cell.visible && cell.id === undefined) {
          flood(X, Y, id);
        }
      }
    }
  }
  for (var y = 0; y < height; ++y) {
    for (var x = 0; x < width; ++x) {
      var cell = grid[y][x];
      if (cell.visible && cell.id === undefined) {
        var id = groups.length;
        groups.push({ min: { x: x, y: y }, max: { x: x, y: y } });
        flood(x, y, id);
      }
    }
  }
  autoboxContext.fillStyle = '#999';
  shadowContext.fillStyle = '#000';
  for (var i = 0; i < groups.length; ++i) {
    var group = groups[i],
      min = group.min, max = group.max;
    group.width = max.x - min.x + 1;
    group.height = max.y - min.y + 1;
    autoboxContext.fillRect(min.x, min.y, group.width, group.height);
    for (var y = min.y; y <= max.y; ++y) {
      for (var x = min.x; x <= max.x; ++x) {
        if (grid[y][x].visible) {
          shadowContext.fillRect(x, y, 1, 1);
        }
      }
    }
  }
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

  var layout = g.layout,
      panelSize = layout.panel.content + layout.panel.border;

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

  g.image = new Image();
  g.image.src = g.imageSource;
  console.log(canvas);
  g.image.onload = function () {
    console.log(panel);
    console.log(canvas);
    canvas.style.display = 'block';
    panel.style.display = 'block';
    g.layers = {};
    g.layers.autobox = {
      canvas: document.createElement('canvas'),
      checkbox: $('#showAutobox')
    };
    g.layers.shadow = {
      canvas: document.createElement('canvas'),
      checkbox: $('#showShadow')
    };
    g.layers.image = {
      canvas: document.createElement('canvas'),
      checkbox: $('#showImage')
    };
    var names = ['autobox', 'shadow', 'image'];
    for (var i = 0; i < names.length; ++i) {
      var x = g.layers[names[i]].canvas;
      x.width = g.image.width;
      x.height = g.image.height;
      x.style.display = 'none';
      //document.appendChild(x);
      x.context = x.getContext('2d');
    }
    g.reset();
    g.autoPaint();
    resize();
    $(window).on('resize', resize);
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
    $('#reset1x').mousedown(g.reset1x);
  };

};

$(window).load(SpriteHelper.load);
