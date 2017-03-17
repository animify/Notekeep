const express = require('express')
const router = express.Router()
const passport = require('passport')
const mongoose = require('mongoose')
const crypto = require('crypto')
const jetpack = require('fs-jetpack')
const geoip = require("geoip-lite")
const countries = require('country-data').countries

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const db = require(jt.path('db/mongoose'))
const config = require(jt.path('config'))
const User = require(jt.path('model/user'))
const notesController = require(jt.path('controllers/notes'))

router.post('/signup', (req, res) => {
	req.sanitizeBody()
	req.checkBody({
		'username' :{
			notEmpty: true,
			errorMessage: 'username: Choose a username you want to go by'
		},
		'firstname' :{
			notEmpty: true,
			errorMessage: 'firstname: We need your firstname'
		},
		'lastname' :{
			notEmpty: true,
			errorMessage: 'lastname: We also need your lastname'
		},
		'email' :{
			notEmpty: true,
			isEmail: {
				errorMessage: 'email: That#&39;s not an email'
			},
			errorMessage: 'email: An email is pretty important'
		},
		'password' :{
			notEmpty: true,
			isLength: {
				options: [{ min: 6 }],
				errorMessage: 'password: A password needs to be at least 6 characters'
			},
			errorMessage: 'password: No good without a password!'
		},
		'repassword' :{
			notEmpty: true,
			errorMessage: 'repassword: That isn&#39;t the password you entered above!'
		}
	})

	const errors = req.validationErrors()

	if (errors) {
		return res.send(errors)
	} else {
		if (req.body.password == req.body.repassword) {
			let geoAddr = geoip.lookup('109.246.253.155') //TEST
			geoAddr.cName = countries[geoAddr.country].name
			let newid = mongoose.Types.ObjectId()
			let user = new User()
			// geoAddr = geoip.lookup(req.ip) PRODUCTION

			user._id = newid
			user.avatar = crypto.createHash('md5').update(req.body.username).digest("hex")
			user.username = req.body.username
			user.firstname = req.body.firstname
			user.lastname = req.body.lastname
			user.email = req.body.email
			user.password = req.body.password
			user.ip_address = req.ip
			user.useragent = req.useragent
			user.location.country = geoAddr.cName
			user.location.code = geoAddr.country
			user.location.city = geoAddr.city

			user.save((err, user) => {
				if(!err) {
					req.login(user, function(err) {
						if (err) return res.json({err})
						return res.json({status: 'OK', statusCode : 200})
					})

				} else {
					return res.json({ error: '404', message : err })
				}
			})

		} else {
			return res.json({error: '404', message : 'Passwords do not match'})
		}
	}
})

router.get('/shard/:group/:note', (req, res) => {
	let isLogged = null
	if (req.isAuthenticated()) isLogged = req.user

	notesController.findShard(req, res, (err, ret) => {
		return res.render('shared-note', {title: 'Notes - Notekeep', note: ret, user: isLogged, light: true, shard: true})
	})
})

router.post('/signin', passport.authenticate('local'), (req, res) => {
	return res.json({status: 'OK', statusCode : 200})
})

router.get('/signin', (req, res) => {
	return res.render('signin', {title: 'Sign in - Notekeep', gradient: 'true'})
})

router.get('/signup', (req, res) => {
	return res.render('signup', {title: 'Sign up - Notekeep', gradient: 'true'})
})

module.exports = router
