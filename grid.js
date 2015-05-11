/**
 * @license GridJS
 * (c) 2015 Sneezry http://gridjs.org
 * License: MIT
 */
(function(window,document,undefined) {'use strict';

var grid = window.grid = window.grid || {},
    workplace = createWorkplace();

grid.open = open;

function createWorkplace() {
    var canvas = document.createElement('canvas');
    canvas.style.display = 'none';
    document.getElementsByTagName('body')[0].appendChild(canvas);
    return canvas;
}

function getImageDataFromURL(url, callback) {
    workplace = workplace || createWorkplace();
    var context = workplace.getContext('2d');
    var image = new Image();
    image.addEventListener('load', function() {
        var width = image.width;
        var height = image.height;
        workplace.width = width;
        workplace.height = height;
        context.drawImage(image, 0, 0);
        var imageData = context.getImageData(0, 0, width, height);
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
        pixel = [];

    for(y = 0; y < height; y++) {
        pixel[y] = [];
        for(x = 0; x < width; x++) {
            index = (y * width + x) * 4;
            pixel[y][x] = {
                'r' : I[index],
                'g' : I[index+1],
                'b' : I[index+2],
                'a' : I[index+3]
            };
        }
    }

    callback(pixel);
}

function getPixelFromURL(url, callback) {
    getImageDataFromURL(url, function(imageData, width, height) {
        getPixelFromImageData(imageData, width, height, callback);
    });
}

function getPixel(image, callback) {
    if(typeof(image) === 'string') {
        getPixelFromURL(image, callback);
    } else if(Array.isArray(image) === true) {
        callback(image);
    } else if(typeof(image) === 'object') {
        getPixelFromImageData(image, callback);
    }
}

function getImageData(image, callback) {
    if(typeof(image) === 'string') {
        getImageDataFromURL(image, callback);
    } else if(Array.isArray(image) === true) {
        if(image.length ===1 || image[0].length === image[1].length) {
            getImageDataFromPixel(image, callback);
        } else {
            callback(image);
        }
    }
}

function getImageDataFromPixel(pixel, callback) {
    workplace = workplace || createWorkplace();
    var context = workplace.getContext('2d');
    var x,
        y,
        width = pixel[0].length,
        height = pixel.length,
        index,
        imageData = context.getImageData(0, 0, width, height);

    workplace.width = width;
    workplace.height = height;

    for(y = 0; y < height; y++) {
        for(x = 0; x < width; x++) {
            index = y * width + x;
            imageData.data[index] = pixel[y][x]['r'];
            imageData.data[index+1] = pixel[y][x]['g'];
            imageData.data[index+2] = pixel[y][x]['b'];
            imageData.data[index+3] = pixel[y][x]['a'];
        }
    }

    callback(imageData);
}

function open(image, callback) {
    var width,
        height;

    if(Array.isArray(image) === true) {
        width = image[0].length;
        height = image.length;
        getImageDataFromPixel(image, function(imageData) {
            callback({
                'pixel' : image,
                'imageData' : imageData,
                'height' : height,
                'width' : width
            });
        });
    } else if(typeof(image) === 'string') {
        getImageDataFromURL(image, function(imageData) {
            width = imageData.width;
            height = imageData.height;
            getPixelFromImageData(imageData, function(pixel) {
                callback({
                    'pixel' : pixel,
                    'imageData' : imageData,
                    'height' : height,
                    'width' : width
                });
            });
        });
    } else if(typeof(image) === 'object') {
        width = image.width;
        height = image.height;
        getPixelFromImageData(imageData, function(pixel) {
            callback({
                'pixel' : pixel,
                'imageData' : image,
                'height' : height,
                'width' : width
            });
        });
    }
}

})(window, document);