var IDBStore = require('idb-wrapper');

var Cache = function(settings, callback) {
	var cache = this;

	cache.settings = settings || {};
	cache.settings.name = settings.name || 'simpleCache';

	cache.store = new IDBStore({
		dbVersion: 1,
		storeName: cache.settings.name,
		keyPath: 'customerid',
		autoIncrement: false,
		onStoreReady: callback,
		indexes: [{
			name: 'lastname',
			keyPath: 'lastname',
			unique: false,
			multiEntry: false
		}]
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
