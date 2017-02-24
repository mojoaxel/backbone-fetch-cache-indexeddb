const assert = require('assert');
const path = require('path');
const request = require('supertest');
const TestServer = require('./TestServer');

describe('Make sure the TestServer provides everything we need', () => {
	let server
	let router
	let db

	before((done) => {
		db = require(path.join(__dirname, 'TestServerDB'));
		server = new TestServer({
			db: db
		}, done);
	})

	after((done) => {
		server.destroy(done);
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
