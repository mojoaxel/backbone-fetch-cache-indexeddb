describe('Backbone.fetchCache', function() {
  var model, errorModel, collection, errorCollection, server, modelResponse, errorModelResponse, collectionResponse;

  beforeEach(function() {
    model = new Backbone.Model();
    model.url = '/model-cache-test';
    errorModel = new Backbone.Model();
    errorModel.url = '/model-error-cache-test';
    collection = new Backbone.Collection();
    collection.url = '/collection-cache-test';
    errorCollection = new Backbone.Collection();
    errorCollection.url = '/collection-error-cache-test';

    server = sinon.fakeServer.create();
    modelResponse = { sausages: 'bacon' };
    collectionResponse = [{ sausages: 'bacon' }, { rice: 'peas' }];
    server.respondWith('GET', model.url, [ 200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(modelResponse)
    ]);
    server.respondWith('GET', collection.url, [ 200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(collectionResponse)
    ]);
    server.respondWith('GET', errorModel.url, [ 500,
      { 'Content-Type': 'test/html' },
      'Server Error'
    ]);
    server.respondWith('GET', errorCollection.url, [ 500,
      { 'Content-Type': 'test/html' },
      'Server Error'
    ]);
  });

  afterEach(function() {
    server.restore();
  });

  describe('fetchCache functions', function() {
    it('fetchCache object exists', function() {
      expect(typeof(Backbone.fetchCache)).not.toBeUndefined();
    });
    it('has function setItem', function() {
      expect(typeof(Backbone.fetchCache.getItem)).toBe("function");
    });
    it('has function getItem', function() {
      expect(typeof(Backbone.fetchCache.getItem)).toBe("function");
    });
  });

  describe('localforage', function() {
    it('exposes localforage', function() {
      var localforage = Backbone.fetchCache.localforage;
      expect(typeof(localforage)).not.toBeUndefined();
    });
    it('exposes all localforage functions', function() {
      var localforage = Backbone.fetchCache.localforage;
      expect(typeof(localforage.getItem)).toBe("function");
      expect(typeof(localforage.setItem)).toBe("function");
      expect(typeof(localforage.removeItem)).toBe("function");
      expect(typeof(localforage.clear)).toBe("function");
      expect(typeof(localforage.length)).toBe("function");
      expect(typeof(localforage.key)).toBe("function");
      expect(typeof(localforage.keys)).toBe("function");
      expect(typeof(localforage.iterate)).toBe("function");
      expect(typeof(localforage.setDriver)).toBe("function");
      expect(typeof(localforage.config)).toBe("function");
      expect(typeof(localforage.driver)).toBe("function");
    });
  });

});
