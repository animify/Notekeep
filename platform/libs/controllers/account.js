const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const User = require(jt.path('model/user'))
const moment = require('moment')
const async = require('async')
const _ = require('underscore')

exports.findByEmail = (req, res, email) => {
	return new Promise(function(resolve, reject) {
		User.findOne({'email': new RegExp('^'+email+'$', "i")})
		.lean()
		.exec((err, user) => {
			if (err) return reject(err)
			if (user == null) return reject('Member could not be found.')
			resolve(user._id)
		})
	})
}
