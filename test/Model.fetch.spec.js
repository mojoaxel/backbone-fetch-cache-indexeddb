describe('Backbone.fetchCache', function() {
	var testSettings, model, errorModel, modelResponse, newModelResponse;

	var console = window.console;

	testSettings = {
		name: "testStore"
	};

	var port = 8182;

	modelResponse = {
		"foo": "bar"
	};
	newModelResponse = {
		"hip": "hop"
	};

	model = new Backbone.Model();
	model.url = 'http://localhost:' + port + '/model-cache-test';

	describe('Backbone.Model.fetch', function() {

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
					Backbone.fetchCache.store.getItem(model.url, function(value) {
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
					Backbone.fetchCache.store.getItem(model.url, function(value) {
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
					Backbone.fetchCache.store.setItem(model.url, data, function() {
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
					Backbone.fetchCache.store.setItem(model.url, data, function() {
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
