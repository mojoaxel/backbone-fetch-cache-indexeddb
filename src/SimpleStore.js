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
		storeName: store.settings.name,
		keyPath: null, //important for out-of-line keys!
		autoIncrement: false,
		onStoreReady: function() {
			onStoreReady(store.idb);
		}
	});

	return this;
};

/**
 * TODO
 */
Store.prototype.formatKey = function(key) {
	return encodeURIComponent(key);
};

/**
 * Save key:value pair.
 *
 * @see https://jensarps.github.io/IDBWrapper/doc/latest/IDBStore.html#put
 */
Store.prototype.setItem = function(key, value, onSuccess, onError) {
	var store = this;
	store.idb.put(store.formatKey(key), value, onSuccess, onError || errorHandler);
	return store;
};

/**
 * Get a value by key.
 *
 * @see https://jensarps.github.io/IDBWrapper/doc/latest/IDBStore.html#get
 */
Store.prototype.getItem = function(key, onSuccess, onError) {
	var store = this;
	store.idb.get(store.formatKey(key), onSuccess, onError || errorHandler);
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
			onSuccess.call(this);
		});
	}, onError || errorHandler);
	return store;
};

module.exports = Store;
