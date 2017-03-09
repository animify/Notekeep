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

exports.updatePreferences = (req, res, callback) => {
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
			return callback('100', errors.useFirstErrorOnly().array())
		}

		async.waterfall([
			(cb) => {
				crypto.randomBytes(20, (err, byteBuffer) => {
					const _token = byteBuffer.toString('hex')
					cb(err, _token)
				})
			},
			(_token, cb) => {
				User.findOne({'email': new RegExp(`^${req.body.email}$`, "i")}, (err, user) => {
					if (!user) return callback('404', 'Email could not be found')

					user.resetPasswordToken = _token
					user.resetPasswordExpires = Date.now() + 86400

					user.save((err) => {
						cb(err, _token, user)
					})
				})
			},
			(_token, user, cb) => {
				let o = {}
				o.token = _token
				o.firstname = user.firstname
				o.lastname = user.lastname
				o.email = user.email
				o.host = `${req.protocol}://${req.get('host')}`
				mailer.passwordReset(req, res, o, function(err) {
					cb(err, 'cb')
				})
			}
		], (err) => {
		 if (err) return next(err)
		})

	})
}
