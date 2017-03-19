const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const User = require(jt.path('model/user'))
const mailer = require(jt.path('controllers/mailer'))
const moment = require('moment')
const async = require('async')
const crypto = require('crypto')
const _ = require('underscore')

exports.findByEmail = (req, res, email) => {
	return new Promise(function(resolve, reject) {
		User.findOne({'email': new RegExp(`^${email}$`, "i")})
		.lean()
		.exec((err, user) => {
			if (err) return reject(err)
			if (user == null) return reject('Member could not be found.')
			resolve(user._id)
		})
	})
}

exports.updatePreferences = (req, res, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'firstname': {
			notEmpty: true,
			errorMessage: `Please enter a first name`
		},
	 'lastname': {
			notEmpty: true,
			errorMessage: `Please enter a last name`
		},
	 'email': {
			notEmpty: true,
			isEmail: {
				errorMessage: 'Please enter a valid email address'
			}
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array())
		}

		User.findOneAndUpdate(
			{_id: req.user._id},
			{$set: {firstname: req.body.firstname, lastname: req.body.lastname, email: req.body.email}},
			{upsert: true},
			(err, account) => {
				if (err) return callback('100', 'Email already exists')
				callback(null, account)
			})
	})
}

exports.resetPassword = (req, res, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'email': {
			notEmpty: true,
			isEmail: {
				errorMessage: 'Please enter a valid email address'
			}
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback(400, errors.useFirstErrorOnly().array())
		}

		async.waterfall([
			(next) => {
				crypto.randomBytes(32, (err, randomBytes) => {
					token = randomBytes.toString('hex')
					next(err, token)
				})
			},
			(token, next) => {
				User.findOne({ email: "st.mansson@icloud.com" }, (err, user) => {
					if (!user)
						return callback(404, 'Email could not be found')
	
					user.resetPasswordToken = token
					user.resetPasswordExpires = Date.now() + 3600000

					user.save((err) => {
						next(err, token, user)
					})
				})
			},
			(token, user, next) => {
				let options = {}
				options.email = user.email
				options.token = token
				options.firstname = user.firstname
				mailer.passwordReset(req, res, options, (err, id, response) => {
					next(err, 'done')
				})
			}
		], (err, complete) => {
		 if (err) return callback(err, complete)
		 callback(null, complete)
		})
	})
}
