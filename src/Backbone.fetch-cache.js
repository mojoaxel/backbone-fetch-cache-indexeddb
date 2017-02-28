var Cache = require('./SimpleCache');

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

/**
 * TODO
 */
Backbone.fetchCache = new Cache({
	name: "fetchCache"
});

/**
 * TODO
 */
Backbone.Model.prototype.fetch = function(options) {
	log("Backbone.Model.prototype.fetch: ", options);

	// Bypass caching if it's not enabled
	if (!Backbone.fetchCache.enabled && (!options || !options.cache)) {
		return superMethods.modelFetch.apply(this, arguments);
	}

	// from original code
	options = _.extend({
		parse: true
	}, options);
	var model = this;
	var deferred = new $.Deferred();
	var context = options.context || this;
	var success = options.success;

	var url = _.result(model, 'url');
	if (!url) {
		throw new Error('A "url" property or function must be specified');
	}
	var key = encodeURIComponent(url);
	log("key: ", key);

	if (Backbone.fetchCache.memCache[key]) {
		log("key found. Returning data from cache.");

		/* We found the key in the memCache. Just return it. */
		var cacheData = Backbone.fetchCache.memCache[key];
		var serverAttrs = options.parse ? model.parse(cacheData, options) : cacheData;
		if (!model.set(serverAttrs, options)) {
			return false;
		}
		if (success) {
			success.call(context, model, cacheData, options);
		}
		model.trigger('sync', model, cacheData, options);
		deferred.resolveWith(context, [model]);
	} else {
		log("No enty in the memChache found for this key. Perform a normal sync to get the data.");

		// from original code
		options.success = function(resp) {
			var serverAttrs = options.parse ? model.parse(resp, options) : resp;
			if (!model.set(serverAttrs, options)) {
				return false;
			}

			Backbone.fetchCache.memCache[key] = resp;
			log("added data to memCache for key: ", key);

			if (success) {
				success.call(options.context, model, resp, options);
			}
			model.trigger('sync', model, resp, options);
		};

		// from original code
		wrapError(this, options);
		return this.sync('read', this, options);
	}
};

module.exports = Backbone;
