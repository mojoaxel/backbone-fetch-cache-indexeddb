// AMD wrapper from https://github.com/umdjs/umd/blob/master/amdWebGlobal.js
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module and set browser global
		define(['underscore', 'backbone', 'jquery'], function (_, Backbone, $) {
			return (root.Backbone = factory(_, Backbone, $));
		});
	} else if (typeof exports !== 'undefined' && typeof require !== 'undefined') {
		module.exports = factory(require('underscore'), require('backbone'), require('jquery'));
	} else {
		// Browser globals
		root.Backbone = factory(root._, root.Backbone, root.jQuery);
	}
}(this, function (_, Backbone, $) {

	//Backbone.Model.prototype.fetch	= function() {}; //TODO
	//Backbone.Model.prototype.sync = function() {}; //TODO

	//Backbone.Collection.prototype.fetch = function() {}; //TODO

	return Backbone;
}));
