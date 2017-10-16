# backbone-fetch-cache-indexeddb

This is a plugin for [Backbone.js](http://backbonejs.org/). <br>
It also works with Backbone-based frameworks like [Marionette](http://marionettejs.com/).

It overwrites the *fetch* Method of Backbone.Model and Backbone.Collection and cachees all fetched data in the browsers [IndexedDB](https://www.w3.org/TR/IndexedDB/).

This can reduces unesseccary API calls significantly!

## Status

[![NPM](https://nodei.co/npm/backbone-fetch-cache-indexeddb.png?downloads=true&downloadRank=true)](https://nodei.co/npm/backbone-fetch-cache-indexeddb/)

[![Build Status](https://travis-ci.org/mojoaxel/backbone-fetch-cache-indexeddb.svg?branch=master)](https://travis-ci.org/mojoaxel/backbone-fetch-cache-indexeddb)
[![Dependency Status](https://david-dm.org/mojoaxel/backbone-fetch-cache-indexeddb/status.svg)](https://david-dm.org/mojoaxel/backbone-fetch-cache-indexeddb)
[![devDependency Status](https://david-dm.org/mojoaxel/backbone-fetch-cache-indexeddb/dev-status.svg)](https://david-dm.org/mojoaxel/backbone-fetch-cache-indexeddb?type=dev)

[![GitHub issues](https://img.shields.io/github/issues/mojoaxel/backbone-fetch-cache-indexeddb.svg)](https://github.com/mojoaxel/backbone-fetch-cache-indexeddb/issues)
[![Percentage of issues still open](http://isitmaintained.com/badge/open/mojoaxel/backbone-fetch-cache-indexeddb.svg)](http://isitmaintained.com/project/mojoaxel/backbone-fetch-cache-indexeddb "Percentage of issues still open")
[![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/mojoaxel/backbone-fetch-cache-indexeddb.svg)](http://isitmaintained.com/project/mojoaxel/backbone-fetch-cache-indexeddb "Average time to resolve an issue")

## Installation

`npm install --save backbone-fetch-cache-indexeddb`

## Initialization

Just insert the script after Backbone.

```html
<script src="backbone.min.js"></script>
<script src="dist/backbone.fetch-cache.indexeddb.min.js"></script>
```

First the IndexedDb needs to be initialized. This is only neccessare once e.g. after loading your Application:

```js
Backbone.fetchcache.init({
	name: "MyApplicationCache",
	enabled: false,
	maxAge: Infinity
})
```
### Options

#### name
_**REQUIRED**_

The Name of your IndexedDB Store. This should be unique to your application.

#### enabled
_OPTIONAL_

Enable the cache by default for all requests. This can be overwritten by setting `cache:false` or `cache:true` on the inidividual `fetch` call. <br>
[Default: `false`]

#### maxAge
_OPTIONAL_

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

// 3. force a refresh from server
model.fetch({
  // Enable chaching for this request
  cache: true,
  // force a refresh from server
  maxAge: -1
})
```

## Events

`Backbone.fetchcache` extends [Backbone.Events](http://backbonejs.org/#Events) and provides the following events.<br>
These events are mainly for logging or debugging puropses:

* `getitem`: An item was read from the cache. Callback parameters: `key`, `data`, `maxAge`.
* `setitem`: An item was saved to the cache. Callback parameters: `key`, `data`.
* `aged`: An item was found but is is too old to be valid. Callback parameters: `key`, `data`, `maxAge`.
* `notfound`: This is event is fired, when the requested item does not exist in the cache. Callback parameters: `key`.
* `clear`: The cache was cleared. Callback parameters: none.

In addition to the [original events](http://backbonejs.org/#Events-catalog) (e.g. `sync`, `error` ...) the following events get triggered at the model or collection:

* `cacherequest`: Like the original `request` event this is fired, when a request (getItem) to the cache has started. This is usefull e.g. to show a loading-view.

## Development

You should never manually change files in the `dist` folder. They are generated.

After changing the sources in the `src` folder you can run `npm run test` to build an test your cahnges.

During development you can start the tests in your local browser with `npm run watch`. This will also watch for changes in the tests or the sources.

## References

* This software is heavily inspired by [backbone-fetch-cache](https://github.com/madglory/backbone-fetch-cache).
* This software uses the [idb-wrapper](https://www.npmjs.com/package/idb-wrapper) to ensure cross-browser support.

## License

Licensed under the [MIT license](LICENSE) 2017 by Alexander Wunschik and contributors.
