var localforage = require('localforage');

var Cache = function(settings) {
	var cache = this;

	cache.settings = settings || {};
	cache.settings.name = settings.name || 'simpleCache';

	cache.localforage = localforage.createInstance({
		name: cache.settings.name
	});

	return cache;
};

/**
 * TODO
 */
Cache.prototype.setItem = function(key, data) {
	return true;
};

/**
 * TODO
 */
Cache.prototype.getItem = function(key) {
	return true;
};

module.exports = Cache;
