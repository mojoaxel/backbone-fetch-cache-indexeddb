/**
 * @see https://github.com/mojoaxel/backbone-fetch-cache-indexeddb
 * @copyright 2017 by Alexander Wunschik <mail@wunschik.it>
 * @license MIT
 */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['underscore', 'backbone', 'jquery'], function (_, Backbone, $) {
			return (root.Backbone = factory(_, Backbone, $));
		});
	} else if (typeof exports !== 'undefined' && typeof require !== 'undefined') {
		module.exports = factory(
			require('underscore'), require('backbone'), require('jquery')
		);
	} else {
		root.Backbone = factory(root._, root.Backbone, root.jQuery);
	}
}(this, function (_, Backbone, $) {

	Backbone.fetchCache = (Backbone.memCache || {
		/*
		 * Enable the fetchCache by default.
		 * This can be overwritten by each request setting the "cahce" option in the fetch call.
		 */
		enabled: true
	});

	Backbone.fetchCache.memCache = (Backbone.fetchCache.memCache || {});


	// Setup
	var superMethods = {
		modelFetch: Backbone.Model.prototype.fetch,
		modelSync: Backbone.Model.prototype.sync,
		collectionFetch: Backbone.Collection.prototype.fetch
	};

	//Use only during development. This enables very verbouse console output.
	var log = function(msg) {
		console.log("Backbone.fetchCache: ", msg, arguments[1] || '');
	}

	// Throw an error when a URL is needed, and none is supplied.
	var urlError = function() {
		throw new Error('A "url" property or function must be specified');
	};

	// Wrap an optional error callback with a fallback error event.
	var wrapError = function(model, options) {
		var error = options.error;
		options.error = function(resp) {
			if (error) error.call(options.context, model, resp, options);
			model.trigger('error', model, resp, options);
		};
	};

	/**
	 * TODO
	 */
	Backbone.fetchCache.reset = function(callback) {
		log("reset !!!");
		// delete memCache
		delete Backbone.fetchCache.memCache;
		Backbone.fetchCache.memCache = {};

		callback && callback();
	}

	/**
	 * TODO
	 */
	Backbone.Model.prototype.fetch	= function(options) {
		log("Backbone.Model.prototype.fetch: ", options);

		//Bypass caching if it's not enabled
    if(!Backbone.fetchCache.enabled && (!options || !options.cache)) {
      return superMethods.modelFetch.apply(this, arguments);
    }

		// from original code
		options = _.extend({parse: true}, options);
		var model = this;
		var deferred = new $.Deferred();
		var context = options.context || this;

		var url = _.result(model, 'url') || urlError();
		var key = encodeURIComponent(url);
		log("key: ", key);

		if (Backbone.fetchCache.memCache[key]) {
			log("key found. Returning data from cache.");

			/* We found the key in the memCache. Just return it. */
			var cacheData = Backbone.fetchCache.memCache[key];
			var serverAttrs = options.parse ? model.parse(cacheData, options) : cacheData;
			if (!model.set(serverAttrs, options)) return false;
			var success = options.success;
			if (success) success.call(context, model, cacheData, options);
			model.trigger('sync', model, cacheData, options);
			deferred.resolveWith(context, [model]);
		} else {
			log("No enty in the memChache found for this key. Perform a normal sync to get the data.");

			// from original code
			var success = options.success;
			options.success = function(resp) {
				var serverAttrs = options.parse ? model.parse(resp, options) : resp;
				if (!model.set(serverAttrs, options)) return false;

				Backbone.fetchCache.memCache[key] = resp;
				log("added data to memCache for key: ", key);

				if (success) success.call(options.context, model, resp, options);
				model.trigger('sync', model, resp, options);
			};

			// from original code
			wrapError(this, options);
			return this.sync('read', this, options);
		}
	};


	//Backbone.Collection.prototype.fetch = function() {}; //TODO

	return Backbone;
}));
