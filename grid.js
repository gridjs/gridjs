/**
 * @license GridJS
 * (c) 2015 Sneezry http://gridjs.org
 * License: MIT
 */
(function(window,document,undefined) {'use strict';

var grid = window.grid = window.grid || {},
    workplace = createWorkplace();

grid.open               = open;
grid.getGrayScale       = getGrayScale;
grid.putImage           = putImage;
grid.blend              = blend;

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

function getPixelFromImageData(imageData, callback) {
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

    callback(pixel);
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
        imageData = context.getImageData(0, 0, width, height);

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
        imageData;

    if (Array.isArray(image.r) === true) {
        width = image[0].length;
        height = image.length;
        imageData = getImageDataFromPixel(image);
        callback({
            'pixel'     : image,
            'imageData' : imageData,
            'height'    : height,
            'width'     : width
        });
    } else if (typeof(image) === 'string') {
        getImageDataFromURL(image, function(imageData) {
            width = imageData.width;
            height = imageData.height;
            getPixelFromImageData(imageData, function(pixel) {
                callback({
                    'pixel'     : pixel,
                    'imageData' : imageData,
                    'height'    : height,
                    'width'     : width
                });
            });
        });
    } else if (typeof(image) === 'object') {
        width = image.width;
        height = image.height;
        getPixelFromImageData(image, function(pixel) {
            callback({
                'pixel'     : pixel,
                'imageData' : image,
                'height'    : height,
                'width'     : width
            });
        });
    }
}

function getGrayScale(imageObject) {
    var x,
        y,
        gray,
        width = imageObject.width,
        height = imageObject.height,
        grayImageObject = {},
        pixel = {
            'r' : [],
            'g' : [],
            'b' : [],
            'a' : []
        };

    grayImageObject.width = width;
    grayImageObject.height = height;
    
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
    return grayImageObject;
}

function putImage(canvas, imageObject) {
    var context;

    canvas.width = imageObject.width;
    canvas.height = imageObject.height;
    context = canvas.getContext('2d');

    context.putImageData(imageObject.imageData, 0, 0);
}

/*
 * outImageObject has the same size as dstImageObject
 */
function blend(srcImageObject, dstImageObject, offsetX, offsetY) {
    var x,
        y,
        width = dstImageObject.width,
        height = dstImageObject.height,
        srcWidth = srcImageObject.width,
        srcHeight = srcImageObject.height,
        pixel = {
            'r' : [],
            'g' : [],
            'b' : [],
            'a' : []
        },
        outImageObject = {
            'width' : width,
            'height' : height
        };

    offsetX = isNaN(offsetX) ? 0 : offsetX;
    offsetY = isNaN(offsetY) ? 0 : offsetY;

    for (y = 0; y < height; y++) {
        pixel.r[y] = [];
        pixel.g[y] = [];
        pixel.b[y] = [];
        pixel.a[y] = [];
        for (x = 0; x < width; x++) {
            pixel.a[y][x] = (y - offsetY < 0 || x - offsetX < 0 ||
                        y - offsetY >= srcHeight || x - offsetX >= srcWidth) ?
                    dstImageObject.pixel.a[y][x] :
                    (srcImageObject.pixel.a[y - offsetY][x - offsetX] +
                        dstImageObject.pixel.a[y][x] *
                        (1 - srcImageObject.pixel.a[y - offsetY][x - offsetX]));

            pixel.r[y][x] = (y - offsetY < 0 || x - offsetX < 0 ||
                        y - offsetY >= srcHeight || x - offsetX >= srcWidth || pixel.a[y][x] < 0.003) ?
                    dstImageObject.pixel.r[y][x] :
                    (srcImageObject.pixel.r[y - offsetY][x - offsetX] * srcImageObject.pixel.a[y - offsetY][x - offsetX] +
                        dstImageObject.pixel.r[y][x] * dstImageObject.pixel.a[y][x] *
                        (1 - srcImageObject.pixel.a[y - offsetY][x - offsetX])) / 
                        pixel.a[y][x];

            pixel.g[y][x] = (y - offsetY < 0 || x - offsetX < 0 ||
                        y - offsetY >= srcHeight || x - offsetX >= srcWidth || pixel.a[y][x] < 0.003) ?
                    dstImageObject.pixel.g[y][x] :
                    (srcImageObject.pixel.g[y - offsetY][x - offsetX] * srcImageObject.pixel.a[y - offsetY][x - offsetX] +
                        dstImageObject.pixel.g[y][x] * dstImageObject.pixel.a[y][x] *
                        (1 - srcImageObject.pixel.a[y - offsetY][x - offsetX])) / 
                        pixel.a[y][x];

            pixel.b[y][x] = (y - offsetY < 0 || x - offsetX < 0 ||
                        y - offsetY >= srcHeight || x - offsetX >= srcWidth || pixel.a[y][x] < 0.003) ?
                    dstImageObject.pixel.b[y][x] :
                    (srcImageObject.pixel.b[y - offsetY][x - offsetX] * srcImageObject.pixel.a[y - offsetY][x - offsetX] +
                        dstImageObject.pixel.b[y][x] * dstImageObject.pixel.a[y][x] *
                        (1 - srcImageObject.pixel.a[y - offsetY][x - offsetX])) / 
                        pixel.a[y][x];

            pixel.r[y][x] = Math.round(pixel.r[y][x]);
            pixel.g[y][x] = Math.round(pixel.g[y][x]);
            pixel.b[y][x] = Math.round(pixel.b[y][x]);

            if (pixel.a[y][x] < 0.003) {
                pixel.a[y][x] = dstImageObject.pixel.a[y][x];
            }
        }
    }

    outImageObject.pixel = pixel;
    outImageObject.imageData = getImageDataFromPixel(pixel);

    return outImageObject;
}

})(window, document);