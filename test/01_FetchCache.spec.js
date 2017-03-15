describe('FetchCache', function() {
	var testSettings = {
		name: "testStore"
	};

	var modelResponse = {
		"foo": "bar"
	};

	var model = new Backbone.Model();
	model.url = '/dummy/model-cache-test';

	afterEach(function(done) {
		Backbone.fetchCache.purge(done);
	})

	describe('Backbone.fetchCache', function() {
		it('defaults', function() {
			expect(typeof(Backbone.fetchCache)).toBe("object");
			expect(Backbone.fetchCache.isInit).toBe(false);
			expect(Backbone.fetchCache.enabled).toBe(false);
			expect(Backbone.fetchCache.maxAge).toBe(Infinity);
		});

		it('fetchcache funtions', function() {
			expect(typeof(Backbone.fetchCache.init)).toBe("function");
			expect(typeof(Backbone.fetchCache.clear)).toBe("function");
			expect(typeof(Backbone.fetchCache.purge)).toBe("function");
		});
	});

	describe('Backbone.fetchCache.init', function() {
		afterEach(function(done) {
			Backbone.fetchCache.purge(done);
		})

		it('error if setting "name" is missing', function() {
			var settings = {
				name: undefined
			};
			expect(function() {
				Backbone.fetchCache.init(settings, function() {});
			}).toThrow(new Error('Setting missing. The FetchCache needs a \"name\"'));
		});

		it('fetchcache.init must be called before fetch with cache works', function(done) {
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

		it('fetchcache.init returns callback', function(done) {
			var cache = Backbone.fetchCache.init(testSettings, function() {
				expect(typeof(cache)).toBe("object");
				expect(Backbone.fetchCache.isInit).toBe(true);
				Backbone.fetchCache.purge(done);
			});
		});

		it('error if setting "name" is missing', function() {
			var unvalidNames = [undefined, null];
			unvalidNames.forEach(function(name) {
				expect(function() {
					Backbone.fetchCache.init({
						name: name
					}, function() {});
				}).toThrow(new Error('Setting missing. The FetchCache needs a "name"'));
			});
		});

		it('error if setting "name" is invalid', function() {
			var invalid = [4711, {}, function() {}, '', " ", "\n", "\t"];
			invalid.forEach(function(invalid) {
				expect(function() {
					Backbone.fetchCache.init({
						name: invalid
					}, function() {});
				}).toThrow(new Error('The "name" parameter must be a valid String'));
			});
		});

		it('error if setting "enabled" or "maxge" are invalid they are ignord', function(done) {
			var invalid = [undefined, null, "fnord", NaN, {}, function() {}, ''];
			var maxCount = invalid.length - 1;
			var index = 0;

			function enabledTest(i) {
				var inval = invalid[i];
				Backbone.fetchCache.init({
					name: "test",
					enabled: inval,
					maxAge: inval
				}, function() {
					expect(Backbone.fetchCache.enabled).not.toBe(inval);
					expect(Backbone.fetchCache.maxAge).not.toBe(inval);
					if (i >= maxCount) {
						Backbone.fetchCache.purge(done);
					} else {
						enabledTest(index++);
					}
				});
			}
			enabledTest(index++);
		});
	});

	describe('Backbone.fetchCache (IDBStore)', function() {
		it('exposes all IDBStore functions', function(done) {
			Backbone.fetchCache.init(testSettings, function(cache) {
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
				Backbone.fetchCache.purge(done);
			});
		});
	});

	describe('Backbone.fetchCache.clear', function() {
		it('fetchcache.clear is a function', function() {
			expect(typeof(Backbone.fetchCache.clear)).toBe("function");
		});

		it('fetchcache.clear call without init results in no callback', function(done) {
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
			Backbone.fetchCache.init(testSettings, function() {
				Backbone.fetchCache.clear(function(cache) {
					expect(typeof(cache)).toBe("object");
					done();
				});
			});
		});

		it('fetchcache.clear sets isInit not to false', function(done) {
			Backbone.fetchCache.init(testSettings, function() {
				Backbone.fetchCache.clear(function() {
					expect(Backbone.fetchCache.isInit).toBe(true);
					done();
				});
			});
		});

		it('fetchcache.clear emptys the store', function(done) {
			var testKey = "testKey";
			var testData = "testData";
			Backbone.fetchCache.init(testSettings, function() {
				Backbone.fetchCache.store.setItem(testKey, testData, function() {
					Backbone.fetchCache.clear(function() {
						Backbone.fetchCache.store.idb.getAll(function(data) {
							expect(data).not.toBe([]);
							done();
						});
					});
				});
			});
		});
	});

	describe('Backbone.fetchCache.purge', function() {
		it('fetchcache.purge is a function', function() {
			expect(typeof(Backbone.fetchCache.purge)).toBe("function");
		});

		it('fetchcache.purge call without init results in callback', function(done) {
			var wasCalled = false;
			Backbone.fetchCache.purge(function() {
				wasCalled = true;
			});
			setTimeout(function() {
				expect(wasCalled).toBe(true);
				done();
			}, 100);
		});

		it('fetchcache.purge returns callback', function(done) {
			Backbone.fetchCache.init(testSettings, function() {
				Backbone.fetchCache.purge(function(cache) {
					expect(cache.isInit).toBe(false);
					expect(cache.store).toBe(undefined);
					done();
				});
			});
		});

		it('fetchcache.purge sets isInit to false', function(done) {
			Backbone.fetchCache.init(testSettings, function() {
				Backbone.fetchCache.purge(function() {
					expect(Backbone.fetchCache.isInit).toBe(false);
					done();
				});
			});
		});
	});

	//TODO error handling
	//TODO 1.create store, 2. manually clear indexdb in browser, 3. try to write something --> Exception


});
