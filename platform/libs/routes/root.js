const express = require('express')
const router = express.Router()
const passport = require('passport')
const mongoose = require('mongoose')
const crypto = require('crypto')

const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const db = require(libs + 'db/mongoose')
const config = require(libs + 'config')
const User = require(libs + 'model/user')
const notekeep = require(libs + 'controllers/notekeep')

const stripe = require("stripe")(config.get("stripe:key"))

router.get('/', function(req, res) {
	return res.render('root', {title: 'Notekeep'})
})

router.get('/signin', function(req, res) {
	return res.render('signin', {title: 'Sign in - Apse', gradient: 'true'})
})

router.get('/signup', function(req, res) {
	return res.render('signup', {title: 'Sign up - Apse', gradient: 'true'})
})

router.get('/dashboard', function(req, res) {
	return res.render('dashboard', {title: 'Dashboard'})
})

router.post('/signup', function(req, res) {
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
			errorMessage: 'lastname: What also need your lastname'
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

	var errors = req.validationErrors()

	if (errors) {
		return res.send(errors)
	} else {
		if (req.body.password == req.body.repassword) {
			var newid = mongoose.Types.ObjectId()

			stripe.customers.create({
				email: req.body.email,
				metadata: {'userID' : newid.toString(), 'fullname' : `${req.body.firstname} ${req.body.lastname}` }
			}, function(err, customer) {
				if (err)
					return res.json({ error: '404', message :  err })

				var user = new User()
				user._id = newid
				user.username = req.body.username
				user.firstname = req.body.firstname
				user.lastname = req.body.lastname
				user.email = req.body.email
				user.password = req.body.password
				user.plan.customer = customer.id

				user.save(function(err, user) {
					if(!err) {
							passport.authenticate('local')(req, res, function () {
								return res.send({'status': 'OK', 'statusCode' : '200'})
							})
					} else {
						return res.json({ error: '404', message : err })
					}
				})
			})

		} else {
			return res.json({error: '404', message : 'Passwords do not match'})
		}
	}
})

router.get('/:notekeep', function(req, res) {
	notekeep.findNotekeep(req, res, function(err, ret) {
		if (err)
			return res.redirect('/')

		return res.render('notekeep', {title: 'Found'})
	})

})

router.post('/signin', passport.authenticate('local'), function(req, res) {
	return res.json({status:"OK"})
})



module.exports = router
