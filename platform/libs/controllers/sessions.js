const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const User = require(jt.path('model/user'))
const moment = require('moment')
const async = require('async')
const _ = require('underscore')

exports.userSessions = (req, res, callback) => {
	const connection = req.app.get('connection')
	connection.db.collection("sessions", function(err, collection){
		console.log(req.user.username);
		collection.find({"session.passport.user._id": req.user._id}).toArray((err, data) => {
			session = data[0]
			if (data.length == 0) return callback(101, "No sessions")
			console.log('data', session)
			callback(null, session.session.passport)
		})
	})
}
