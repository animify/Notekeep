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
	connection.db.collection("sessions", (err, collection) => {
		collection.find({"session.passport.user._id": req.user._id}).toArray((err, sessions) => {
			if (sessions.length == 0) return callback(101, "No sessions")
			callback(null, sessions)
		})
	})
}
