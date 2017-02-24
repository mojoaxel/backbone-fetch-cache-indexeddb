const assert = require('assert');
const path = require('path');
const request = require('supertest');
const jsonServer = require('json-server');

describe('Make sure the TestServer provides everything we need', () => {
	let server
	let router
	let db

	beforeEach(() => {
		db = require(path.join(__dirname, 'TestServerDB'));
		rewriterRules = require(path.join(__dirname, 'TestServerRoutes.json'));

		server = jsonServer.create();
		server.use(jsonServer.defaults({
			logger: false,
			port: 8123
		}));
		server.use(jsonServer.rewriter(rewriterRules));
		server.use(jsonServer.router(db));
	})

	describe('GET /api/misc/deep', () => {
		it('should support simple GET of a deep url', (done) => {
			request(server)
				.get('/api/misc/deep')
				.expect('Content-Type', /json/)
				.expect(db.deep)
				.expect(200, done)
		});

		it('should support deep filter', (done) => {
			request(server)
				.get('/api/misc/deep?a.b=1')
				.expect('Content-Type', /json/)
				.expect([{ a: { b: 1 } }])
				.expect(200, done)
		});
	});

	describe('POST /collection', () => {
		it('should respond with json, create a resource and increment id', (done) => {
			request(server)
				.post('/collection')
				.send({body: 'foo', booleanValue: true, integerValue: 1})
				.expect('Content-Type', /json/)
				.expect({id: 3, body: 'foo', booleanValue: true, integerValue: 1})
				.expect(201)
				.end((err, res) => {
					if (err) return done(err)
					assert.equal(db.collection.length, 3)
					done()
				})
		})
	})
})
