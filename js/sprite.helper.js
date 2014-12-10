var SpriteHelper = {
	canvasWidth: 960, canvasHeight: 720,
  imageSource: 'sprites.png'
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

};

window.onload = SpriteHelper.load;
