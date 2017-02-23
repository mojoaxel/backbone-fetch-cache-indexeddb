const assert = require('assert');
const path = require('path');
const request = require('supertest');
const jsonServer = require('json-server');
const jsdom = require('mocha-jsdom');
const _ = require('underscore');

describe('Backbone.Model', () => {
	var db, testServer;
	var $, Backbone;
	var model, collection;
	var TestModel, TestCollection;

	jsdom();

	before((done) => {
		db = require(path.join(__dirname, 'TestServerDB'));
		rewriterRules = require(path.join(__dirname, 'TestServerRoutes.json'));

		testServer = jsonServer.create();
		testServer.use(jsonServer.defaults({
			logger: false
		}));
		testServer.use(jsonServer.rewriter(rewriterRules));
		testServer.use(jsonServer.router(db));

		Backbone = require('backbone');
		Backbone.$ = $ = require('jquery');

		TestModel = Backbone.Model.extend({
			url: 'http://localhost:3000/model'
		});

		TestCollection = Backbone.Collection.extend({
			url: 'http://localhost:3000/collection'
		});

		testServer.listen(3000, done);
	})

	beforeEach(() => {
		model = new TestModel();
		collection = new TestCollection();
		collection.add(model);
	})

	describe('fetch', () => {

		it('TestServer should be running', (done) => {
			request('http://localhost:3000')
				.get('/model')
				.expect(200, done)
		});

		it('save, fetch, destroy triggers error event when an error occurs', function() {
			var model = new Backbone.Model();
			model.on('error', function() {
				assert.ok(true);
			});
			model.sync = function(method, m, options) {
				options.error();
			};
			model.save({data: 2, id: 1});
			model.fetch();
			model.destroy();
		});

		it('save, fetch, destroy calls success with context', function() {
			var model = new Backbone.Model();
			var obj = {};
			var options = {
				context: obj,
				success: function() {
					assert.equal(this, obj);
				}
			};
			model.sync = function(method, m, opts) {
				opts.success.call(opts.context);
			};
			model.save({data: 2, id: 1}, options);
			model.fetch(options);
			model.destroy(options);
		});

		it('save, fetch, destroy calls error with context', function() {
			var model = new Backbone.Model();
			var obj = {};
			var options = {
				context: obj,
				error: function() {
					assert.equal(this, obj);
				}
			};
			model.sync = function(method, m, opts) {
				opts.error.call(opts.context);
			};
			model.save({data: 2, id: 1}, options);
			model.fetch(options);
			model.destroy(options);
		});

		it('save and fetch with parse false', function() {
			var i = 0;
			var model = new Backbone.Model();
			model.parse = function() {
				assert.ok(false);
			};
			model.sync = function(method, m, options) {
				options.success({i: ++i});
			};
			model.fetch({parse: false});
			assert.equal(model.get('i'), i);
			model.save(null, {parse: false});
			assert.equal(model.get('i'), i);
		});

		it('fetch success callback', function(done) {
			model.fetch({
				success: function(model, response, options) {
					assert.equal(model.get('foo'), 'foo');
					assert.equal(model.get('bar'), 'bar');
					done();
				}
			});
		});

		it('fetch should trigger the "request" event', function(done) {
			model.on("request", function() {
				done();
			});
			model.fetch();
		});

		it('fetch should trigger the "sync" event', function(done) {
			model.on("sync", function() {
				assert.equal(model.get('foo'), 'foo');
				assert.equal(model.get('bar'), 'bar');
				done();
			});
			model.fetch();
		});

		it('fetch should trigger the "change" event', function(done) {
			model.on("change", function() {
				assert.equal(model.get('foo'), 'foo');
				assert.equal(model.get('bar'), 'bar');
				done();
			});
			model.fetch();
		});

		it('fetch with global:true should trigger ajaxSend', function(done) {
			var ajaxEventTriggered = false;
			$(document).ajaxSend(function(event, XMLHttpRequest, ajaxOptions) {
				ajaxEventTriggered = true;
			});
			model.fetch({
				global: true
			});
			_.delay(function() {
				$(document).off('ajaxSend');
				assert(ajaxEventTriggered);
				done();
			}, 10);
		});

		it('fetch with global:false should not trigger ajaxSend', function(done) {
			var ajaxEventTriggered = false;
			$(document).ajaxSend(function(event, XMLHttpRequest, ajaxOptions) {
				ajaxEventTriggered = true;
			});
			model.fetch({
				global: false
			});
			_.delay(function() {
				$(document).off('ajaxSend');
				assert(!ajaxEventTriggered);
				done();
			}, 10);
		});

	}); //fetch

})
