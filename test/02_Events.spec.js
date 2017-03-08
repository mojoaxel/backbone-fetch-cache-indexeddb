describe('Backbone.fetchCache (Events)', function() {
	var testSettings = {
		name: "testStore"
	};
	/*
	var modelResponse = {
		"foo": "bar"
	};

	var model = new Backbone.Model();
	model.url = '/dummy/model-cache-test';
	*/

	describe('clear', function() {
		it('event "clear" was triggered', function(done) {
			var eventWasFired = false;
			Backbone.fetchCache.on('clear', function() {
				eventWasFired = true;
			});
			Backbone.fetchCache.init(testSettings, function() {
				Backbone.fetchCache.clear(function() {
					//setTimeout(function() {
					expect(eventWasFired).toBe(true);
					done();
					//}, 100);
				});
			});
		});
	});

});
