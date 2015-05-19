/**
 * @license GridJS
 * (c) 2015 Sneezry http://gridjs.org
 * License: MIT
 */
(function(window, document, undefined) {'use strict';

var gridjs = window.gridjs = window.gridjs || {},
    workplace = createWorkplace(),
    imageDataWorkplace = createWorkplace(),
    ImageObject;

ImageObject = function() {
  this.width        = null;
  this.height       = null;
  this.pixel        = null;
  this.imageData    = null;
  this.origin       = null;
  this.originLeft   = null;
  this.originTop    = null;
};

function createWorkplace() {
  return document.createElement('canvas');
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
  var x, y, index,
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

function getGrayPixelFromImageData(imageData) {
  var x, y, index,
      width = imageData.width,
      height = imageData.height,
      I = imageData.data,
      pixel = {
        'G' : [],
        'a' : []
      };

  for (y = 0; y < height; y++) {
    pixel.G[y] = [];
    pixel.a[y] = [];
    for (x = 0; x < width; x++) {
      index = (y * width + x) * 4;
      pixel.G[y][x] = I[index];
      pixel.a[y][x] = I[index + 3] / 255;
    }
  }

  pixel.r = pixel.G;
  pixel.g = pixel.G;
  pixel.b = pixel.G;

  return pixel;
}

function getImageDataFromPixel(pixel) {
  var x, y, index,
      width = pixel.r[0].length,
      height = pixel.r.length,
      context = workplace.getContext('2d'),
      imageData = context.createImageData(width, height);

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

function getImageFromImageData(imageData) {
  var imageDataContext = imageDataWorkplace.getContext('2d');

  imageDataWorkplace.width = imageData.width;
  imageDataWorkplace.height = imageData.height;
  imageDataContext.putImageData(imageData, 0, 0);

  return imageDataWorkplace;
}

gridjs.getImageObject = function(image, callback) {
  if (typeof(image) === 'string') {
    gridjs.getImageObjectFromURL(image, callback);
  } else if (Array.isArray(image.r) === true) {
    callback(gridjs.getImageObjectFromPixel(image));
  } else if (typeof(image) === 'object') {
    callback(gridjs.getImageObjectFromImageData(image));
  }
};

gridjs.open = gridjs.getImageObject;

gridjs.getImageObjectFromURL = function(url, callback) {
  getImageDataFromURL(url, function(imageData) {
    var imageObject = new ImageObject();
    imageObject.imageData = imageData;
    imageObject.pixel = getPixelFromImageData(imageData);
    imageObject.width = imageData.width;
    imageObject.height = imageData.height;

    callback(imageObject);
  });
};

gridjs.getImageObjectFromImageData = function(imageData) {
  var width = imageData.width,
      height = imageData.height,
      pixel = getPixelFromImageData(imageData),
      imageObject = new ImageObject();

  imageObject.pixel = pixel;
  imageObject.imageData = imageData;
  imageObject.height = height;
  imageObject.width = width;

  return imageObject;
};

gridjs.getImageObjectFromPixel = function(pixel) {
  var width = pixel[0].length,
      height = pixel.length,
      imageData = getImageDataFromPixel(pixel),
      imageObject = new ImageObject();

    imageObject.pixel = pixel;
    imageObject.imageData = imageData;
    imageObject.height = height;
    imageObject.width = width;

    return imageObject;
};

gridjs.convolution = function(srcArray, maskArray) {
  var x, y, mX, mY, cX, cY, value,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length,
      maskWidth = maskArray[0].length,
      maskHeight = maskArray.length,
      halfMaskWidth = Math.round(maskWidth / 2) - 1,
      halfMaskHeight = Math.round(maskHeight / 2) - 1;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      value = 0;
      for (mY = 0; mY < maskHeight; mY++) {
        for (mX = 0; mX < maskWidth; mX ++) {
          cX = x - halfMaskWidth + mX;
          cY = y - halfMaskHeight + mY;
          if (cX >= 0 && cX < width && cY >= 0 && cY < height) {
            value += srcArray[cY][cX] * maskArray[mY][mX];
          }
        }
      }
      newArray[y][x] = value;
    }
  }

  return newArray;
};

gridjs.conv = gridjs.convolution;

gridjs.abs = function(srcArray) {
  var x, y,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      newArray[y][x] = Math.abs(srcArray[y][x]);
    }
  }

  return newArray;
};

gridjs.square = function(srcArray) {
  var x, y,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      newArray[y][x] = srcArray[y][x] * srcArray[y][x];
    }
  }

  return newArray;
};

gridjs.sqrt = function(srcArray) {
  var x, y,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      newArray[y][x] = Math.sqrt(srcArray[y][x]);
    }
  }

  return newArray;
};

gridjs.gauseCore = function(size, sigma, derivative) {
  var x, y, deltaX, deltaY,
      sum = 0,
      halfSize = Math.round(size / 2),
      core = [];

  sigma = sigma || 1;

  for (y = 0; y < size; y++) {
    core[y] = [];
    for (x = 0; x < size; x++) {
      if (x < halfSize && y < halfSize) {
        deltaX = x - halfSize + 1;
        deltaY = y - halfSize + 1;
        switch (derivative) {
          case 0:
            core[y][x] = -deltaX *
                Math.exp(-(deltaX * deltaX + deltaY * deltaY) / (2 * sigma * sigma)) /
                (sigma * sigma * sigma);
            break;
          case 1:
            core[y][x] = -deltaY *
                Math.exp(-(deltaX * deltaX + deltaY * deltaY) / (2 * sigma * sigma)) /
                (sigma * sigma * sigma);
            break;
          case 2:
            core[y][x] = deltaX * deltaY *
                Math.exp(-(deltaX * deltaX + deltaY * deltaY) / (2 * sigma * sigma)) /
                (sigma * sigma * sigma * sigma * sigma);
            break;
          default:
            core[y][x] = Math.exp(-(deltaX * deltaX + deltaY * deltaY) / (2 * sigma * sigma)) /
                sigma;
        }
      } else if (x < halfSize) {
        if (derivative === 1 || derivative === 2) {
          core[y][x] = -core[size - y - 1][x];
        } else {
          core[y][x] = core[size - y - 1][x];
        }
      } else if (y < halfSize) {
        if (derivative === 0 || derivative === 2) {
          core[y][x] = -core[y][size - x - 1];
        } else {
          core[y][x] = core[y][size - x - 1];
        }
      } else {
        if (derivative === 0 || derivative === 1) {
          core[y][x] = -core[size - y - 1][size - x - 1];
        } else {
          core[y][x] = core[size - y - 1][size - x - 1];
        }
      }

      sum += Math.abs(core[y][x]);
    }
  }

  if (derivative !== undefined) {
    for (y = 0; y < size; y++) {
      for (x = 0; x < size; x++) {
        core[y][x] /= sum;
      }
    }
  }

  return core;
};

gridjs.gauss = function(srcArray, size, sigma, derivative) {
  var mask = gridjs.gauseCore(size, sigma, derivative);

  return gridjs.convolution(srcArray, mask);
};

gridjs.add = function(srcArray, dstArray) {
  var x, y,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      newArray[y][x] = srcArray[y][x] + dstArray[y][x];
    }
  }

  return newArray;
};

gridjs.minus = function(srcArray, dstArray) {
  var x, y,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      newArray[y][x] = srcArray[y][x] - dstArray[y][x];
    }
  }

  return newArray;
};

gridjs.multiply = function(srcArray, dstArray) {
  var x, y,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      newArray[y][x] = srcArray[y][x] * 
          (Array.isArray(dstArray) ? dstArray[y][x] : dstArray);
    }
  }

  return newArray;
};

gridjs.mul = gridjs.multiply;

gridjs.divide = function(srcArray, dstArray, defaultValue) {
  var x, y, denominator,
      newArray = [],
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      denominator = (Array.isArray(dstArray) ? dstArray[y][x] : dstArray);
      if (defaultValue !== undefined) {
        newArray[y][x] = (denominator === 0 ? defaultValue : (srcArray[y][x] / denominator));
      } else {
        newArray[y][x] = srcArray[y][x] / denominator; 
      } 
    }
  }

  return newArray;
};

gridjs.div = gridjs.divide;

gridjs.zeros = function(width, height) {
  if (Array.isArray(width)) {
    height = width.length;
    width = width[0].length;
  }

  return gridjs.ones(width, height, 0);
};

gridjs.ones = function(width, height, value) {
  var x, y,
      newArray = [];

  if (Array.isArray(width)) {
    value = height;
    height = width.length;
    width = width[0].length;
  }

  value = (value === undefined) ? 1 : value;

  for (y = 0; y < height; y++) {
    newArray[y] = [];
    for (x = 0; x < width; x++) {
      newArray[y][x] = value;
    }
  }

  return newArray;
};

gridjs.normalize = function(srcArray, min, max) {
  var x, y, minValue, maxValue,
      width = srcArray[0].length,
      height = srcArray.length;

  min = (min === undefined) ? 0 : min;
  max = (max === undefined) ? 1 : max;

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      if (minValue === undefined || minValue > srcArray[y][x]) {
        minValue = srcArray[y][x];
      }
      if (maxValue === undefined || maxValue < srcArray[y][x]) {
        maxValue = srcArray[y][x];
      }
    }
  }

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      srcArray[y][x] = (srcArray[y][x] - minValue) * (max - min) / (maxValue - minValue) + min;
    }
  }

  return srcArray;
};

gridjs.norm = gridjs.normalize;

gridjs.cutoff = function(srcArray, max) {
  var x, y,
      width = srcArray[0].length,
      height = srcArray.length;

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      srcArray[y][x] = Math.min(srcArray[y][x], max);
    }
  }

  return srcArray;
};

ImageObject.prototype.grayscale = function() {
  var x, y, gray,
      imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      pixel = {
        'G' : [],
        'a' : []
      };
    
  for (y = 0; y < height; y++) {
    pixel.G[y] = [];
    pixel.a[y] = [];
    for (x = 0; x < width; x++) {
      gray = 0.299 * imageObject.pixel.r[y][x] +
             0.587 * imageObject.pixel.g[y][x] +
             0.114 * imageObject.pixel.b[y][x];
      pixel.G[y][x] = Math.round(gray);
      pixel.a[y][x] = imageObject.pixel.a[y][x];
    }
  }
  pixel.r = pixel.G;
  pixel.g = pixel.G;
  pixel.b = pixel.G;

  imageObject.pixel = pixel;
  imageObject.imageData = getImageDataFromPixel(pixel);

  return imageObject;
};

ImageObject.prototype.show = function(canvas) {
  var context,
      imageObject = this;

  canvas.width = imageObject.width;
  canvas.height = imageObject.height;
  context = canvas.getContext('2d');

  context.putImageData(imageObject.imageData, 0, 0);

  return imageObject;
};

ImageObject.prototype.blend = function(srcImageObject, offsetX, offsetY) {
  var x, y,
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

  imageObject.width = width;
  imageObject.height = height;
  imageObject.pixel = pixel;
  imageObject.imageData = getImageDataFromPixel(pixel);

  return imageObject;
};

ImageObject.prototype.copy = function() {
  var x, y,
      imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      newImageObject = new ImageObject(),
      pixel = {
        'a' : []
      };

  if (imageObject.pixel.G !== undefined) {
    pixel.G = [];
  } else {
    pixel.r = [];
    pixel.g = [];
    pixel.b = [];
  }

  for (y = 0; y < height; y++) {
    if (imageObject.pixel.G !== undefined) {
      pixel.G[y] = [];
    } else {
      pixel.r[y] = [];
      pixel.g[y] = [];
      pixel.b[y] = [];
    }
    pixel.a[y] = [];
    for (x = 0; x < width; x++) {
      if (imageObject.pixel.G !== undefined) {
        pixel.G[y][x] = imageObject.pixel.G[y][x];
      } else {
        pixel.r[y][x] = imageObject.pixel.r[y][x];
        pixel.g[y][x] = imageObject.pixel.g[y][x];
        pixel.b[y][x] = imageObject.pixel.b[y][x];
      }
      pixel.a[y][x] = imageObject.pixel.a[y][x];
    }
  }

  if (imageObject.pixel.G !== undefined) {
    pixel.r = pixel.G;
    pixel.g = pixel.G;
    pixel.b = pixel.G;
  }

  newImageObject.pixel = pixel;
  newImageObject.imageData = getImageDataFromPixel(pixel);
  newImageObject.height = height;
  newImageObject.width = width;

  return newImageObject;
};

ImageObject.prototype.resize = function(newWidth, newHeight) {
  var imageObject = this,
      context = workplace.getContext('2d'),
      image = getImageFromImageData(imageObject.imageData);

  workplace.width = newWidth;
  workplace.height = newHeight;
  context.drawImage(image, 0, 0, newWidth, newHeight);

  imageObject.width = newWidth;
  imageObject.height = newHeight;
  imageObject.imageData = context.getImageData(0, 0, newWidth, newHeight);

  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  return imageObject;
};

ImageObject.prototype.rotate = function(degree) {
  var imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      rad = -degree * Math.PI / 180,
      context = workplace.getContext('2d'),
      image = getImageFromImageData(imageObject.imageData),
      rotatedWidth, rotatedHeight;

  rotatedWidth = Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad));
  rotatedWidth = Math.round(rotatedWidth);
  rotatedHeight = Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad));
  rotatedHeight = Math.round(rotatedHeight);

  workplace.width = rotatedWidth;
  workplace.height = rotatedHeight;
  context.translate(rotatedWidth / 2, rotatedHeight / 2);
  context.rotate(rad);
  context.translate(-width / 2, -height / 2);
  context.drawImage(image, 0, 0);

  imageObject.width = rotatedWidth;
  imageObject.height = rotatedHeight;
  imageObject.imageData = context.getImageData(0, 0, rotatedWidth, rotatedHeight);
  
  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  return imageObject;
};

ImageObject.prototype.crop = function(left, top, cropWidth, cropHeight) {
  var imageObject = this,
      context = workplace.getContext('2d'),
      image = getImageFromImageData(imageObject.imageData);

  workplace.width = cropWidth;
  workplace.height = cropHeight;
  context.drawImage(image, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  imageObject.width = cropWidth;
  imageObject.height = cropHeight;
  imageObject.imageData = context.getImageData(0, 0, cropWidth, cropHeight);
  
  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  return imageObject;
};

ImageObject.prototype.updateImageData = function() {
  var imageObject = this,
      context = workplace.getContext('2d');

  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel.r = imageObject.pixel.G;
    imageObject.pixel.g = imageObject.pixel.G;
    imageObject.pixel.b = imageObject.pixel.G;
  }

  imageObject.imageData = getImageDataFromPixel(imageObject.pixel);
  imageObject.width = imageObject.imageData.width;
  imageObject.height = imageObject.imageData.height;

  if (imageObject.origin !== null) {
    workplace.width = imageObject.origin.width;
    workplace.height = imageObject.origin.height;
    context.putImageData(imageObject.origin.imageData, 0, 0);
    context.putImageData(imageObject.imageData, imageObject.originLeft, imageObject.originTop);
    imageObject.origin.imageData = context.getImageData(0, 0, imageObject.origin.width, imageObject.origin.height);
    
    if (imageObject.pixel.G !== undefined && imageObject.origin.pixel.G !== undefined) {
      imageObject.origin.pixel = getGrayPixelFromImageData(imageObject.origin.imageData);
    } else {
      imageObject.origin.pixel = getPixelFromImageData(imageObject.origin.imageData);
    }
  }

  return imageObject;
};

ImageObject.prototype.updatePixel = function() {
  var imageObject = this,
      context = workplace.getContext('2d');

  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  imageObject.width = imageObject.imageData.width;
  imageObject.height = imageObject.imageData.height;

  if (imageObject.origin !== null) {
    workplace.width = imageObject.origin.width;
    workplace.height = imageObject.origin.height;
    context.putImageData(imageObject.origin.imageData, 0, 0);
    context.putImageData(imageObject.imageData, imageObject.originLeft, imageObject.originTop);
    imageObject.origin.imageData = context.getContext(0, 0, imageObject.origin.width, imageObject.origin.height);
    
    if (imageObject.pixel.G !== undefined && imageObject.origin.pixel.G !== undefined) {
      imageObject.origin.pixel = getGrayPixelFromImageData(imageObject.origin.imageData);
    } else {
      imageObject.origin.pixel = getPixelFromImageData(imageObject.origin.imageData);
    }
  }

  return imageObject;
};

ImageObject.prototype.update = ImageObject.prototype.updateImageData;

ImageObject.prototype.paste = function(srcImageObject, left, top) {
  var imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      context = workplace.getContext('2d');
  left = left || 0;
  top = top || 0;

  workplace.width = width;
  workplace.height = height;
  context.putImageData(imageObject, 0, 0);
  context.putImageData(srcImageObject, left, top);

  imageObject.imageData = context.getImageData(0, 0, width, height);

  if (imageObject.pixel.G !== undefined && srcImageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  return imageObject;
};

ImageObject.prototype.blank = function(width, height) {
  var imageObject = new ImageObject(),
      context = workplace.getContext('2d'),
      imageData = context.createImageData(width, height);

  imageObject.width = width;
  imageObject.height = height;
  imageObject.imageData = imageData;
  imageObject.pixel = getPixelFromImageData(imageData);

  return imageObject;
};

ImageObject.prototype.grayBlank = function(width, height) {
  var imageObject = new ImageObject(),
      context = workplace.getContext('2d'),
      imageData = context.createImageData(width, height);

  imageObject.width = width;
  imageObject.height = height;
  imageObject.imageData = imageData;
  imageObject.pixel = getGrayPixelFromImageData(imageData);

  return imageObject;
};

ImageObject.prototype.load = function(left, top, width, height) {
  var imageObject = this,
      newImageObject = new ImageObject(),
      context = workplace.getContext('2d');

  workplace.width = width;
  workplace.height = height;
  context.putImageData(imageObject.imageData, -left, -top);

  newImageObject.width = width;
  newImageObject.height = height;
  newImageObject.imageData = context.getImageData(0, 0, width, height);
  newImageObject.pixel = getPixelFromImageData(newImageObject.imageData);
  newImageObject.origin = imageObject;
  newImageObject.originLeft = left;
  newImageObject.originTop = top;

  if (imageObject.pixel.G !== undefined) {
    newImageObject.pixel = getGrayPixelFromImageData(newImageObject.imageData);
  } else {
    newImageObject.pixel = getPixelFromImageData(newImageObject.imageData);
  }

  return newImageObject;
};

ImageObject.prototype.flip = function(axis) {
  var imageObject = this,
      width = imageObject.width,
      height = imageObject.height,
      context = workplace.getContext('2d'),
      imageDataContext = imageDataWorkplace.getContext('2d');

  workplace.width = width;
  workplace.height = height;
  context.translate(width / 2, height / 2);

  imageDataWorkplace.width = width;
  imageDataWorkplace.height = height;
  imageDataContext.putImageData(imageObject.imageData, 0, 0);

  if (axis === 0) {
    context.scale(-1, 1);
  } else if (axis === 1) {
    context.scale(1, -1);
  } else if (axis === 2) {
    context.scale(-1, -1);
  }

  context.drawImage(imageDataWorkplace, -width / 2, -height / 2);

  imageObject.imageData = context.getImageData(0, 0, width, height);
  if (imageObject.pixel.G !== undefined) {
    imageObject.pixel = getGrayPixelFromImageData(imageObject.imageData);
  } else {
    imageObject.pixel = getPixelFromImageData(imageObject.imageData);
  }

  return imageObject;
};

ImageObject.prototype.reverse = function() {
  var x, y,
      imageObject = this,
      width = imageObject.width,
      height = imageObject.height;

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      if (imageObject.pixel.G !== undefined) {
        imageObject.pixel.G[y][x] = 255 - imageObject.pixel.G[y][x];
      } else {
        imageObject.pixel.r[y][x] = 255 - imageObject.pixel.r[y][x];
        imageObject.pixel.g[y][x] = 255 - imageObject.pixel.g[y][x];
        imageObject.pixel.b[y][x] = 255 - imageObject.pixel.b[y][x];
      }
    }
  }

  imageObject.imageData = getImageDataFromPixel(imageObject.pixel);

  return imageObject;
};

ImageObject.prototype.rgba = function() {
  var x, y,
      imageObject = this;

  imageObject.pixel = getPixelFromImageData(imageObject.imageData);

  return imageObject;
}

})(window, document);