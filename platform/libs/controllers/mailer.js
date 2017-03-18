const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const User = require(jt.path('model/user'))
const moment = require('moment')
const async = require('async')
const _ = require('underscore')
const nodemailer = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')
const EmailTemplate = require('email-templates').EmailTemplate

const transport = nodemailer.createTransport(smtpTransport({
	service: 'gmail',
	auth: {
		user: 'hello@notekeep.io',
		pass: 'Activ8r42'
	}
}))

exports.sendemail = (req, res, callback) => {
	transport.sendMail({
		from: "hello@notekeep.io",
		to: 'st.mansson@icloud.com',
		subject: 'test',
		html: '<p>NodeJS</p>'
	}, (err, responseStatus) => {
		if(responseStatus)
		callback(err, responseStatus)
	})
}

exports.passwordReset = (req, res, emailOptions, callback) => {
	const passwordReset = new EmailTemplate(jt.path('templates/password_reset'), {
		juiceOptions: {
			preserveImportant: true
		}
	})

	let toUser = {
		firstname: emailOptions.firstname,
		lastname: emailOptions.lastname,
		email: emailOptions.email,
		token: emailOptions.token,
		host: `${req.protocol}://${req.get('host')}`
	}

	passwordReset.render(toUser, function (err, result) {
		let mailOptions = {
			from: '"Notekeep Support" <hello@notekeep.io>',
			to: toUser.email,
			subject: "Password Reset",
			text: result.text,
			html: result.html
		}

		transport.sendMail(mailOptions, (error, info) => {
			if (error)return console.log(error)
			console.log('Message %s sent: %s', info.messageId, info.response)
			callback(null, info.messageId, info.response)
		})
	})
}
