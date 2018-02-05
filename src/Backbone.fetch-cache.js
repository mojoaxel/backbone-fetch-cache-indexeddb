var SimpleStore = require('./SimpleStore');

// Setup
var superMethods = {
	model: {
		fetch: Backbone.Model.prototype.fetch,
		sync: Backbone.Model.prototype.sync
	},
	collection: {
		fetch: Backbone.Collection.prototype.fetch,
		sync: Backbone.Collection.prototype.sync
	}
};

var log = function(level, msg) {
	if (level === "WARN") {
		window.console.warn("Backbone.fetchCache: ", msg, arguments[1] || '');
	} else {
		//window.console.log("Backbone.fetchCache: ", msg, arguments[1] || '');
	}
};

// Wrap an optional error callback with a fallback error event.
var wrapError = function(modCol, options) {
	options = options || {};
	var error = options.error;
	var context = options.context || modCol;
	options.error = function(modCol, resp, options) {
		if (error) {
			error.call(context, modCol, resp, options);
		}
		Backbone.fetchCache.trigger('error', resp);
		modCol.trigger('error', modCol, resp, options);
	};
	return error;
};

function defaultErrorHandler(error) {
	Backbone.fetchCache.trigger('error', error);
	/*
	var errorMsg = error.description;
	errorMsg = errorMsg || error.target.error.name;
	errorMsg = errorMsg || JSON.stringify(error);
	throw new Error("Error in Backbone.fetchCache: " + errorMsg);
	*/
}

function getUrl(modCol, options) {
	options = options || {};
	var url = _.result(modCol, "url");
	if (_.isUndefined(url) || !url.length) {
		window.console.warn(JSON.stringify(modCol));
		throw new Error('The model/collection is missing the "url" property or function');
	}
	return url + (options.data ? '?' + $.param(options.data) : '');
}

Backbone.fetchCache = {
	isInit: false,

	// if true all model and all collections get cached
	enabled: false,

	// set this to <= 0 to force a invalidation of the cache
	maxAge: Infinity,

	// if you overwrite this no "error" events get triggered
	onError: defaultErrorHandler
};

// @see http://backbonejs.org/#Events
_.extend(Backbone.fetchCache, Backbone.Events);

function handleSettings(cache, settings) {
	settings = settings || {};

	if (_.isUndefined(settings.name) || _.isNull(settings.name)) {
		throw new Error('Setting missing. The FetchCache needs a "name"');
	} else if (!_.isString(settings.name) || settings.name.trim().length <= 0) {
		throw new Error('The "name" parameter must be a valid String');
	} else {
		cache.name = settings.name;
	}

	if (_.isBoolean(settings.enabled)) {
		cache.enabled = settings.enabled;
	}

	if (_.isFinite(settings.maxAge)) {
		cache.maxAge = settings.maxAge;
	}

	return cache;
}

/**
 * TODO
 */
Backbone.fetchCache.init = function(settings, callback) {
	log("Backbone.fetchCache.init: ", settings);
	var cache = Backbone.fetchCache;
	cache = handleSettings(cache, settings);

	Backbone.fetchCache.store = new SimpleStore({
		name: cache.name
	}, function() {
		cache.isInit = true;
		if (callback) {
			callback(cache);
		}
	}, cache.onError);

	return cache;
};

/**
 * TODO
 */
Backbone.fetchCache.checkIfInit = function() {
	var cache = Backbone.fetchCache;
	log("Backbone.fetchCache.checkIfInit: ", cache.isInit);
	if (!cache.isInit) {
		window.console.warn("FetchCache is not initialized and therefore not active. " +
			"Please initialize the store first by calling \"Backbone.fetchcache.init\"");
	}
	return cache.isInit;
};

/**
 * TODO
 */
Backbone.fetchCache.clear = function(onSuccess) {
	log("Backbone.fetchCache.clear");
	var cache = Backbone.fetchCache;
	if (!cache.checkIfInit()) {
		return cache;
	}

	cache.store.clear(function() {
		log("CLEAR successfull");
		cache.trigger('clear', cache);
		if (onSuccess) {
			onSuccess(cache);
		}
	});

	return cache;
};

/**
 * TODO
 */
Backbone.fetchCache.purge = function(onSuccess) {
	log("Backbone.fetchCache.purge");
	var cache = Backbone.fetchCache;
	if (!cache.isInit) {
		if (onSuccess) {
			onSuccess(cache);
		}
		return cache;
	}

	cache.store.purge(function() {
		cache.isInit = false;
		delete cache.store;
		log("PURGE successfull");
		cache.trigger('clear', cache);
		cache.stopListening();
		if (onSuccess) {
			onSuccess(cache);
		}
	});

	return cache;
};


/**
 * Overwrite Backbones fetch function to support caching.
 * This works on both Models and Collections.
 *
 * @see http://backbonejs.org/docs/backbone.html#section-81
 */
function fetch(options) {
	var MODEL = "model";
	var COLLECTION = "collection";
	var type = (this instanceof Backbone.Model) ? MODEL : COLLECTION;

	var modCol = this;

	// from original source
	options = _.extend({
		parse: true
	}, options);

	//Bypass caching if it's not enabled
	if ((_.isBoolean(options.cache) && options.cache === false) ||
		(Backbone.fetchCache.enabled === false && _.isUndefined(options.cache)) ||
		(!Backbone.fetchCache.checkIfInit())) {
		// Delegate to the actual fetch method to get the values from the server
		return superMethods[type].fetch.call(modCol, options);
	}

	var context = options.context || this;

	var deferred = new $.Deferred();
	var promise = deferred.promise();

	/* simulate the normal jqXHR.abort function.
	 * This gets overwritten by the actual abort function. */
	promise.abort = _.bind(deferred.reject, context);

	var dataFromCache = false;
	var key = getUrl(modCol, options);

	// use options.error or throw new error
	var errorHandler = wrapError(this, options) || Backbone.fetchCache.onError;

	var orgSuccess = options.success; // from original source
	options.success = function(modCol, response, opts) { // from original source

		function ready(data) {
			var parsedData = options.parse ? modCol.parse(data, options) : data;
			options.parse = false;

			// set data at the Model/Collection
			if (type === MODEL) {
				if (!modCol.set(parsedData, options)) {
					return false;
				}
			} else {
				var method = options.reset ? 'reset' : 'set';
				modCol[method](parsedData, options);
			}

			// Success callback with the parsed data; from original source
			if (orgSuccess) {
				orgSuccess.call(context, modCol, parsedData, options);
			}

			// Trigger `sync` event with the original response-data; from original source
			modCol.trigger('sync', modCol, response, options);
		}

		if (!dataFromCache) {
			var data = {
				timestamp: new Date().getTime(),
				data: response
			};
			Backbone.fetchCache.store.setItem(key, data, function() {
				Backbone.fetchCache.trigger('setitem', key, data);
				ready(data.data);
			}, function(error) {
				errorHandler(error);
				ready(data.data);
			});
		} else {
			ready(response);
		}
	};

	modCol.trigger('cacherequest', modCol, options);

	function doXHR() {
		// get data from server
		dataFromCache = false;

		// Delegate to the actual fetch method to get the values from the server
		var jqXHR = superMethods[type].fetch.call(modCol, options);

		// extend the promise with the actual abort function
		promise.abort = jqXHR.abort;

		// update status information to the promise object
		promise = _.extend(promise, _.pick(jqXHR, function(value, key, object) {
			return !_.isFunction(value);
		}));

		// resolve the returned promise when the AJAX call completes
		jqXHR.then(
			_.bind(deferred.resolve, context),
			_.bind(deferred.reject, context),
			function(data, status, jqXHR) {
				promise = _.extend(promise, _.pick(jqXHR, function(value, key, object) {
					return !_.isFunction(value);
				}));
			}
		);
	}

	Backbone.fetchCache.store.getItem(key, function(resp) {
		if (resp) {
			if (!resp.timestamp) {
				throw new Error("Cache data has no timestamp");
			}

			// try to get "maxAge" from options
			var maxAge = _.result(options, "maxAge");

			// if maxAge is invalid use global settings
			maxAge = _.isNumber(maxAge) ? maxAge : Backbone.fetchCache.maxAge;

			// convert seconds to milliseconds
			maxAge *= 1000;

			// get age (= difference from now) in milliseconds
			var age = Math.round(new Date().getTime() - resp.timestamp);

			// trigger event that 'getItem' was successfull
			Backbone.fetchCache.trigger('getitem', key, resp, maxAge);

			// check if data is outdated
			if (age < maxAge) {
				// return data from cache
				dataFromCache = true;
				options.success.call(modCol, modCol, resp.data);
				return;
			} else {
				Backbone.fetchCache.trigger('aged', key, resp, maxAge);
				doXHR();
			}
		} else {
			Backbone.fetchCache.trigger('notfound', key);
			doXHR();
		}
	}, function(error) {
		log('WARN', "CACHE error while reading from indexeddb. " +
			"Falling back to ajax request");
		doXHR();
	});

	// return a promise which provides the same methods as a jqXHR object
	return promise;
}

Backbone.Model.prototype.fetch = fetch;
Backbone.Collection.prototype.fetch = fetch;

module.exports = Backbone;
