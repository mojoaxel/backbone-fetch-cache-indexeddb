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

var log = function(msg) {
	//window.console.log("Backbone.fetchCache: ", msg, arguments[1] || '');
};

// Wrap an optional error callback with a fallback error event.
var wrapError = function(modCol, options) {
	var error = options.error;
	var context = options.context || modCol;
	options.error = function(resp) {
		if (error) {
			error.call(context, modCol, resp, options);
		}
		Backbone.fetchCache.trigger('error');
		model.trigger('error', modCol, resp, options);
	};
	return error;
};

function defaultErrorHandler(error) {
	Backbone.fetchCache.trigger('error', error);
	throw new Error("Error in Backbone.fetchCache: " + JSON.stringify(error));
}

function getUrl(modCol, options) {
	options = options || {};
	var url = _.result(modCol, "url");
	if (_.isUndefined(url) || !url.length) {
		throw new Error('A "url" property or function must be specified');
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
		window.console.warn('FetchCache is not initialized and therefore not active. Please initialize the store first by calling "Backbone.fetchcache.init"');
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

	var deferred = new $.Deferred();
	var context = options.context || this;

	var dataFromCache = false;
	var key = getUrl(modCol, options);

	// use options.error or throw new error
	var errorHandler = wrapError(this, options) || Backbone.fetchCache.onError;

	var orgSuccess = options.success; // from original source
	options.success = function(modCol, response, opts) { // from original source

		// simulate a ajax success
		deferred.resolveWith(context, [modCol]);

		function ready(data) {
			if (type === MODEL) {
				var serverAttrs = options.parse ? modCol.parse(data, options) : data;

				if (!modCol.set(serverAttrs, options)) {
					return false;
				}
			} else {
				var method = options.reset ? 'reset' : 'set';
				modCol[method](data, options);
			}

			// from original source
			if (orgSuccess) {
				orgSuccess.call(context, modCol, data, options);
			}

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
			}, errorHandler);
		} else {
			ready(response);
		}
	};

	modCol.trigger('cacherequest', modCol, options);

	Backbone.fetchCache.store.getItem(key, function(resp) {

		if (resp) {
			if (!resp.timestamp) {
				throw new Error("Cache data has no timestamp");
			}
			if (!resp.data) {
				throw new Error("Cache data has no data");
			}

			// try to get "maxAge" from options
			var maxAge = _.result(options, "maxAge");

			// if maxAge is invalid use global settings
			maxAge = _.isNumber(maxAge) ? maxAge : Backbone.fetchCache.maxAge;

			// convert seconds to milliseconds
			maxAge *= 1000;

			// get age (= difference from now) in milliseconds
			var age = Math.round(new Date().getTime() - resp.timestamp);

			Backbone.fetchCache.trigger('getitem', key, resp, maxAge);

			if (age < maxAge) {
				// return data from cache
				dataFromCache = true;
				options.success.call(modCol, modCol, resp.data);
				return;
			} else {
				Backbone.fetchCache.trigger('aged', key, resp, maxAge);
			}
		} else {
			Backbone.fetchCache.trigger('notfound', key);
		}

		// get data from server
		dataFromCache = false;

		// Delegate to the actual fetch method to get the values from the server
		var jqXHR = superMethods[type].fetch.call(modCol, options);

		// resolve the returned promise when the AJAX call completes
		jqXHR.done(_.bind(deferred.resolve, context)).fail(_.bind(deferred.reject, context));
		deferred.abort = jqXHR.abort;
	}, errorHandler);

	// return a promise which provides the same methods as a jqXHR object
	return deferred.promise();
}

Backbone.Model.prototype.fetch = fetch;
Backbone.Collection.prototype.fetch = fetch;

module.exports = Backbone;
