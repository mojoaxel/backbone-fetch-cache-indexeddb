describe('Backbone.fetchCache', function() {
	var testSettings, model, errorModel, collection, errorCollection, server, modelResponse, errorModelResponse, collectionResponse;

	beforeEach(function() {
		model = new Backbone.Model();
		model.url = '/model-cache-test';
		errorModel = new Backbone.Model();
		errorModel.url = '/model-error-cache-test';
		collection = new Backbone.Collection();
		collection.url = '/collection-cache-test';
		errorCollection = new Backbone.Collection();
		errorCollection.url = '/collection-error-cache-test';

		testSettings = {
			name: "testStore"
		};

		server = sinon.fakeServer.create();
		modelResponse = {
			sausages: 'bacon'
		};
		collectionResponse = [{
			sausages: 'bacon'
		}, {
			rice: 'peas'
		}];
		server.respondWith('GET', model.url, [200, {
			'Content-Type': 'application/json'
		}, JSON.stringify(modelResponse)]);
		server.respondWith('GET', collection.url, [200, {
			'Content-Type': 'application/json'
		}, JSON.stringify(collectionResponse)]);
		server.respondWith('GET', errorModel.url, [500, {
			'Content-Type': 'test/html'
		}, 'Server Error']);
		server.respondWith('GET', errorCollection.url, [500, {
			'Content-Type': 'test/html'
		}, 'Server Error']);
	});

	afterEach(function() {
		server.restore();
	});

	describe('IDBStore', function() {

		it('exposes IDBStore', function() {
			var store = Backbone.fetchCache.store;
			expect(typeof(store)).not.toBeUndefined();
		});

		it('exposes all IDBStore functions', function(done) {
			var cache = new Backbone.fetchCache.init(testSettings, function(cache) {
				var store = cache.store;
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
				done();
			});
		});
	});

	describe('fetchcache.init', function() {
		it('fetchCache object exists', function() {
			expect(typeof(Backbone.fetchCache)).toBe("object");
		});

		it('error if setting "name" is missing', function() {
			var settings = {
				name: undefined
			};
			expect(function() {
				var cache = new Backbone.fetchCache.init(settings, function() {});
			}).toThrow(new Error('Setting missing. The FetchCache needs a setting: "name"'));
		});
	});

});
