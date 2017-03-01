describe('Backbone.fetchCache', function() {
	var testSettings, model, errorModel, collection, errorCollection, modelResponse, errorModelResponse, collectionResponse;

	testSettings = {
		name: "testStore"
	};

	var port = 8182;

	modelResponse = {
		sausages: 'bacon'
	};

	model = new Backbone.Model();
	model.url = 'http://localhost:' + port + '/model-cache-test';
	collection = new Backbone.Collection();
	collection.url = 'http://localhost:' + port + '/collection-cache-test';

	describe('Backbone.Model.fetch', function() {

		beforeEach(function(done) {
			var cache = new Backbone.fetchCache.init(testSettings, function() {
				expect(Backbone.fetchCache.isInit).toBe(true);
				window.console.log("beforeEach");
				done();
			});
		});

		afterEach(function(done) {
			Backbone.fetchCache.clear(function() {
				window.console.log("afterEach");
				done();
			});
		});

		it('simple model.fetch with success callback', function(done) {
			window.console.log("it1");
			model.fetch({
				success: function(model, resp, options) {
					expect(resp).toEqual(modelResponse);
					expect(model.attributes).toEqual(modelResponse);
					done();
				}
			});
		});

		it('model.fetch without cacheing enabled', function(done) {
			window.console.log("it2");
			model.fetch({
				success: function(model, resp, options) {
					expect(resp).toEqual(modelResponse);
					expect(model.attributes).toEqual(modelResponse);
					Backbone.fetchCache.store.getItem(model.url, function(value) {
						expect(value).toBeUndefined();
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
						expect(value).toEqual(modelResponse);
						done();
					});
				}
			});
		});
	});

});
