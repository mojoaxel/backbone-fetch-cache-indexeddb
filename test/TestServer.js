const jsonServer = require('json-server');
const Http = require('http');
const enableDestroy = require('server-destroy')
const path = require('path');

class TestServer {
	constructor(options, callback) {
		var db = options.db || require(path.join(__dirname, 'TestServerDB'));
		var rewriterRules = options.rewriterRules || require(path.join(__dirname, 'TestServerRoutes.json'));
		var port = options.port || 3000;
		var logger = options.logger || false;

		this.server = jsonServer.create();
		this.server.use(jsonServer.defaults({
			logger: logger
		}));
		this.server.use(jsonServer.rewriter(rewriterRules));
		this.server.use(jsonServer.router(db));

		this.httpServer = Http.createServer(this.server);
		this.httpServer.listen(port, callback)

		enableDestroy(this.httpServer);

		return this.httpServer;
	}
}

module.exports = TestServer;
