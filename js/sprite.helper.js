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
  boundary: {
    gap: 0.5
  },
  debug: false
};

SpriteHelper.message = function () {
  if (SpriteHelper.debug) {
    console.log.apply(console, arguments);
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
      canvas = g.canvas.main,
      context = canvas.context,
      image = g.image,
      zoom = g.zoom,
      focus = g.focus,
      crop = g.crop = {},
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
  //g.message('focus: '+JSON.stringify(focus));
  //g.message('span: '+JSON.stringify(span));
  //g.message('crop: '+JSON.stringify(crop));
  //g.message('target: '+JSON.stringify(target));

  // Disable fuzzy interpolation.
  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;
  context.msImageSmoothingEnabled = false;
  context.imageSmoothingEnabled = false;

  // Wipe the slate clean.
  // TODO: Use double buffering.
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#777';  // border color
  var border = g.layout.image.border;
  context.fillRect(target.x - border*zoom, target.y - border*zoom,
      target.width + 2*border*zoom, target.height + 2*border*zoom);
  context.fillStyle = '#fff';  // background color
  context.fillRect(target.x, target.y, target.width, target.height);

  // Scale the crop rectangle back to the native image and copy it to
  //   the target rectangle on the canvas.
  for (var i = 0; i < g.sources.length; ++i) {
    var source = g.sources[i];
    if (source.checkbox.checked) {
      context.drawImage(source.canvas,
          crop.x, crop.y, crop.width, crop.height,
          target.x, target.y, target.width, target.height);
    }
  }

  // Draw the boundary segments based on precalculated vertices.
  var boundaryCanvas = g.canvas.boundary;
  if (boundaryCanvas.checkbox.checked) {
    var boundaryContext = boundaryCanvas.context,
        width = canvas.width, height = canvas.height;
    // Resize the boundary source to fit the main canvas.
    boundaryCanvas.width = width;
    boundaryCanvas.height = height;
    boundaryContext.clearRect(0, 0, width, height);
    boundaryContext.strokeStyle = '#774d2b';
    boundaryContext.lineWidth = 1;
    var polygons = g.polygons;
    for (var i = 0; i < polygons.length; ++i) {
      // Calculate boundary segments.
      var polygon = polygons[i];
      for (var j = 0; j < polygon.length; ++j) {
        var vertex = polygon[j];
        vertex.outX = target.x + (vertex.x - crop.x) * zoom + vertex.dx;
        vertex.outY = target.y + (vertex.y - crop.y) * zoom + vertex.dy;
      }
      // Draw boundary segments.
      boundaryContext.beginPath();
      previous = polygon[polygon.length-1];
      boundaryContext.moveTo(previous.outX, previous.outY);
      for (var j = 0; j < polygon.length; ++j) {
        boundaryContext.lineTo(polygon[j].outX, polygon[j].outY);
      }
      boundaryContext.closePath();
      boundaryContext.stroke();
    }
  }

  // Draw the vertices.
  var vertexCanvas = g.canvas.checkbox;
  if (vertexCanvas.checkbox.checked) {
    //g.canvas.boundary.
    var context = vertexCanvas.context,
        polygons = g.polygons;
    context.fillStyle = '#444';
    var radius = Math.min(8, zoom),
        angle = 2*Math.PI;
    for (var i = 0; i < polygons.length; ++i) {
      var polygon = polygons[i];
      for (var j = 0; j < polygon.length; ++j) {
        var vertex = polygon[j],
          x = target.x + (vertex.x - crop.x) * zoom,
          y = target.y + (vertex.y - crop.y) * zoom;
          context.beginPath();
          context.arc(x, y, radius, 0, angle, false);
          context.closePath();
          context.fill();
      }
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

SpriteHelper.processImage = function () {
  var g = SpriteHelper,
      image = g.image,
      width = image.width,
      height = image.height,
      canvas = g.canvas.main,
      source = g.source,
      autoboxContext = source.autobox.canvas.context,
      imageContext = source.image.canvas.context,
      shadowContext = source.shadow.canvas.context,
      grid = g.grid = new Array(width);
  for (var x = 0; x < width; ++x) {
    grid[x] = new Array(height);
  }
  imageContext.drawImage(g.image, 0, 0);
  var data = imageContext.getImageData(0, 0, width, height).data,
    i = 0;
  for (var y = 0; y < height; ++y) {
    for (var x = 0; x < width; ++x) {
      var cell = grid[x][y] = {
        r: data[i], g: data[i+1], b: data[i+2], a: data[i+3]
      };
      cell.visible = (cell.a != 0);
      i += 4;
    }
  }

  var blobs = [], dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0];

  // Flood fill to find blobs, i.e., sets of contiguous cells.
  function flood(x, y, id) {
    grid[x][y].id = id;
    var blob = blobs[id];
    blob.min.x = Math.min(blob.min.x, x);
    blob.min.y = Math.min(blob.min.y, y);
    blob.max.x = Math.max(blob.max.x, x);
    blob.max.y = Math.max(blob.max.y, y);
    for (var i = 0; i < 4; ++i) {
      var X = x+dx[i], Y = y+dy[i];
      if (X >= 0 && X < width && Y >= 0 && Y < height) {
        var cell = grid[X][Y];
        if (cell.visible && cell.id === undefined) {
          flood(X, Y, id);
        }
      }
    }
  }
  for (var y = 0; y < height; ++y) {
    for (var x = 0; x < width; ++x) {
      var cell = grid[x][y];
      if (cell.visible && cell.id === undefined) {
        var id = blobs.length;
        blobs.push({ min: { x: x, y: y }, max: { x: x, y: y } });
        flood(x, y, id);
      }
    }
  }

  // For each blob, make a polygon that traces its perimeter.
  var polygons = g.polygons = [];

  // Cells neighboring a perimeter segment during clockwise traversal.
  var sides = 
    [ { left: { r: -1, c: -1 }, right: { r: -1, c: 0 } },
      { left: { r: -1, c: 0 }, right: { r: 0, c: 0 } },
      { left: { r: 0, c: 0 }, right: { r: 0, c: -1 } },
      { left: { r: 0, c: -1 }, right: { r: -1, c: -1 } } ];

  // Helps check the left and right neighbors.
  function isFilled(x, y) {
    return x >= 0 && x < width && y >= 0 && y < height && grid[x][y].visible;
  }

  for (var id = 0; id < blobs.length; ++id) {
    var blob = blobs[id];
    // Find the leftmost pixel in the top row.
    var x = blob.min.x, y = blob.min.y;
    while (grid[x][y].id != id) {
      ++x;
    }
    g.message('id = '+id+', x = '+x+', y = '+y);
    // We have found the first corner.
    var polygon = [{ x: x, y: y }];
    // We are heading east.
    var dir = 1, count = 0;
    // Find the remaining corners.
    while (true) {
      // Proceed in the current direction until we hit a corner.
      x += dx[dir];
      y += dy[dir];
      var left = isFilled(x + sides[dir].left.c, y + sides[dir].left.r),
          right = isFilled(x + sides[dir].right.c, y + sides[dir].right.r);
      // Check if we're going along the side. If not, we're at a corner.
      if (!left && right) {
        continue;
      }

      // Calculate the angle of the vector from the previous corner to
      //  the current corner.
      var previous = polygon[polygon.length-1];
      previous.angle = g.calculateAngle(previous.x, previous.y, x, y);

      // Is this the corner we departed from?
      if (x == polygon[0].x && y == polygon[0].y) {
        break;
      }
      polygon.push({ x: x, y: y });
      if (left) {           // Turn left.
        dir = (dir+3)%4;
      } else {              // Turn right.
        dir = (dir+1)%4;
      }
    }
    polygons.push(polygon);
  }

  // Calculate automatic boundary points.
  for (var i = 0; i < polygons.length; i++) {
    var polygon = polygons[i],
        previous = polygon[polygon.length-1];
    for (var j = 0; j < polygon.length; j++) {
      var current = polygon[j],
        a = previous.angle,
        b = current.angle,
        turn = b-a,
        alpha = (Math.PI - turn)/2,
        angle = a - alpha,
        distance = g.boundary.gap / Math.sin(alpha);
      current.dx = distance * Math.cos(angle);
      current.dy = distance * Math.sin(angle);
      previous = current;
    }
  }

  autoboxContext.fillStyle = '#999';
  shadowContext.fillStyle = '#000';
  for (var i = 0; i < blobs.length; ++i) {
    var blob = blobs[i],
      min = blob.min, max = blob.max;
    blob.width = max.x - min.x + 1;
    blob.height = max.y - min.y + 1;
    autoboxContext.fillRect(min.x, min.y, blob.width, blob.height);
    for (var y = min.y; y <= max.y; ++y) {
      for (var x = min.x; x <= max.x; ++x) {
        if (grid[x][y].visible) {
          shadowContext.fillRect(x, y, 1, 1);
        }
      }
    }
  }
};

SpriteHelper.calculateAngle = function (x1, y1, x2, y2) {
  var x = x2-x1, y = y2-y1,
      r = Math.sqrt(x*x + y*y);
  return y >= 0 ? Math.acos(x/r) : 2*Math.PI - Math.acos(x/r);
};

// Click and drag to pan the canvas.
SpriteHelper.mouseDownCanvas = function (event) {
  var g = SpriteHelper,
      canvas = g.canvas.main,
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
        canvas = g.canvas.main;
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

SpriteHelper.startInspectingPixels = function () {
  var g = SpriteHelper;
  if (g.inspectingPixels) {
    return;
  }
  if (g.inspectorBox === undefined) {
    g.inspectorBox = document.createElement('div');
    g.inspectorBox.id = 'inspectorBox';
    var spans = g.inspectorBox.spans = {
        opacity: document.createElement('span'),
        color: document.createElement('span')
    };
    $(spans.opacity).addClass('opacity');
    $(spans.color).addClass('color');
    g.inspectorBox.appendChild(spans.opacity);
    g.inspectorBox.appendChild(spans.color);
    document.getElementById('wrapper').appendChild(g.inspectorBox);
  }
  g.inspectingPixels = true;
  g.inspectPixel();
  $(window).mousemove(g.inspectPixel);
};
SpriteHelper.inspectPixel = function () {
  var g = SpriteHelper,
      inspectorBox = g.inspectorBox,
      d2h = g.decimalToHexString,
      zoom = g.zoom,
      crop = g.crop,
      target = g.target,
      offset = $(g.canvas.main).offset(),
      width = g.image.width,
      height = g.image.height,
      pageX = g.mouseEvent.pageX,
      pageY = g.mouseEvent.pageY,
      rawX = pageX - offset.left,
      rawY = pageY - offset.top,
      x = Math.floor((rawX - target.x) / zoom + crop.x),
      y = Math.floor((rawY - target.y) / zoom + crop.y),
      canvasWidth = g.canvas.main.width,
      canvasHeight = g.canvas.main.height;
  if (g.removeFrame) {
    g.removeFrame();
    g.removeFrame = undefined;
  }
  if (rawX <= 0 || rawX > canvasWidth || rawY <= 0 || rawY > canvasHeight ||
      x < 0 || x >= width || y < 0 || y >= height) {
    inspectorBox.style.visibility = 'hidden';
    return
  }
  inspectorBox.style.visibility = 'visible';
  var cell = g.grid[x][y],
      color = '#' + d2h[cell.r] + d2h[cell.g] + d2h[cell.b],
      opacity = Math.round(100 * cell.a / 256);
  if (cell.r + cell.g + cell.b >= 384) {
    var contrastColor = '#000';
  } else {
    var contrastColor = '#fff';
  }
  var context = g.canvas.control.context,
      boxX = target.x + zoom*(x - crop.x),
      boxY = target.y + zoom*(y - crop.y);
  inspectorBox.style.color = contrastColor;
  inspectorBox.style.backgroundColor = color;
  inspectorBox.spans.color.innerHTML = color;
  inspectorBox.spans.opacity.innerHTML =
          (opacity == 100 ? '' : (opacity >= 10 ? '&nbsp;': '&nbsp;&nbsp;')) +
          opacity + '%';
  var boxWidth = $(inspectorBox).outerWidth(),
      boxHeight = $(inspectorBox).outerHeight();
  inspectorBox.style.left = Math.min(Math.max(0, boxX + offset.left - 31),
      canvasWidth - boxWidth) + 'px';
  inspectorBox.style.top = (boxY + offset.top - boxHeight - 12) + 'px';
  // Disable fuzzy interpolation.
  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;
  context.msImageSmoothingEnabled = false;
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#ddd';
  context.fillRect(boxX-3, boxY-3, zoom+6, zoom+6);
  context.fillStyle = '#333';
  context.fillRect(boxX-2, boxY-2, zoom+4, zoom+4);
  context.clearRect(boxX, boxY, zoom, zoom);
  g.removeFrame = function () {
    context.clearRect(boxX-4, boxY-4, zoom+8, zoom+8);
  };
};
SpriteHelper.stopInspectingPixels = function () {
  var g = SpriteHelper;
  if (g.removeFrame) {
    g.removeFrame();
    g.removeFrame = undefined;
  }
  if (g.inspectingPixels) {
    g.inspectingPixels = false;
    $(window).off('mousemove', g.inspectPixel);
    g.inspectorBox.style.visibility = 'hidden';
  }
};

SpriteHelper.load = function () {
  var g = SpriteHelper,
      panel = g.panel = document.getElementById('controlPanel'),
      wrapper = document.getElementById('wrapper');

  // Make target canvases. Control is the mouse-sensitive, topmost canvas.
  var names = ['main', 'boundary', 'vertices', 'control'];
  g.canvas = {};
  g.canvases = [];
  for (var i = 0; i < names.length; ++i) {
    var name = names[i];
    var canvas = document.createElement('canvas');
    var context = canvas.context = canvas.getContext('2d');
    $(canvas).addClass('target');
    canvas.id = name+'Canvas';
    g.canvas[name] = canvas;
    g.canvases.push(canvas);
    wrapper.appendChild(canvas);
  }

  var layout = g.layout,
      panelSize = layout.panel.content + layout.panel.border;

  // See http://evanhahn.com/how-to-disable-copy-paste-on-your-website/
  function makeUnselectable() {
    // The CSS properties cover Chrome, Firefox, Safari, IE 10, and new Opera.
    $(this).addClass('unselectable');
    // This JavaScript is for IE 4 through IE 9.
    $(this).on('dragstart, selectstart', function (event) {
      event.preventDefault();
    });
  }
  $('#controlPanel').each(makeUnselectable);

  var resize = function () {
    for (var i = 0; i < g.canvases.length; ++i) {
      var canvas = g.canvases[i];
      canvas.style.top = panelSize + 'px';
      canvas.height = $(window).height() - panelSize;
      canvas.width = $(window).width();
      panel.style.width = canvas.width + 'px';
      panel.style.height = layout.panel.content + 'px';
      panel.style.borderBottom = layout.panel.border + 'px solid ' +
          layout.panel.borderColor;
      canvas.width = $(window).width();
      canvas.height = $(window).height() - panelSize;
    }
    g.paint();
  };

  g.image = new Image();
  g.image.src = g.imageSource;
  g.image.onload = function () {
    for (var i = 0; i < g.canvases.length; ++i) {
      var canvas = g.canvases[i];
      canvas.style.display = 'block';
    }
    panel.style.display = 'block';
    g.source = {};
    g.sources = [];
    var names = ['autobox', 'image', 'shadow'];
    for (var i = 0; i < names.length; ++i) {
      var name = names[i];
      var source = g.source[name] = {
        name: name,
        checkbox: document.getElementById(
            'show' + name[0].toUpperCase() + name.substring(1)),
        canvas: document.createElement('canvas')
      };
      source.checkbox.onclick = function () {
        g.paint();
      };
      source.canvas.width = g.image.width;
      source.canvas.height = g.image.height;
      source.canvas.context = source.canvas.getContext('2d');
      g.sources.push(source);
    }

    // If a checkbox state is modified, we clear the main canvas and
    //  render all visible sources. In some respects it would be
    //  more efficient to have a separate rendering canvas for each
    //  source, and to modify the visibility of a canvas when the
    //  corresponding checkbox is modified. However, there is no
    //  perceptible rendering delay with the current approach.
    g.source.image.checkbox.checked = true;

    g.reset();
    g.processImage();
    resize();
    $(window).on('resize', resize);
    $(g.canvas.control).mousedown(g.mouseDownCanvas);
    var keyDownHandlers = {
      68: g.zoomOut,
      70: g.zoomIn,
      65: g.startInspectingPixels
    };
    $(window).keydown(function (event) {
      var handler = keyDownHandlers[event.which];
      if (handler === undefined) {
        g.message('key down: '+event.which);
      } else {
        handler();
      }
    });
    var keyUpHandlers = {
      65: g.stopInspectingPixels
    };
    $(window).keyup(function (event) {
      var handler = keyUpHandlers[event.which];
      if (handler === undefined) {
        g.message('key up: '+event.which);
      } else {
        handler();
      }
    });
    $('#reset1x').mousedown(g.reset1x);
  };

  function mouseTracker(event) {
    g.mouseEvent = event;
  }
  $(window).mousemove(mouseTracker);

  // Preload hex values to improve pixel-inspector performance.
  g.decimalToHexString = {};
  for (var decimal = 0; decimal < 256; ++decimal) {
    g.decimalToHexString[decimal] = (decimal < 16 ? '0' : '') +
        decimal.toString(16);
  }

    // The boundary is on a target canvas, not a source layer, and
    //  we're dealing with it differently. This is a temporary kludge.
    //  TODO: Deal with all checkboxes in the same way.
    var canvas = g.canvas.boundary;
    canvas.checkbox = document.getElementById('showBoundary');
    canvas.checkbox.onclick = function () {
      canvas.style.visibility = canvas.checkbox.checked ?
          'visible' : 'hidden';
      if (canvas.checkbox.checked) {
        g.paint();
      }
    };
    canvas.checkbox.checked = true;
    canvas = g.canvas.vertices;
    canvas.checkbox = document.getElementById('showVertices');
    canvas.checkbox.onclick = function () {
      canvas.style.visibility = canvas.checkbox.checked ?
          'visible' : 'hidden';
      if (canvas.checkbox.checked) {
        g.paint();
      }
    };
    canvas.checkbox.checked = true;
};

$(window).load(SpriteHelper.load);
