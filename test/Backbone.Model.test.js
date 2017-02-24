const _ = require('underscore');
const assert = require('assert');
const path = require('path');
const request = require('supertest');
const jsdom = require('mocha-jsdom');
const TestServer = require('./TestServer');

describe('Backbone.Model', () => {
	var db, testServer;
	var $, Backbone;
	var TestModel;

	jsdom();

	before((done) => {
		Backbone = require('../backbone.fetch-cache.indexeddb');
		Backbone.$ = $ = require('jquery');

		TestModel = Backbone.Model.extend({
			url: function() {
				return 'http://localhost:3000/model';
			}
		});

		db = require(path.join(__dirname, 'TestServerDB'));
		testServer = new TestServer({
			db: db
		}, done);
	})

	after((done) => {
		testServer.destroy(done);
	})

	afterEach(function(done) {
		if (Backbone.fetchCache) {
			Backbone.fetchCache.reset(done);
		} else {
			done();
		}
	})

	describe('fetch', () => {

		it('Make sure the TestServer is availible', (done) => {
			request('http://localhost:3000')
				.get('/model')
				.expect(200, done)
		});

		it('save and fetch with parse false', function() {
			var model = new TestModel();
			var i = 0;
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
			var model = new TestModel();
			model.fetch({
				success: function(model, response, options) {
					assert.equal(model.get('foo'), 'foo');
					assert.equal(model.get('bar'), 'bar');
					done();
				}
			});
		});

		it('fetch should trigger the "request" event', function(done) {
			var model = new TestModel();
			model.on("request", function() {
				model.destroy();
				done();
			});
			model.fetch();
		});

		it('fetch should trigger the "sync" event', function(done) {
			var model = new TestModel();
			model.on("sync", function() {
				assert.equal(model.get('foo'), 'foo');
				assert.equal(model.get('bar'), 'bar');
				model.destroy();
				done();
			});
			model.fetch();
		});

		it('fetch should trigger the "change" event', function(done) {
			var model = new TestModel();
			model.on("change", function() {
				assert.equal(model.get('foo'), 'foo');
				assert.equal(model.get('bar'), 'bar');
				model.destroy();
				done();
			});
			model.fetch();
		});

		it('fetch with global:true should trigger ajaxSend', function(done) {
			var model = new TestModel();
			var ajaxEventTriggered = false;
			$(document).ajaxSend(function(event, XMLHttpRequest, ajaxOptions) {
				ajaxEventTriggered = true;
			});
			model.fetch({
				global: true,
				success: function() {
					$(document).off('ajaxSend');
					assert(ajaxEventTriggered);
					model.destroy();
					done();
				}
			});
		});

		it('fetch with global:false should not trigger ajaxSend', function(done) {
			var model = new TestModel();
			var ajaxEventTriggered = false;
			$(document).ajaxSend(function(event, XMLHttpRequest, ajaxOptions) {
				ajaxEventTriggered = true;
			});
			model.fetch({
				global: false,
				success: function(model, response, options) {
					$(document).off('ajaxSend');
					assert(!ajaxEventTriggered);
					model.destroy();
					done();
				}
			});
		});

		it('if data is fetched a second time no ajaxSend should not be triggered', function(done) {
			var model = new TestModel();
			//first fetch
			model.fetch({
				cache: true,
				success: function() {
					var ajaxEventTriggered = false;
					$(document).ajaxSend(function(event, XMLHttpRequest, ajaxOptions) {
						ajaxEventTriggered = true;
					});
					//second fetch
					model.fetch({
						cache: true,
						success: function(model, response, options) {
							$(document).off('ajaxSend');
							assert(!ajaxEventTriggered);
							model.destroy();
							done();
						}
					});
				}
			})
		});

	}); //fetch

})
