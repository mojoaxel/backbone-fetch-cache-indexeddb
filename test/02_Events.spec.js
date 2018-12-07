describe('Backbone.fetchCache (Events)', function() {
	var testSettings = {
		name: "testStore"
	};

	describe('clear', function() {
		it('event "clear" was triggered', function(done) {
			var eventWasFired = false;
			Backbone.fetchCache.on('clear', function() {
				eventWasFired = true;
			});
			Backbone.fetchCache.init(testSettings, function() {
				Backbone.fetchCache.clear(function() {
					setTimeout(function() {
						expect(eventWasFired).toBe(true);
						done();
					}, 100);
				});
			});
		});
	});

});
