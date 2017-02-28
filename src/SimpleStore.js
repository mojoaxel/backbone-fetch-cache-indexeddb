var IDBStore = require('idb-wrapper');

function errorHandler(err) {
	throw new Error(err);
}

var Store = function(settings, callback) {
	var store = this;

	store.settings = settings || {};
	store.settings.name = settings.name || 'store';

	store.store = new IDBStore({
		dbVersion: 1,
		storeName: store.settings.name,
		keyPath: 'customerid',
		autoIncrement: false,
		onStoreReady: function() {
			callback(store.store);
		},
		indexes: [{
			name: 'lastname',
			keyPath: 'lastname',
			unique: false,
			multiEntry: false
		}]
	});

	return store;
};

/**
 * TODO
 */
Store.prototype.setItem = function(key, data, callback) {
	var store = this;

	//TODO

	return store;
};

/**
 * TODO
 */
Store.prototype.getItem = function(key, callback) {
	var store = this;

	//TODO

	return store;
};

/**
 * TODO
 */
Store.prototype.purge = function(callback) {
	var store = this;

	store.store.clear(function() {
		store.store.deleteDatabase(callback, errorHandler);
	}, errorHandler);

	return store;
};

module.exports = Store;
