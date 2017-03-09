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

// const transport = nodemailer.createTransport(smtpTransport({
// 	service: 'gmail',
// 	auth: {
// 		user: 'hello@notekeep.io',
// 		pass: 'Notekeep10'
// 	}
// }))

var smtpConfig = {
	service: 'gmail',
	secureConnection: false,
	auth: {
		user: 'hello@notekeep.io',
		pass: 'Notekeep10'
	}
};

var transport = nodemailer.createTransport(smtpConfig);
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
	const sendPasswordReset = transport.templateSender(new EmailTemplate(jt.path('templates/password_reset')), {
		from: '"Notekeep Support" <hello@notekeep.io>',
	})

	sendPasswordReset({
		to: emailOptions.email,
		subject: 'Forgot your password?'
	}, {
		firstname: req.user.firstname,
		lastname: req.user.lastname,
		email: emailOptions.email,
		token: emailOptions.token,
		host: `${req.protocol}://${req.get('host')}`
	}, (err, ret) => {
		if(err){
			 console.log(err);
		} else{
			console.log('Password forgot sent')
		}
	})
}
