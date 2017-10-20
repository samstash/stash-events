import express from 'express';
import dotenv from 'dotenv';
import mongo from 'mongodb'
import bodyParser from 'body-parser';
import base64 from 'base-64';
import Action from './models/Action';
import cors from 'cors';

// Configure environment.
dotenv.config();

const MongoClient = mongo.MongoClient

MongoClient.connect(process.env.MONGODB_URI, (err, db) => {
	if (err) throw err;

	db.createCollection('actions', (err, res) => {
		if (err) throw err;
		db.close();
	})
});

const app = express();

const corsWhitelist = ['https://app-local.stashinvest.com:57454']

const corsOptions = {
	origin: function (origin, callback) {
		if (corsWhitelist.indexOf(origin) !== -1) {
			callback(null, true)
		} else {
			callback(new Error('Not allowed by CORS'))
		}
	}
}

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '1mb' }));



app.post('/event', function (req, res) {
	
	let data = {};

	if (!req.body || !req.body.data) {
		return res.status(400).send(`{ "success": false, "status": 400, "message": "data is required." }`);
	}
	console.log(base64.decode(req.body.data));
	try {
		data = JSON.parse(base64.decode(req.body.data));
	}
	catch (e) {
		return res.status(400).send(`{ "success": false, "status": 400, "message": "Invalid request" }`);
	}

	if (!data.actions || !Array.isArray(data.actions)) {
		return res.status(400).send(`{ "success": false, "status": 400, "message": "Actions not specified." }`);
	}
	const now = Date.now();

	const insertions = data.actions.map(a => {
		const action = new Action(a, req.headers, now);
		return action.getAction();
	});
	
	MongoClient.connect(process.env.MONGODB_URI, (err, db) => {
		if (err) throw err;
		db.collection('actions').insertMany(insertions, (err, dbresponse) => {
			if (err) throw err;
			db.close();
			res.send('{ success: true }')
		})
	})

});

app.listen(process.env.PORT || 3000, function () {
	console.log('Example app listening on port 3000!')
});