'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

var _mongodb = require('mongodb');

var _mongodb2 = _interopRequireDefault(_mongodb);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _base = require('base-64');

var _base2 = _interopRequireDefault(_base);

var _Action = require('./models/Action');

var _Action2 = _interopRequireDefault(_Action);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Configure environment.
_dotenv2.default.config();

var MongoClient = _mongodb2.default.MongoClient;

MongoClient.connect(process.env.MONGODB_URI, function (err, db) {
	if (err) throw err;

	db.createCollection('actions', function (err, res) {
		if (err) throw err;
		db.close();
	});
});

var app = (0, _express2.default)();

var corsWhitelist = ['https://app-local.stashinvest.com:57454'];

var corsOptions = {
	origin: function origin(_origin, callback) {
		if (corsWhitelist.indexOf(_origin) !== -1) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	}
};

app.use((0, _cors2.default)(corsOptions));
app.use(_bodyParser2.default.json({ limit: '1mb' }));

app.post('/event', function (req, res) {

	var data = {};

	if (!req.body || !req.body.data) {
		return res.status(400).send('{ "success": false, "status": 400, "message": "data is required." }');
	}
	console.log(_base2.default.decode(req.body.data));
	try {
		data = JSON.parse(_base2.default.decode(req.body.data));
	} catch (e) {
		return res.status(400).send('{ "success": false, "status": 400, "message": "Invalid request" }');
	}

	if (!data.actions || !Array.isArray(data.actions)) {
		return res.status(400).send('{ "success": false, "status": 400, "message": "Actions not specified." }');
	}
	var now = Date.now();

	var insertions = data.actions.map(function (a) {
		var action = new _Action2.default(a, req.headers, now);
		return action.getAction();
	});

	MongoClient.connect(process.env.MONGODB_URI, function (err, db) {
		if (err) throw err;
		db.collection('actions').insertMany(insertions, function (err, dbresponse) {
			if (err) throw err;
			db.close();
			res.send('{ success: true }');
		});
	});
});

app.listen(process.env.PORT || 3000, function () {
	console.log('Example app listening on port 3000!');
});