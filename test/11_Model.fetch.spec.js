describe('Backbone.Model', function() {
	var console = window.console;

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

	function genUrl(model, options) {
		return _.result(model, "url") + (options.data ? '?' + $.param(options.data) : '');
	}

	describe('TestServer', function() {
		it('servers dummy model', function(done) {
			$.getJSON(model.url, function(data) {
				expect(data).toEqual(modelResponse);
				done();
			});
		});
	});

	describe('.fetch', function() {

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

		it('simple model.fetch with success callback', function(done) {
			model.fetch({
				success: function(model, resp, options) {
					expect(resp).toEqual(modelResponse);
					expect(model.attributes).toEqual(modelResponse);
					done();
				}
			});
		});

		it('model.fetch without cacheing enabled', function(done) {
			model.fetch({
				success: function(model, resp, options) {
					expect(resp).toEqual(modelResponse);
					expect(model.attributes).toEqual(modelResponse);
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
					expect(resp).toEqual(modelResponse);
					expect(model.attributes).toEqual(modelResponse);
					Backbone.fetchCache.store.getItem(genUrl(model, options), function(value) {
						expect(typeof(value)).toBe("object");
						expect(value.data).toEqual(modelResponse);
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
					expect(resp).toEqual(modelResponse);
					expect(model.attributes).toEqual(modelResponse);
					Backbone.fetchCache.store.getItem(genUrl(model, options), function(value) {
						expect(typeof(value)).toBe("object");
						expect(value.data).toEqual(modelResponse);
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
						data: newModelResponse
					};
					// overwrite cache with new data
					Backbone.fetchCache.store.setItem(genUrl(model, options), data, function() {
						setTimeout(function() {
							// fetch a second time
							model.fetch({
								cache: true,
								maxAge: 1,
								success: function(model, resp, options) {
									expect(resp).toEqual(newModelResponse);
									expect(model.attributes).toEqual(newModelResponse);
									done();
								}
							});
						}, 100);
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
						data: newModelResponse
					};
					Backbone.fetchCache.store.setItem(genUrl(model, options), data, function() {
						setTimeout(function() {
							// fetch a second time
							model.fetch({
								cache: true,
								maxAge: 1,
								success: function(model, resp, options) {
									expect(resp).toEqual(modelResponse);
									expect(model.attributes).toEqual(modelResponse);
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
