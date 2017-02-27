const express = require('express')
const router = express.Router()
const passport = require('passport')
const mongoose = require('mongoose')
const crypto = require('crypto')
const jetpack = require('fs-jetpack')

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
			let newid = mongoose.Types.ObjectId()
			let user = new User()

			user._id = newid
			user.username = req.body.username
			user.firstname = req.body.firstname
			user.lastname = req.body.lastname
			user.email = req.body.email
			user.password = req.body.password

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

router.post('/signin', passport.authenticate('local'), (req, res) => {
	return res.json({status: 'OK', statusCode : 200})
})

router.get('/signin', (req, res) => {
	return res.render('signin', {title: 'Sign in - Apse', gradient: 'true'})
})

router.get('/signup', (req, res) => {
	return res.render('signup', {title: 'Sign up - Apse', gradient: 'true'})
})

module.exports = router
