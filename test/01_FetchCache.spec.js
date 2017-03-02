describe('Backbone.fetchCache', function() {
	var testSettings = {
		name: "testStore"
	};

	var modelResponse = {
		"foo": "bar"
	};
	var newModelResponse = {
		"hip": "hop"
	};

	var model = new Backbone.Model();
	model.url = '/dummy/model-cache-test';

	/*
	describe('TestServer', function() {
		it('is running', function(done) {
			$.get('/dummy/', function(data) {
				expect(data.toLowerCase().indexOf('running') >= 0).toBe(true);
				done();
			});
		});
	});
	*/

	describe('IDBStore', function() {
		it('exposes IDBStore', function() {
			var store = Backbone.fetchCache.store;
			expect(typeof(store)).not.toBeUndefined();
		});

		it('exposes all IDBStore functions', function(done) {
			var cache = new Backbone.fetchCache.init(testSettings, function(cache) {
				var store = cache.store.idb;
				expect(typeof(store.batch)).toBe("function");
				expect(typeof(store.clear)).toBe("function");
				expect(typeof(store.count)).toBe("function");
				expect(typeof(store.deleteDatabase)).toBe("function");
				expect(typeof(store.get)).toBe("function");
				expect(typeof(store.getAll)).toBe("function");
				expect(typeof(store.getBatch)).toBe("function");
				expect(typeof(store.getIndexList)).toBe("function");
				expect(typeof(store.hasIndex)).toBe("function");
				expect(typeof(store.indexComplies)).toBe("function");
				expect(typeof(store.iterate)).toBe("function");
				expect(typeof(store.makeKeyRange)).toBe("function");
				expect(typeof(store.normalizeIndexData)).toBe("function");
				expect(typeof(store.put)).toBe("function");
				expect(typeof(store.putBatch)).toBe("function");
				expect(typeof(store.query)).toBe("function");
				expect(typeof(store.remove)).toBe("function");
				expect(typeof(store.removeBatch)).toBe("function");
				expect(typeof(store.upsertBatch)).toBe("function");
				Backbone.fetchCache.clear(done);
			});
		});
	});

	describe('fetchcache', function() {
		it('fetchCache object exists', function() {
			expect(typeof(Backbone.fetchCache)).toBe("object");
		});

		it('fetchcache funtions', function() {
			expect(typeof(Backbone.fetchCache.init)).toBe("function");
			expect(typeof(Backbone.fetchCache.clear)).toBe("function");
		});
	});

	describe('fetchcache.init', function() {
		it('error if setting "name" is missing', function() {
			var settings = {
				name: undefined
			};
			expect(function() {
				var cache = new Backbone.fetchCache.init(settings, function() {});
			}).toThrow(new Error('Setting missing. The FetchCache needs a setting: "name"'));
		});
	});

	describe('fetchcache.clear', function() {
		it('fetchcache.clear is a function', function() {
			expect(typeof(Backbone.fetchCache.clear)).toBe("function");
		});

		it('call fetchcache.clear without init results in no callback', function(done) {
			spyOn(window.console, 'warn');
			var wasCalled = false;
			Backbone.fetchCache.clear(function() {
				wasCalled = true;
			});
			setTimeout(function() {
				expect(wasCalled).toBe(false);
				expect(window.console.warn).toHaveBeenCalled();
				done();
			}, 200);
		});

		it('fetchcache.clear returns callback', function(done) {
			var cache = new Backbone.fetchCache.init(testSettings, function() {
				expect(typeof(cache)).toBe("object");
				expect(Backbone.fetchCache.isInit).toBe(true);
				Backbone.fetchCache.clear(function() {
					done();
				});
			});
		});

		it('fetchcache.clear sets isInit to false', function(done) {
			var cache = new Backbone.fetchCache.init(testSettings, function() {
				Backbone.fetchCache.clear(function() {
					expect(Backbone.fetchCache.isInit).toBe(false);
					done();
				});
			});
		});

		it('model.fetch without calling fetchcache.init() first', function(done) {
			spyOn(window.console, 'warn');
			model.fetch({
				cache: true,
				success: function(model, resp, options) {
					expect(resp).toEqual(modelResponse);
					expect(window.console.warn).toHaveBeenCalled();
					done();
				}
			});
		});
	});

});