# GridJS

GridJS is a JavaScript imaging library for web programming.

* Web site: <http://gridjs.org>
* API Docs: <http://gridjs.org/docs/API.html>

# HOW TO USE

Add GridJS to your page

```
<script src="gridjs.js"></script>
```

Then open an image from URL

```
gridjs.open(url, function(im) {
  ...
});
```

You may process `im` with methods in [API Docs](http://gridjs.org/docs/API.html). For example, convert `im` to grayscale

```
im.grayscale();
```

or resize `im` to new size

```
im.resize(100, 100);
```

or resize `im` then covert to grayscale

```
im.resize(100, 100).grayscale();
```

If you'd like to show `im`, create a canvas element

```
var canvas = document.create('canvas');
document.getElementsByTagName('body')[0].appendChild(canvas);
```

then call `show` method

```
im.show(canvas);
```

or just

```
im.resize(100, 100).grayscale().show(canvas);
```

Most methods modify origin data(except `copy` and `load`), so you may write code like this

```
im.resize(100, 100);
im.grayscale();
im.show(canvas);
```

# LICENSE

Code licensed under [The MIT License](https://github.com/gridjs/gridjs/blob/master/LICENSE). Documentation licensed under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/).