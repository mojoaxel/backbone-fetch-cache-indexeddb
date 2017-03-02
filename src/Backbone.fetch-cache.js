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
			error.call(options.context, model, resp, options);
		}
		model.trigger('error', model, resp, options);
	};
};

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
	enabled: false,
	maxAge: Infinity
};

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
		if (onSuccess) {
			onSuccess.call(cache);
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
	var key = getUrl(modCol, options);

	// from original source
	options = _.extend({
		parse: true
	}, options);

	options.context = options.context || this;

	//Bypass caching if it's not enabled
	if (!Backbone.fetchCache.chechIfInit() || (!Backbone.fetchCache.enabled && !options.cache)) {
		return superMethods[type].fetch.apply(this, arguments);
	}

	var deferred = new $.Deferred();
	modCol.trigger('request', modCol, deferred, options);

	var dataFromCache = false;
	var orgSuccess = options.success; // from original source

	options.success = function(resp) { // from original source

		// simulate a ajax success
		deferred.resolveWith(options.context, [modCol]);

		function ready() {
			if (type === MODEL) {
				var serverAttrs = options.parse ? modCol.parse(resp, options) : resp;
				modCol.clear({
					silent: true
				});
				if (!modCol.set(serverAttrs, options)) {
					return false;
				}
			} else {
				var method = options.reset ? 'reset' : 'set';
				modCol[method](resp, options);
			}

			// from original source
			if (orgSuccess) {
				orgSuccess.call(options.context, modCol, resp, options);
			}
			// from original source
			modCol.trigger('sync', modCol, resp, options);
		}

		if (!dataFromCache) {
			var data = {
				timestamp: new Date().getTime(),
				data: resp
			};
			Backbone.fetchCache.store.setItem(key, data, function() {
				ready();
			});
		} else {
			ready();
		}
	};

	wrapError(this, options); // from original source

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

			if (age < maxAge) {
				// return data from cache
				dataFromCache = true;
				options.success.call(modCol, resp.data);
				return;
			}
		}

		// get data from server
		dataFromCache = false;

		// Delegate to the actual fetch method and store the attributes in the cache
		var jqXHR = superMethods[type].sync.call(modCol, 'read', modCol, options);

		// resolve the returned promise when the AJAX call completes
		jqXHR.done(_.bind(deferred.resolve, options.context, modCol))
			.fail(_.bind(deferred.reject, options.context, modCol));
		deferred.abort = jqXHR.abort;
	}, function() {
		window.console.error("error");
	});

	// return a promise which provides the same methods as a jqXHR object
	return deferred.promise();
}

Backbone.Model.prototype.fetch = fetch;
Backbone.Collection.prototype.fetch = fetch;

module.exports = Backbone;
