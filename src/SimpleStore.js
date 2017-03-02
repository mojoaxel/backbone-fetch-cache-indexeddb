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

	store.settings = settings || {};
	store.settings.name = settings.name || 'store';

	store.idb = new IDBStore({
		storeName: store.settings.name,
		keyPath: null, //important for out-of-line keys!
		autoIncrement: false,
		onError: errorHandler,
		onStoreReady: function() {
			onStoreReady(store.idb);
		}
	});

	return this;
};

/**
 * TODO
 */
Store.prototype._formatKey = function(key) {
	// no key formating by default
	return key;
};

/**
 * TODO
 */
Store.prototype._serializeData = function(data) {
	return data ? JSON.stringify(data) : null;
};

/**
 * TODO
 */
Store.prototype._deSerializeData = function(data) {
	return data ? JSON.parse(data) : null;
};

/**
 * Save key:value pair.
 *
 * @see https://jensarps.github.io/IDBWrapper/doc/latest/IDBStore.html#put
 */
Store.prototype.setItem = function(key, value, onSuccess, onError) {
	var store = this;
	store.idb.put(store._formatKey(key), store._serializeData(value), onSuccess, onError || errorHandler);
	return store;
};

/**
 * Get a value by key.
 *
 * @see https://jensarps.github.io/IDBWrapper/doc/latest/IDBStore.html#get
 */
Store.prototype.getItem = function(key, onSuccess, onError) {
	var store = this;
	store.idb.get(store._formatKey(key), function(data) {
		onSuccess(store._deSerializeData(data));
	}, onError || errorHandler);
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
	store.idb.clear(onSuccess, onError || errorHandler);
	delete store.idb;
	return store;
};

module.exports = Store;
