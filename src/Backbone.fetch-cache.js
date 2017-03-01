var SimpleStore = require('./SimpleStore');

// Setup
var superMethods = {
	modelFetch: Backbone.Model.prototype.fetch,
	modelSync: Backbone.Model.prototype.sync,
	collectionFetch: Backbone.Collection.prototype.fetch,
	collectionSync: Backbone.Collection.prototype.sync
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

Backbone.fetchCache = {
	isInit: false,
	enabled: false,
	maxAge: Infinity
};

function checkSettings(settings, key) {
	if (!settings || !settings[key]) {
		throw new Error("Setting missing. The FetchCache needs a setting: \"" + key + "\"");
	}
}

/**
 * TODO
 */
Backbone.fetchCache.init = function(settings, callback) {
	var cache = Backbone.fetchCache;
	cache.settings = settings || {};

	checkSettings(cache.settings, 'name');

	Backbone.fetchCache.store = new SimpleStore(cache.settings, function(store) {
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
	if (!cache.store || !cache.chechIfInit()) {
		return cache;
	}

	cache.store.purge(function() {
		cache.isInit = false;
		if (onSuccess) {
			onSuccess.call(cache);
		}
	});

	return cache;
};



/**
 * Overwrite Backbone.Model's fetch function to support caching.
 *
 * @see http://backbonejs.org/docs/backbone.html#section-81
 */
Backbone.Model.prototype.fetch = function(options) {
	// from original source
	var model = this;
	var deferred = new $.Deferred();

	// from original source
	options = _.extend({
		parse: true,
		context: options.context || model
	}, options);

	window.console.log("Options: ", JSON.stringify(options));

	//Bypass caching if it's not enabled
	if (!Backbone.fetchCache.chechIfInit() || (!Backbone.fetchCache.enabled && !options.cache)) {
		return superMethods.modelFetch.apply(this, arguments);
	}


	var dataFromCache = false;
	var orgSuccess = options.success; // from original source
	options.success = function(resp) { // from original source

		// from original source
		var serverAttrs = options.parse ? model.parse(resp, options) : resp;

		// clear the model
		model.clear({
			silent: true
		});

		// from original source
		if (!model.set(serverAttrs, options)) {
			return false;
		}

		function ready() {
			// from original source
			if (orgSuccess) {
				orgSuccess.call(options.context, model, resp, options);
			}
			// from original source
			model.trigger('sync', model, resp, options);

			deferred.resolveWith(options.context, [model]);
		}

		if (!dataFromCache) {
			var key = _.result(model, "url") + JSON.stringify(options.data || {});
			var data = {
				timestamp: new Date().getTime(),
				data: resp
			};
			Backbone.fetchCache.store.setItem(key, data, function() {
				//model.trigger('cachesync', model, resp, options);
				ready();
			});
		} else {
			ready();
		}
	};

	wrapError(this, options); // from original source

	var key = _.result(model, "url") + JSON.stringify(options.data || {});
	Backbone.fetchCache.store.getItem(key, function(resp) {

		if (resp) {
			if (!resp.timestamp) {
				throw new Error("Cache data has no timestamp");
			}
			if (!resp.data) {
				throw new Error("Cache data has no data");
			}

			// check timestamp
			var maxAge = (options.maxAge || Backbone.fetchCache.maxAge) * 1000;
			var age = Math.round(new Date().getTime() - resp.timestamp);
			if (age < maxAge) {
				// return data from cache
				dataFromCache = true;
				options.success.call(model, resp.data);
				return;
			}
		}

		// get data from server
		dataFromCache = false;

		// Delegate to the actual fetch method and store the attributes in the cache
		//var jqXHR = superMethods.modelFetch.apply(model, arguments);
		var jqXHR = superMethods.modelSync.call(model, 'read', model, options);

		// resolve the returned promise when the AJAX call completes
		jqXHR.done(_.bind(deferred.resolve, options.context, model))
			.fail(_.bind(deferred.reject, options.context, model));
		deferred.abort = jqXHR.abort;
	}, function() {
		window.console.error("error");
	});

	// return a promise which provides the same methods as a jqXHR object
	return deferred.promise();
};


/**
 * Overwrite Backbone.Collection's fetch function to support caching.
 *
 * @see http://backbonejs.org/docs/backbone.html#section-81
 */
Backbone.Collection.prototype.fetch = function(options) {
	// from original source
	var collection = this;
	var deferred = new $.Deferred();

	// from original source
	options = _.extend({
		parse: true,
		context: options.context || collection
	}, options);

	//Bypass caching if it's not enabled
	if (!Backbone.fetchCache.chechIfInit() || (!Backbone.fetchCache.enabled && !options.cache)) {
		return superMethods.collectionFetch.apply(this, arguments);
	}


	var dataFromCache = false;
	var orgSuccess = options.success; // from original source
	options.success = function(resp) { // from original source

		// from original source
		var method = options.reset ? 'reset' : 'set';
		collection[method](resp, options);

		function ready() {
			// from original source
			if (orgSuccess) {
				orgSuccess.call(options.context, collection, resp, options);
			}
			// from original source
			collection.trigger('sync', collection, resp, options);

			deferred.resolveWith(options.context, [collection]);
		}

		if (!dataFromCache) {
			var data = {
				timestamp: new Date().getTime(),
				data: resp
			};
			Backbone.fetchCache.store.setItem(_.result(collection, "url"), data, function() {
				//collection.trigger('cachesync', collection, resp, options);
				ready();
			});
		} else {
			ready();
		}
	};

	wrapError(this, options); // from original source

	Backbone.fetchCache.store.getItem(_.result(collection, "url"), function(resp) {

		if (resp) {
			if (!resp.timestamp) {
				throw new Error("Cache data has no timestamp");
			}
			if (!resp.data) {
				throw new Error("Cache data has no data");
			}

			// check timestamp
			var maxAge = (options.maxAge || Backbone.fetchCache.maxAge) * 1000;
			var age = Math.round(new Date().getTime() - resp.timestamp);
			if (age < maxAge) {
				// return data from cache
				dataFromCache = true;
				options.success.call(collection, resp.data);
				return;
			}
		}

		// get data from server
		dataFromCache = false;

		// Delegate to the actual fetch method and store the attributes in the cache
		//var jqXHR = superMethods.collectionFetch.apply(collection, arguments);
		var jqXHR = superMethods.collectionSync.call(collection, 'read', collection, options);

		// resolve the returned promise when the AJAX call completes
		jqXHR.done(_.bind(deferred.resolve, options.context, collection))
			.fail(_.bind(deferred.reject, options.context, collection));
		deferred.abort = jqXHR.abort;
	}, function() {
		window.console.error("error");
	});

	// return a promise which provides the same methods as a jqXHR object
	return deferred.promise();
};

module.exports = Backbone;
