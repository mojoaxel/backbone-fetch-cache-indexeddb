	describe('Backbone.Collection.fetch', function() {
		var console = window.console;

		var testSettings = {
			name: "testStore"
		};

		var port = 8182;

		var collection = new Backbone.Collection();
		collection.url = 'http://localhost:' + port + '/collection-cache-test';

		function genUrl(modCol, options) {
			return _.result(modCol, "url") + (options.data ? '?' + $.param(options.data) : '');
		}

		var collectionResponse = [{
			"foo": "bar"
		}, {
			"numbers": "123"
		}];

		var newCollectionResponse = [{
			"numbers": "345"
		}, {
			"fnord": "zero"
		}];

		beforeEach(function(done) {
			var cache = new Backbone.fetchCache.init(testSettings, function() {
				expect(Backbone.fetchCache.isInit).toBe(true);
				done();
			});
		});

		afterEach(function(done) {
			if (Backbone.fetchCache.isInit) {
				Backbone.fetchCache.clear(function() {
					done();
				});
			} else {
				done();
			}
		});

		it('simple collection.fetch with success callback', function(done) {
			collection.fetch({
				success: function(collection, resp, options) {
					expect(resp).toEqual(collectionResponse);
					done();
				}
			});
		});

		it('collection.fetch without cacheing enabled', function(done) {
			collection.fetch({
				success: function(collection, resp, options) {
					expect(resp).toEqual(collectionResponse);
					Backbone.fetchCache.store.getItem(genUrl(collection, options), function(value) {
						expect(value).toBe(null);
						Backbone.fetchCache.store.idb.count(function(count) {
							expect(count).toEqual(0);
							done();
						});
					});
				}
			});
		});

		it('collection.fetch with cacheing enabled', function(done) {
			collection.fetch({
				cache: true,
				success: function(collection, resp, options) {
					expect(resp).toEqual(collectionResponse);
					Backbone.fetchCache.store.getItem(genUrl(collection, options), function(value) {
						expect(typeof(value)).toBe("object");
						expect(value.data).toEqual(collectionResponse);
						done();
					});
				}
			});
		});

		it('collection.fetch with data', function(done) {
			collection.fetch({
				cache: true,
				data: {
					first: "123",
					second: "456"
				},
				success: function(collection, resp, options) {
					expect(resp).toEqual(collectionResponse);
					Backbone.fetchCache.store.getItem(genUrl(collection, options), function(value) {
						expect(typeof(value)).toBe("object");
						expect(value.data).toEqual(collectionResponse);
						done();
					});
				}
			});
		});

		it('collection.fetch with maxAge=1 second. Cache noes not expire', function(done) {
			collection.fetch({
				cache: true,
				success: function(collection, resp, options) {
					// overwrite cache with changed data
					var data = {
						timestamp: new Date().getTime(),
						data: newCollectionResponse
					};
					Backbone.fetchCache.store.setItem(genUrl(collection, options), data, function() {
						setTimeout(function() {
							// fetch a second time
							collection.fetch({
								cache: true,
								maxAge: 1,
								success: function(collection, resp, options) {
									expect(resp).toEqual(newCollectionResponse);
									done();
								}
							});
						}, 100);
					});
				}
			});
		});

		it('collection.fetch with maxAge=1 second. Cache does expire', function(done) {
			collection.fetch({
				cache: true,
				success: function(collection, resp, options) {
					// overwrite cache with changed data
					var data = {
						timestamp: new Date().getTime(),
						data: newCollectionResponse
					};
					Backbone.fetchCache.store.setItem(genUrl(collection, options), data, function() {
						setTimeout(function() {
							// fetch a second time
							collection.fetch({
								cache: true,
								maxAge: 1,
								success: function(collection, resp, options) {
									expect(resp).toEqual(collectionResponse);
									done();
								}
							});
						}, 1010);
					});
				}
			});
		});

	});
