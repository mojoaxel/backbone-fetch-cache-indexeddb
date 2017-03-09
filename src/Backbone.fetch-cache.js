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
	window.console.log("Backbone.fetchCache: ", msg, arguments[1] || '');
};

// Wrap an optional error callback with a fallback error event.
var wrapError = function(model, options) {
	var error = options.error;
	options.error = function(resp) {
		if (error) {
			error.call(context, model, resp, options);
		}
		model.trigger('error', model, resp, options);
	};
};

function genUrl(modCol, options) {
	var url = _.result(modCol, "url");
	if (!url || !url.length) {
		throw new Error('A "url" property or function must be specified to serve as cache key');
	}
	return url + (options.data ? '?' + $.param(options.data) : '');
}

Backbone.fetchCache = {
	isInit: false,
	enabled: false,
	maxAge: Infinity
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
	var cache = Backbone.fetchCache;
	cache = handleSettings(cache, settings);

	Backbone.fetchCache.store = new SimpleStore({
		name: cache.name
	}, function() {
		cache.isInit = true;
		if (callback) {
			callback(cache);
		}
	});

	return cache;
};

/**
 * TODO
 */
Backbone.fetchCache.chechIfInit = function() {
	var cache = Backbone.fetchCache;
	if (!cache.isInit) {
		window.console.warn('FetchCache is not initialized and therefore not active. Please initialize the store first by calling "Backbone.fetchcache.init"');
	}
	return cache.isInit;
};

/**
 * TODO
 */
Backbone.fetchCache.clear = function(onSuccess) {
	var cache = Backbone.fetchCache;
	if (!cache.chechIfInit()) {
		return cache;
	}

	cache.store.purge(function() {
		cache.isInit = false;
		delete cache.store;
		log("CLEAR successfull");
		Backbone.fetchCache.trigger('clear', cache);
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

	// from original source
	var modCol = this;
	var deferred = new $.Deferred();

	// from original source
	options = _.extend({
		parse: true
	}, options);

	var context = options.context || this;

	//Bypass caching if it's not enabled
	if ((_.isBoolean(options.cache) && options.cache === false) ||
		(Backbone.fetchCache.enabled === false && _.isUndefined(options.cache)) ||
		(!Backbone.fetchCache.chechIfInit())) {
		// Delegate to the actual fetch method to get the values from the server
		return superMethods[type].fetch.call(modCol, options);
	}

	var dataFromCache = false;
	var key = genUrl(modCol, options);
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
		}

		if (!dataFromCache) {
			var data = {
				timestamp: new Date().getTime(),
				data: response
			};
			Backbone.fetchCache.store.setItem(key, data, function() {
				Backbone.fetchCache.trigger('setitem', key, data);
				ready(data.data);
			});
		} else {
			ready(response);

			// from original source
			modCol.trigger('sync', modCol, response, options);
		}
	};

	wrapError(this, options); // from original source

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
	}, function(error) {
		throw new Error("could not getItem. ", error);
	});

	// return a promise which provides the same methods as a jqXHR object
	return deferred.promise();
}

Backbone.Model.prototype.fetch = fetch;
Backbone.Collection.prototype.fetch = fetch;

module.exports = Backbone;
