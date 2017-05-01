const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const User = require(jt.path('model/user'))
const notes = require(jt.path('controllers/notes'))
const moment = require('moment')
const async = require('async')
const _ = require('underscore')
const nodemailer = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')
const EmailTemplate = require('email-templates').EmailTemplate
const MailListener = require("mail-listener2")

const transport = nodemailer.createTransport(smtpTransport({
	service: 'gmail',
	auth: {
		user: config.get('gsuiteEmail'),
		pass: config.get('gsuitePass')
	}
}))

const mailListener = new MailListener({
	username: config.get('gsuiteEmail'),
	password: config.get('gsuitePass'),
	host: "imap.gmail.com",
	port: 993,
	tls: true,
	connTimeout: 10000,
	authTimeout: 5000,
	// debug: console.log,
	tlsOptions: { rejectUnauthorized: false },
	mailbox: "INBOX",
	searchFilter: ["UNSEEN"],
	markSeen: true,
	mailParserOptions: {streamAttachments: true},
	attachments: true,
	attachmentOptions: { directory: "attachments/" }
})

mailListener.start()

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
			from: 'Notekeep.io <hello@notekeep.io>',
			to: toUser.email,
			subject: "Password Reset",
			text: result.text,
			html: result.html
		}

		transport.sendMail(mailOptions, (error, info) => {
			if (error) return console.log(error)
			console.log('Message %s sent: %s', info.messageId, info.response)
			callback(null, info.messageId, info.response)
		})
	})
}

exports.sendNote = (req, res, emailOptions, callback) => {
	const sendNote = new EmailTemplate(jt.path('templates/send_note'), {
		juiceOptions: {
			preserveImportant: true
		}
	})

	let toUser = {
		firstname: emailOptions.firstname,
		lastname: emailOptions.lastname,
		email: emailOptions.email,
		fromEmail: emailOptions.from,
		content: emailOptions.noteContents,
		plain: emailOptions.notePlain,
		title: emailOptions.noteTitle
	}

	sendNote.render(toUser, function (err, result) {
		let mailOptions = {
			from: 'Notekeep.io <hello@notekeep.io>',
			to: toUser.email,
			subject: "Someone has sent you a note!",
			text: result.text,
			html: result.html
		}

		transport.sendMail(mailOptions, (error, info) => {
			if (error) return console.log(error)
			console.log('Message %s sent: %s', info.messageId, info.response)
			callback(null, info.messageId, info.response)
		})
	})
}

mailListener.on("server:connected", function(){
	log.info("Connected to GSuite IMAP server")
})

mailListener.on("server:disconnected", function(){
	log.info("Disconnected to GSuite IMAP server")
})

mailListener.on("error", function(err){
	log.debug(err)
})

mailListener.on("mail", (mail, seqno, attributes) => {
	const groupID = mail.to[0].address.match(/^([^@]*)@/)[1]
	console.log("subject", mail.subject)
	console.log("byEmail", mail.from[0].address)
	console.log("toGroup", groupID)
	console.log("byName", mail.from[0].name)
	console.log("text", mail.text)
	notes.newNoteByEmail(mail.from[0].address, groupID, mail.subject, mail.text)
})
