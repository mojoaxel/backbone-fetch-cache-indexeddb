/*global module:false*/
var path = require('path');
module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks("grunt-jsbeautifier");
	grunt.loadNpmTasks('grunt-browserify');

	grunt.registerTask('build', ['jshint', 'jsbeautifier', 'browserify', 'uglify']);
	grunt.registerTask('test', ['connect', 'jasmine']);
	grunt.registerTask('spec-server', ['jasmine::build', 'connect::keepalive']);
	grunt.registerTask('spec-server-watch', ['jshint', 'jsbeautifier', 'browserify', 'jasmine::build', 'connect', 'watch']);

	grunt.registerTask('default', ['build', 'test']);

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		connect: {
			default: {
				options: {
					port: 8182,
					base: '.',
					middleware: function(connect, options, middlewares) {
						middlewares.unshift(function(req, res, next) {
							if (req.url === '/dummy/') {
								res.setHeader('Content-Type', 'text/plain');
								res.setHeader('Access-Control-Allow-Origin', '*');
								res.end("Dummy-Server is running!");
							} else {
								return next();
							}
						});
						middlewares.unshift(function(req, res, next) {
							if (req.url.startsWith('/dummy/model-cache-test')) {
								res.setHeader('Content-Type', 'application/json');
								res.setHeader('Access-Control-Allow-Origin', '*');
								res.end(JSON.stringify({
									"foo": "bar"
								}));
							} else {
								return next();
							}
						});
						middlewares.unshift(function(req, res, next) {
							if (req.url.startsWith('/dummy/collection-cache-test')) {
								res.setHeader('Content-Type', 'application/json');
								res.setHeader('Access-Control-Allow-Origin', '*');
								res.end(JSON.stringify([{
									"foo": "bar"
								}, {
									"numbers": "123"
								}]));
							} else {
								return next();
							}
						});
						return middlewares;
					}
				}
			}
		},

		jasmine: {
			src: ['<%= pkg.main %>'],
			options: {
				host: 'http://127.0.0.1:8182/',
				outfile: 'index.html',
				specs: 'test/**/*.spec.js',
				vendor: [
					'node_modules/jquery/dist/jquery.js',
					'node_modules/underscore/underscore.js',
					'node_modules/backbone/backbone.js'
				],
				timeout: 5000,
				phantomjs: {
					'ignore-ssl-errors': true
				}
			}
		},

		jshint: {
			files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.spec.js'],
			options: {
				jshintrc: '.jshintrc'
			}
		},

		jsbeautifier: {
			files: ['test/**/*.js', 'src/**/*.js', 'Gruntfile.js'],
			options: {
				js: {
					indentWithTabs: true
				}
			}
		},

		uglify: {
			options: {
				banner: "/**\n" +
					" * @see <%= pkg.homepage %>\n" +
					" * @copyright <%= grunt.template.today('yyyy') %> by <%= pkg.author %>\n" +
					" * @version <%= pkg.version %>\n" +
					" * @license <%= pkg.license %>\n" +
					" */\n",
				compress: {
					pure_funcs: "'[log]'",
					dead_code: true
				},
				mangle: {
					except: ['_', 'Backbone', '$']
				},
				preserveComments: false
			},
			dist: {
				files: {
					'<%= pkg.main %>': ['<%= pkg.main %>']
				}
			}
		},

		browserify: {
			dist: {
				files: {
					'<%= pkg.main %>': ['src/**/*.js']
				},
				options: {
					external: [
						'underscore',
						'backbone',
						'jquery'
					]
				}
			}
		},

		watch: {
			files: ['test/**/*', 'src/**/*'],
			tasks: ['jshint', 'jsbeautifier', 'browserify', 'jasmine::build']
		}
	});
};
