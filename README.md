# backbone-fetch-cache-indexeddb

This is a plugin for [Backbone.js](http://backbonejs.org/). <br>
It also works with Backbone-based frameworks like [Marionette](http://marionettejs.com/).

It overwrite the fetch Method of Backbone.Model and Backbone.Collection to cache all fetched Data in the browsers [IndexedDB](https://www.w3.org/TR/IndexedDB/).

## Initialization

Just insert the script after Backbone.

```html
<script src="backbone.min.js"></script>
<script src="dist/backbone.fetch-cache.indexeddb.min.js"></script>
```

First the IndexedDb needs to be initialized. This is only neccessare once e.g. after loading your Application:

```js
Backbone.fetchcache.init({
	name: "MyApplicationCache", /// REQUIRED!
	enabled: false,
	maxAge: Infinity
})
```

### name
REQUIRED!<br>
The Name of your IndexedDB Store. This should be unique to your application.

### enabled
Enable the cache by default for all requests. This can be overwritten by setting `cache:false` or `cache:true` on the inidividual `fetch` call. <br>
[Default: `false`]

### maxAge
Default max age in seconds. This can be overwritten by setting `maxAge` on the inidividual `fetch` call. <br>
[Default: `Infinity`]

## Usage

```js
MockyModel = Backbone.Model.extend({
  url: 'http://www.mocky.io/v2/5185415ba171ea3a00704eed'
});

var model = new MockyModel();

// 1. download data from server
model.fetch({
  // Cache this request.
  cache: true
});

// 2. request the data again: it is loaded instantly from cache.
model.fetch({
  // Check is the data is availible in the cache.
  cache: true,
  // Cache expires in seconds. Here one hour.
  maxAge: 60*60
})
```

## References

* This software is heavily inspired by [backbone-fetch-cache](https://github.com/madglory/backbone-fetch-cache).
* The AMD wrapper is based on [amdWebGlobal.js](https://github.com/umdjs/umd/blob/master/templates/amdWebGlobal.js).
* This Software was developed for [Siemens Healthcare](https://www.healthcare.siemens.de/).

## MIT License

Copyright 2017 by Alexander Wunschik and contributors.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software withoutrestriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
