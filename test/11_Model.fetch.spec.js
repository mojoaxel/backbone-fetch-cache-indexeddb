describe('Backbone.Model', function() {

	var testSettings = {
		name: "testStore"
	};

	var truth = {
		"foo": "bar"
	};
	var alternativeTruth = {
		"so": "sad"
	};

	var model = new Backbone.Model();
	model.url = '/dummy/model-cache-test';

	function genUrl(model, options) {
		return _.result(model, "url") + (options.data ? '?' + $.param(options.data) : '');
	}

	describe('TestServer', function() {
		it('serves dummy model', function(done) {
			$.getJSON(model.url, function(data) {
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

		it('simple model.fetch with success callback', function(done) {
			model.fetch({
				success: function(model, resp, options) {
					expect(resp).toEqual(truth);
					expect(model.attributes).toEqual(truth);
					done();
				}
			});
		});

		it('model.fetch without cacheing enabled', function(done) {
			model.fetch({
				success: function(model, resp, options) {
					expect(resp).toEqual(truth);
					expect(model.attributes).toEqual(truth);
					Backbone.fetchCache.store.getItem(genUrl(model, options), function(value) {
						expect(value).toBe(null);
						Backbone.fetchCache.store.idb.count(function(count) {
							expect(count).toEqual(0);
							done();
						});
					});
				}
			});
		});

		it('model.fetch with cacheing enabled', function(done) {
			model.fetch({
				cache: true,
				success: function(model, resp, options) {
					expect(resp).toEqual(truth);
					expect(model.attributes).toEqual(truth);
					Backbone.fetchCache.store.getItem(genUrl(model, options), function(value) {
						expect(typeof(value)).toBe("object");
						expect(value.data).toEqual(truth);
						done();
					});
				}
			});
		});

		it('model.fetch with data', function(done) {
			model.fetch({
				cache: true,
				data: {
					first: "123",
					second: "456"
				},
				success: function(model, resp, options) {
					expect(resp).toEqual(truth);
					expect(model.attributes).toEqual(truth);
					Backbone.fetchCache.store.getItem(genUrl(model, options), function(value) {
						expect(typeof(value)).toBe("object");
						expect(value.data).toEqual(truth);
						done();
					});
				}
			});
		});

		it('model.fetch with maxAge=1 second. Cache noes not expire', function(done) {
			model.fetch({
				cache: true,
				success: function(model, resp, options) {
					// overwrite cache with changed data
					var data = {
						timestamp: new Date().getTime(),
						data: alternativeTruth
					};
					// overwrite cache with new data
					model.clear();
					Backbone.fetchCache.store.setItem(genUrl(model, options), data, function() {
						setTimeout(function() {
							// fetch a second time
							model.fetch({
								cache: true,
								maxAge: 1,
								success: function(model, resp, options) {
									expect(resp).toEqual(alternativeTruth);
									expect(model.attributes).toEqual(alternativeTruth);
									done();
								}
							});
						}, 100);
					});
				}
			});
		});

		it('model.fetch with forced update', function(done) {
			model.fetch({
				cache: true,
				success: function(model, resp, options) {
					// overwrite cache with changed data
					var data = {
						timestamp: new Date().getTime(),
						data: alternativeTruth
					};
					// overwrite cache with new data
					model.clear();
					Backbone.fetchCache.store.setItem(genUrl(model, options), data, function() {
						// fetch a second time with forced update
						model.fetch({
							cache: true,
							maxAge: 0,
							success: function(model, resp, options) {
								expect(resp).toEqual(truth);
								expect(model.attributes).toEqual(truth);
								done();
							}
						});
					});
				}
			});
		});

		it('model.fetch with maxAge=1 second. Cache does expire', function(done) {
			model.fetch({
				cache: true,
				success: function(model, resp, options) {
					// overwrite cache with changed data
					var data = {
						timestamp: new Date().getTime(),
						data: alternativeTruth
					};
					model.clear();
					Backbone.fetchCache.store.setItem(genUrl(model, options), data, function() {
						setTimeout(function() {
							// fetch a second time
							model.fetch({
								cache: true,
								maxAge: 1,
								success: function(model, resp, options) {
									expect(resp).toEqual(truth);
									expect(model.attributes).toEqual(truth);
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
