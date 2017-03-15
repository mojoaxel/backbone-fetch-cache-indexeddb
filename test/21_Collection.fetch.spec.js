	describe('Backbone.Collection', function() {

		var testSettings = {
			name: "testStore"
		};

		var collection = new Backbone.Collection();
		collection.url = '/dummy/collection-cache-test';

		function genUrl(modCol, options) {
			return _.result(modCol, "url") + (options.data ? '?' + $.param(options.data) : '');
		}

		var truth = [{
			"foo": "bar"
		}, {
			"numbers": "123"
		}];

		var alternativeTruth = [{
			"numbers": "345"
		}, {
			"fnord": "zero"
		}];

		describe('TestServer', function() {
			it('serves dummy collection', function(done) {
				$.getJSON(collection.url, function(data) {
					expect(data).toEqual(truth);
					done();
				});
			});
		});

		describe('.fetch', function() {
			beforeEach(function(done) {
				Backbone.fetchCache.init(testSettings, function() {
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
						expect(resp).toEqual(truth);
						done();
					}
				});
			});

			it('collection.fetch without cacheing enabled', function(done) {
				collection.fetch({
					success: function(collection, resp, options) {
						expect(resp).toEqual(truth);
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
						expect(resp).toEqual(truth);
						Backbone.fetchCache.store.getItem(genUrl(collection, options), function(value) {
							expect(typeof(value)).toBe("object");
							expect(value.data).toEqual(truth);
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
						expect(resp).toEqual(truth);
						Backbone.fetchCache.store.getItem(genUrl(collection, options), function(value) {
							expect(typeof(value)).toBe("object");
							expect(value.data).toEqual(truth);
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
							data: alternativeTruth
						};
						Backbone.fetchCache.store.setItem(genUrl(collection, options), data, function() {
							setTimeout(function() {
								// fetch a second time
								collection.fetch({
									cache: true,
									maxAge: 1,
									success: function(collection, resp, options) {
										expect(resp).toEqual(alternativeTruth);
										done();
									}
								});
							}, 100);
						});
					}
				});
			});

			it('collection.fetch with forced update', function(done) {
				collection.fetch({
					cache: true,
					success: function(collection, resp, options) {
						// overwrite cache with changed data
						var data = {
							timestamp: new Date().getTime(),
							data: alternativeTruth
						};
						Backbone.fetchCache.store.setItem(genUrl(collection, options), data, function() {
							// fetch a second time with forced update
							collection.fetch({
								cache: true,
								maxAge: 0,
								success: function(collection, resp, options) {
									expect(resp).toEqual(truth);
									done();
								}
							});
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
							data: alternativeTruth
						};
						Backbone.fetchCache.store.setItem(genUrl(collection, options), data, function() {
							setTimeout(function() {
								// fetch a second time
								collection.fetch({
									cache: true,
									maxAge: 1,
									success: function(collection, resp, options) {
										expect(resp).toEqual(truth);
										done();
									}
								});
							}, 1010);
						});
					}
				});
			});

		});
	});
