var IDBStore = require('idb-wrapper');

/**
 * Helper function.
 * Handles onError callbacks.
 *
 * @private
 * @see https://jensarps.github.io/IDBWrapper/doc/latest/IDBStore.html#toc12
 */
function errorHandler(err) {
	throw new Error(err);
}

/**
 * Create a new IndexDb store.
 *
 * @see https://jensarps.github.io/IDBWrapper/doc/latest/IDBStore.html#IDBStore
 */
var Store = function(settings, onStoreReady) {
	var store = this;

	this.settings = settings || {};
	this.settings.name = settings.name || 'store';

	this.idb = new IDBStore({
		dbVersion: 2,
		storeName: store.settings.name,
		keyPath: 'customerid',
		autoIncrement: false,
		onStoreReady: function() {
			onStoreReady(store.idb);
		},
		indexes: [{
			name: 'key',
			keyPath: 'keyPath',
			unique: true,
			multiEntry: false
		}]
	});

	return this;
};

/**
 * Save key:value pair.
 *
 * @see https://jensarps.github.io/IDBWrapper/doc/latest/IDBStore.html#put
 */
Store.prototype.setItem = function(key, value, onSuccess, onError) {
	var store = this;
	store.idb.put(key, value, onSuccess, onError || errorHandler);
	return store;
};

/**
 * Get a value by key.
 *
 * @see https://jensarps.github.io/IDBWrapper/doc/latest/IDBStore.html#get
 */
Store.prototype.getItem = function(key, onSuccess, onError) {
	var store = this;
	store.idb.get(key, onSuccess, onError || errorHandler);
	return store;
};

/**
 * Clear and remove the database.
 *
 * @see https://jensarps.github.io/IDBWrapper/doc/latest/IDBStore.html#clear
 * @see https://jensarps.github.io/IDBWrapper/doc/latest/IDBStore.html#deleteDatabase
 */
Store.prototype.purge = function(onSuccess, onError) {
	var store = this;
	store.idb.clear(function() {
		store.idb.deleteDatabase(onSuccess, function(error) {
			window.console.warn('Browser does not support IndexedDB deleteDatabase!');
		});
	}, onError || errorHandler);
	return store;
};

module.exports = Store;
