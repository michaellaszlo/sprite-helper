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
  for (var i = 0; i < g.layers.length; ++i) {
    var layer = g.layers[i];
    if (layer.checkbox.checked) {
      context.drawImage(layer.canvas,
          crop.x, crop.y, crop.width, crop.height,
          target.x, target.y, target.width, target.height);
    }
  }
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
      layer = g.layer,
      autoboxContext = layer.autobox.canvas.context,
      shadowContext = layer.shadow.canvas.context,
      imageContext = layer.image.canvas.context,
      grid = new Array(height);
  imageContext.drawImage(g.image, 0, 0);
  var data = imageContext.getImageData(0, 0, width, height).data,
    i = 0;
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
  var shapes = [], dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0];

  // Flood fill to find shapes, i.e., sets of contiguous cells.
  function flood(x, y, id) {
    grid[y][x].id = id;
    var shape = shapes[id];
    shape.min.x = Math.min(shape.min.x, x);
    shape.min.y = Math.min(shape.min.y, y);
    shape.max.x = Math.max(shape.max.x, x);
    shape.max.y = Math.max(shape.max.y, y);
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
        var id = shapes.length;
        shapes.push({ min: { x: x, y: y }, max: { x: x, y: y } });
        flood(x, y, id);
      }
    }
  }

  // To make an auto-polygon for a shape:
  // - find a border pixel
  // - flood-fill border pixels
  // - during the flood fill, find the border segments of each border pixel
  //   (note that a segment may border a hole in the shape)
  // - somehow find all segments on the outside of the shape
  // - traverse the segments to make an ordered loop
  // - merge segments based on some scheme
  // - calculate a sequence of points based on the segments
  for (var id = 0; id < shapes.length; ++id) {
    var shape = shapes[id];
    // Find a border pixel.
    var x = shape.min.x, y = shape.min.y;
    while (grid[y][x].id != id) {
      ++x;
    }
    console.log('id = '+id+', border pixel: y = '+y+', x = '+x);
  }

  autoboxContext.fillStyle = '#999';
  shadowContext.fillStyle = '#000';
  for (var i = 0; i < shapes.length; ++i) {
    var shape = shapes[i],
      min = shape.min, max = shape.max;
    shape.width = max.x - min.x + 1;
    shape.height = max.y - min.y + 1;
    autoboxContext.fillRect(min.x, min.y, shape.width, shape.height);
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
  g.image.onload = function () {
    canvas.style.display = 'block';
    panel.style.display = 'block';
    g.layer = {};
    g.layers = [];
    var names = ['autobox', 'shadow', 'image'];
    for (var i = 0; i < names.length; ++i) {
      var name = names[i];
      var layer = g.layer[name] = {
        name: name,
        checkbox: document.getElementById(
            'show' + name[0].toUpperCase() + name.substring(1)),
        canvas: document.createElement('canvas')
      };
      layer.checkbox.onclick = function () {
        g.paint();
      };
      layer.canvas.width = g.image.width;
      layer.canvas.height = g.image.height;
      layer.canvas.style.display = 'none';
      layer.canvas.context = layer.canvas.getContext('2d');
      g.layers.push(layer);
    }
    g.layer.autobox.checkbox.checked = true;
    g.layer.image.checkbox.checked = true;
    document.getElementById('showBoxes').disabled = true;
    document.getElementById('showAutopoly').disabled = true;
    document.getElementById('showPolygons').disabled = true;
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
