/**
 * @license GridJS
 * (c) 2015 Sneezry http://gridjs.org
 * License: MIT
 */
(function(window, document, undefined) {'use strict';

var grid = window.grid = window.grid || {},
    workplace = createWorkplace(),
    ImageObject;

grid.open = open;

ImageObject = function() {
  this.width        = null;
  this.height       = null;
  this.pixel        = null;
  this.imageData    = null;
};

ImageObject.prototype.grayscale    = grayscale;
ImageObject.prototype.putImage     = putImage;
ImageObject.prototype.blend        = blend;
ImageObject.prototype.copy         = copy;
ImageObject.prototype.resize       = resize;
ImageObject.prototype.rotate       = rotate;

function createWorkplace() {
  var canvas = document.createElement('canvas');
  canvas.style.display = 'none';
  document.getElementsByTagName('body')[0].appendChild(canvas);
  return canvas;
}

function getImageDataFromURL(url, callback) {
  workplace = workplace || createWorkplace();
  var width,
      height,
      imageData,
      context = workplace.getContext('2d'),
      image = new Image();

  image.addEventListener('load', function() {
    width = image.width;
    height = image.height;
    workplace.width = width;
    workplace.height = height;
    context.drawImage(image, 0, 0);
    imageData = context.getImageData(0, 0, width, height);
    callback(imageData);
  }, false);
  image.src = url;
}

function getPixelFromImageData(imageData) {
  var x,
      y,
      index,
      width = imageData.width,
      height = imageData.height,
      I = imageData.data,
      pixel = {
        'r' : [],
        'g' : [],
        'b' : [],
        'a' : []
      };

  for (y = 0; y < height; y++) {
    pixel.r[y] = [];
    pixel.g[y] = [];
    pixel.b[y] = [];
    pixel.a[y] = [];
    for (x = 0; x < width; x++) {
      index = (y * width + x) * 4;
      pixel.r[y][x] = I[index];
      pixel.g[y][x] = I[index + 1];
      pixel.b[y][x] = I[index + 2];
      pixel.a[y][x] = I[index + 3] / 255;
    }
  }

  return pixel;
}

function getPixelFromURL(url, callback) {
  getImageDataFromURL(url, function(imageData) {
    getPixelFromImageData(imageData, callback);
  });
}

function getPixel(image, callback) {
  if (typeof(image) === 'string') {
    getPixelFromURL(image, callback);
  } else if (Array.isArray(image.r) === true) {
    callback(image);
  } else {
    getPixelFromImageData(image, callback);
  }
}

function getImageData(image, callback) {
  if (typeof(image) === 'string') {
    getImageDataFromURL(image, callback);
  } else if (Array.isArray(image.r) === true) {
    callback(getImageDataFromPixel(image));
  } else {
    callback(image);
  }
}

function getImageDataFromPixel(pixel) {
  workplace = workplace || createWorkplace();
  var x,
      y,
      index,
      width = pixel.r[0].length,
      height = pixel.r.length,
      context = workplace.getContext('2d'),
      imageData = context.createImageData(width, height);

  workplace.width = width;
  workplace.height = height;

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      index = (y * width + x) * 4;
      imageData.data[index]   = pixel.r[y][x];
      imageData.data[index + 1] = pixel.g[y][x];
      imageData.data[index + 2] = pixel.b[y][x];
      imageData.data[index + 3] = Math.round(pixel.a[y][x] * 255);
    }
  }

  return imageData;
}

function open(image, callback) {
  var width,
      height,
      imageData,
      imageObject,
      pixel;

  if (Array.isArray(image.r) === true) {
    width = image[0].length;
    height = image.length;
    imageData = getImageDataFromPixel(image);

    imageObject = new ImageObject();
    imageObject.prototype.pixel = image;
    imageObject.prototype.imageData = imageData;
    imageObject.prototype.height = height;
    imageObject.prototype.width = width;

    callback(imageObject);
  } else if (typeof(image) === 'string') {
    getImageDataFromURL(image, function(imageData) {
      width = imageData.width;
      height = imageData.height;
      pixel = getPixelFromImageData(imageData);

      imageObject = new ImageObject();
      imageObject.pixel = pixel;
      imageObject.imageData = imageData;
      imageObject.height = height;
      imageObject.width = width;

      callback(imageObject);
    });
  } else if (typeof(image) === 'object') {
    width = image.width;
    height = image.height;
    pixel = getPixelFromImageData(image);

    imageObject = new ImageObject();
    imageObject.pixel = pixel;
    imageObject.imageData = image;
    imageObject.height = height;
    imageObject.width = width;

    callback(imageObject);
  }
}

function grayscale() {
  var x,
      y,
      gray,
      imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      grayImageObject = new ImageObject(),
      pixel = {
        'r' : [],
        'g' : [],
        'b' : [],
        'a' : []
      };
    
  for (y = 0; y < height; y++) {
    pixel.r[y] = [];
    pixel.g[y] = [];
    pixel.b[y] = [];
    pixel.a[y] = [];
    for (x = 0; x < width; x++) {
      gray = 0.299 * imageObject.pixel.r[y][x] +
             0.587 * imageObject.pixel.g[y][x] +
             0.114 * imageObject.pixel.b[y][x];
      pixel.r[y][x] = pixel.g[y][x] = pixel.b[y][x] = gray;
      pixel.a[y][x] = imageObject.pixel.a[y][x];
    }
  }

  grayImageObject.pixel = pixel;
  grayImageObject.imageData = getImageDataFromPixel(pixel);
  grayImageObject.height = height;
  grayImageObject.width = width;

  return grayImageObject;
}

function putImage(canvas) {
  var context,
      imageObject = this;

  canvas.width = imageObject.width;
  canvas.height = imageObject.height;
  context = canvas.getContext('2d');

  context.putImageData(imageObject.imageData, 0, 0);

  return imageObject;
}

function blend(srcImageObject, offsetX, offsetY) {
  var x,
      y,
      imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      srcWidth = srcImageObject.width,
      srcHeight = srcImageObject.height,
      pixel = {
        'r' : [],
        'g' : [],
        'b' : [],
        'a' : []
      };

  offsetX = isNaN(offsetX) ? 0 : Math.round(offsetX);
  offsetY = isNaN(offsetY) ? 0 : Math.round(offsetY);

  for (y = 0; y < height; y++) {
    pixel.r[y] = [];
    pixel.g[y] = [];
    pixel.b[y] = [];
    pixel.a[y] = [];
    for (x = 0; x < width; x++) {
      pixel.a[y][x] = (y - offsetY < 0 || x - offsetX < 0 ||
              y - offsetY >= srcHeight || x - offsetX >= srcWidth) ?
          imageObject.pixel.a[y][x] :
          (srcImageObject.pixel.a[y - offsetY][x - offsetX] +
              imageObject.pixel.a[y][x] *
              (1 - srcImageObject.pixel.a[y - offsetY][x - offsetX]));

      pixel.r[y][x] = (y - offsetY < 0 || x - offsetX < 0 ||
              y - offsetY >= srcHeight || x - offsetX >= srcWidth || pixel.a[y][x] < 0.003) ?
          imageObject.pixel.r[y][x] :
          (srcImageObject.pixel.r[y - offsetY][x - offsetX] * srcImageObject.pixel.a[y - offsetY][x - offsetX] +
              imageObject.pixel.r[y][x] * imageObject.pixel.a[y][x] *
              (1 - srcImageObject.pixel.a[y - offsetY][x - offsetX])) / pixel.a[y][x];

      pixel.g[y][x] = (y - offsetY < 0 || x - offsetX < 0 ||
              y - offsetY >= srcHeight || x - offsetX >= srcWidth || pixel.a[y][x] < 0.003) ?
          imageObject.pixel.g[y][x] :
          (srcImageObject.pixel.g[y - offsetY][x - offsetX] * srcImageObject.pixel.a[y - offsetY][x - offsetX] +
              imageObject.pixel.g[y][x] * imageObject.pixel.a[y][x] *
              (1 - srcImageObject.pixel.a[y - offsetY][x - offsetX])) / pixel.a[y][x];

      pixel.b[y][x] = (y - offsetY < 0 || x - offsetX < 0 ||
              y - offsetY >= srcHeight || x - offsetX >= srcWidth || pixel.a[y][x] < 0.003) ?
          imageObject.pixel.b[y][x] :
          (srcImageObject.pixel.b[y - offsetY][x - offsetX] * srcImageObject.pixel.a[y - offsetY][x - offsetX] +
              imageObject.pixel.b[y][x] * imageObject.pixel.a[y][x] *
              (1 - srcImageObject.pixel.a[y - offsetY][x - offsetX])) / pixel.a[y][x];

      pixel.r[y][x] = Math.round(pixel.r[y][x]);
      pixel.g[y][x] = Math.round(pixel.g[y][x]);
      pixel.b[y][x] = Math.round(pixel.b[y][x]);

      if (pixel.a[y][x] < 0.003) {
        pixel.a[y][x] = imageObject.pixel.a[y][x];
      }
    }
  }

  imageObject.pixel = pixel;
  imageObject.imageData = getImageDataFromPixel(pixel);
  imageObject.height = height;
  imageObject.width = width;

  return imageObject;
}

function copy() {
  var x,
      y,
      imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      newImageObject = new ImageObject(),
      pixel = {
        'r' : [],
        'g' : [],
        'b' : [],
        'a' : []
      };

  for (y = 0; y < height; y++) {
    pixel.r[y] = [];
    pixel.g[y] = [];
    pixel.b[y] = [];
    pixel.a[y] = [];
    for (x = 0; x < width; x++) {
      pixel.r[y][x] = imageObject.pixel.r[y][x];
      pixel.g[y][x] = imageObject.pixel.g[y][x];
      pixel.b[y][x] = imageObject.pixel.b[y][x];
      pixel.a[y][x] = imageObject.pixel.a[y][x];
    }
  }

  newImageObject.pixel = pixel;
  newImageObject.imageData = getImageDataFromPixel(pixel);
  newImageObject.height = height;
  newImageObject.width = width;

  return newImageObject;
}

function resize(newWidth, newHeight) {
  var imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      context = workplace.getContext('2d'),
      tempWorkplace = document.createElement('canvas'),
      tempContext = tempWorkplace.getContext('2d');

  tempWorkplace.width = width;
  tempWorkplace.height = height;
  tempContext.putImageData(imageObject.imageData, 0, 0);

  workplace.width = newWidth;
  workplace.height = newHeight;
  context.drawImage(tempWorkplace, 0, 0, newWidth, newHeight);

  tempWorkplace = null;
  tempContext = null;

  imageObject.width = newWidth;
  imageObject.height = newHeight;
  imageObject.imageData = context.getImageData(0, 0, newWidth, newHeight);
  imageObject.pixel = getPixelFromImageData(imageObject.imageData);

  return imageObject;
}

function rotate(degree) {
  var imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      rad = -degree * Math.PI / 180,
      context = workplace.getContext('2d'),
      tempWorkplace = document.createElement('canvas'),
      tempContext = tempWorkplace.getContext('2d'),
      rotatedWidth, rotatedHeight;

  tempWorkplace.width = width;
  tempWorkplace.height = height;
  tempContext.putImageData(imageObject.imageData, 0, 0);

  rotatedWidth = Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad));
  rotatedWidth = Math.ceil(rotatedWidth);
  rotatedHeight = Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad));
  rotatedHeight = Math.ceil(rotatedHeight);

  workplace.width = rotatedWidth;
  workplace.height = rotatedHeight;
  context.translate(rotatedWidth / 2, rotatedHeight / 2);
  context.rotate(rad);
  context.translate(-width / 2, -height / 2);
  context.drawImage(tempWorkplace, 0, 0);

  imageObject.width = rotatedWidth;
  imageObject.height = rotatedHeight;
  imageObject.imageData = context.getImageData(0, 0, rotatedWidth, rotatedHeight);
  imageObject.pixel = getPixelFromImageData(imageObject.imageData);

  return imageObject;
}

})(window, document);