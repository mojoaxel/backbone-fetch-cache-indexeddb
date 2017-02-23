db = {};

db.model = {
	foo: 'foo',
	bar: 'bar'
}

db.collection = [
	{ id: 1, body: 'foo' },
	{ id: 2, body: 'bar' }
]

db.deep = [
	{ a: { b: 1 } },
	{ a: 1 }
]

module.exports = db;
