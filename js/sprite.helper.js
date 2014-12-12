var SpriteHelper = {
	canvasWidth: 960, canvasHeight: 720,
  imageSource: '../sprites.png'
};

SpriteHelper.zoom = function() {
	var global = SpriteHelper;
  global.drawImage(global.image, 0, 0);
};

SpriteHelper.load = function () {
	var global = SpriteHelper;

	var canvas = global.canvas = document.getElementById('mainCanvas');
	canvas.width = global.canvasWidth;
	canvas.height = global.canvasHeight;
	var canvasContainer = document.getElementById('mainCanvasContainer');
	global.canvasContainer = canvasContainer;
	canvasContainer.style.width = global.canvasWidth + 'px';
	canvasContainer.style.height = global.canvasHeight + 'px';
	var context = canvas.context = canvas.getContext('2d');

  global.image = new Image();
  global.image.src = global.imageSource;
  global.zoomLevel = 1;
  global.zoom();
};

window.onload = SpriteHelper.load;
