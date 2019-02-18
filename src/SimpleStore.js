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
 * TODO
 */
function formatKey(key) {
	// no key formating by default
	return key;
}

/**
 * TODO
 */
function serializeData(data) {
	return data ? JSON.stringify(data) : null;
}

/**
 * TODO
 */
function deserializeData(data) {
	return data ? JSON.parse(data) : null;
}

/**
 * Create a new IndexDb store.
 *
 * @see https://jensarps.github.io/IDBWrapper/doc/latest/IDBStore.html#IDBStore
 */
var Store = function(settings, onStoreReady, onError) {
	var store = this;

	store.settings = settings || {};
	store.settings.name = settings.name || 'store';

	store.idb = new IDBStore({
		storeName: store.settings.name,
		keyPath: null, //important for out-of-line keys!
		autoIncrement: false,
		onError: onError || errorHandler,
		onStoreReady: function() {
			onStoreReady(store.idb);
		}
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
	try {
		store.idb.put(formatKey(key), serializeData(value), onSuccess, onError || errorHandler);
	} catch (e) {
		var handler = onError || errorHandler;
		handler(e);
	}
	return store;
};

/**
 * Get a value by key.
 *
 * @see https://jensarps.github.io/IDBWrapper/doc/latest/IDBStore.html#get
 */
Store.prototype.getItem = function(key, onSuccess, onError) {
	var store = this;
	try {
		store.idb.get(formatKey(key), function(data) {
			onSuccess(deserializeData(data));
		}, onError || errorHandler);
	} catch (e) {
		var handler = onError || errorHandler;
		handler(e);
	}
	return store;
};

/**
 * Remove a value by key.
 *
 * @see https://jensarps.github.io/IDBWrapper/doc/latest/IDBStore.html#remove
 */
Store.prototype.removeItem = function(key, onSuccess, onError) {
	var store = this;
	try {
		store.idb.remove(formatKey(key), function() {
			onSuccess();
		}, onError || errorHandler);
	} catch (e) {
		var handler = onError || errorHandler;
		handler(e);
	}
	return store;
};

/**
 * Clear the database.
 *
 * @see https://jensarps.github.io/IDBWrapper/doc/latest/IDBStore.html#clear
 */
Store.prototype.clear = function(onSuccess, onError) {
	var store = this;
	try {
		store.idb.clear(onSuccess, onError || errorHandler);
	} catch (e) {
		var handler = onError || errorHandler;
		handler(e);
	}
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
	try {
		store.idb.clear(function() {
			store.idb.deleteDatabase();
			delete store.idb;
			if (onSuccess) {
				onSuccess();
			}
		}, onError || errorHandler);
	} catch (e) {
		var handler = onError || errorHandler;
		handler(e);
	}
	return store;
};

module.exports = Store;
