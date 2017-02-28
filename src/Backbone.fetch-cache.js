var SimpleStore = require('./SimpleStore');

// Setup
var superMethods = {
	modelFetch: Backbone.Model.prototype.fetch,
	modelSync: Backbone.Model.prototype.sync,
	collectionFetch: Backbone.Collection.prototype.fetch
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
	isInit: false
};

function checkSettings(settings, key) {
	if (!settings || !settings[key]) {
		throw new Error("Setting missing. The FetchCache needs a setting: \"" + key + "\"");
	}
}

function checkInit(store) {
	if (!store.isInit) {
		throw new Error('Please initialize the store first by calling "init"');
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
		callback(cache);
	});

	return cache;
};

/**
 * TODO
 */
Backbone.fetchCache.clear = function(onSuccess) {
	var cache = Backbone.fetchCache;
	if (!Backbone.fetchCache.store || !Backbone.fetchCache.isInit) {
		return cache;
	}

	cache.store.purge(function() {
		cache.isInit = false;
		if (onSuccess) {
			onSuccess();
		}
	});

	return cache;
};



/**
 * Overwrite Backbone's fetch function to support caching.
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

	//Bypass caching if it's not enabled
	if (!Backbone.fetchCache.enabled && !options.cache) {
		return superMethods.modelFetch.apply(this, arguments);
	}
	checkInit(Backbone.fetchCache);

	var dataFromCache = false;
	var orgSuccess = options.success; // from original source
	options.success = function(resp) { // from original source

		// from original source
		var serverAttrs = options.parse ? model.parse(resp, options) : resp;

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
			Backbone.fetchCache.store.setItem(_.result(model, "url"), resp, function() {
				model.trigger('cachesync', model, resp, options);
				window.console.log("setItem", JSON.stringify(resp));
				ready();
			});
		} else {
			ready();
		}
	};

	wrapError(this, options); // from original source

	Backbone.fetchCache.store.getItem(_.result(model, "url"), function(resp) {
		if (resp) {
			dataFromCache = true;
			options.success.call(model, resp);
		} else {
			window.console.log("getItem", JSON.stringify(model), JSON.stringify(options));
			//return model.sync('read', model, options);


			// Delegate to the actual fetch method and store the attributes in the cache
			var jqXHR = superMethods.modelFetch.apply(this, arguments);
			// resolve the returned promise when the AJAX call completes
			jqXHR.done(_.bind(deferred.resolve, options.context, this))
				// Set the new data in the cache
				.done(_.bind(options.success, null, this, options))
				// Reject the promise on fail
				.fail(_.bind(deferred.reject, options.context, this));

			deferred.abort = jqXHR.abort;

			// return a promise which provides the same methods as a jqXHR object
			return deferred.promise();


		}
	}, function() {
		window.console.error("error");
	});

	//return model.sync('read', model, options);
};

module.exports = Backbone;
