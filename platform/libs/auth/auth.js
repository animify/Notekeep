const passport = require('passport')
const LocalStategy = require('passport-local')
const BasicStrategy = require('passport-http').BasicStrategy
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy
const BearerStrategy = require('passport-http-bearer').Strategy
const jetpack = require('fs-jetpack')
const geoip = require("geoip-lite")
const countries = require('country-data').countries

const jt = jetpack.cwd('./libs/')

const config = require(jt.path('config'))

const User = require(jt.path('model/user'))
const Client = require(jt.path('model/client'))
const AccessToken = require(jt.path('model/accessToken'))
const RefreshToken = require(jt.path('model/refreshToken'))

passport.use('local', new LocalStategy({passReqToCallback: true}, (req, email, password, done) => {
		User.findOne({'email': new RegExp('^'+email+'$', "i")})
		.exec((err, user) => {
			if (err) return done(err)

			if (!user)
				return done(null, false, { message: 'Unknown user' })

			if (!user.checkPassword(password))
				return done(null, false, { message: 'Incorrect password' })

			let geoAddr = geoip.lookup('109.246.253.155')
			geoAddr.cName = countries[geoAddr.country].name

			User.findOneAndUpdate({ _id: user._id},
				{$set: {
					useragent: [req.useragent],
					location: {
						country: geoAddr.cName,
						code: geoAddr.country,
						city: geoAddr.city
					}
				}},
				{ new: true },
				(err, updatedUser) => {
					return done(null, updatedUser)
			})

		})
	}
))

passport.use(new BasicStrategy(
	(username, password, done) => {
		Client.findOne({ clientId: username }, (err, client) => {
			if (err) {
				return done(err)
			}

			if (!client) {
				return done(null, false)
			}

			if (client.clientSecret !== password) {
				return done(null, false)
			}

			return done(null, client)
		})
	}
))

passport.use(new ClientPasswordStrategy(
	(clientId, clientSecret, done) => {
		Client.findOne({ clientId: clientId }, (err, client) => {
			if (err) {
				return done(err)
			}

			if (!client) {
				return done(null, false)
			}

			if (client.clientSecret !== clientSecret) {
				return done(null, false)
			}

			return done(null, client)
		})
	}
))

passport.use(new BearerStrategy(
	(accessToken, done) => {
		AccessToken.findOne({ token: accessToken }, (err, token) => {
			if (err) {
				return done(err)
			}

			if (!token) {
				return done(null, false)
			}

			if(Math.round((Date.now()-token.created)/1000) > config.get('security:tokenLife')) {

					AccessToken.remove({ token: accessToken }, (err) => {
						if (err) {
							return done(err)
						}
					})

					return done(null, false, { message: 'Token expired' })
			}

			User.findById(token.userId, (err, user) => {

				if (err) {
					return done(err)
				}

				if (!user) {
					return done(null, false, { message: 'Unknown user' })
				}

				let info = { scope: '*' }
				done(null, user, info)
			})
		})
	}
))

exports.isAuthenticatedLocal = (req, res, callback) => {
	if (req.isAuthenticated()) {
		callback(null, true)
	} else {
		res.redirect('/signin')
	}
}

exports.authenticateEndpoint = (req, res, callback) => {
	if (req.isAuthenticated()) {
		callback(null, true)
	} else {
		passport.authenticate('bearer', { session : false })
	}
}

exports.isAuthenticated = passport.authenticate('local', { session : true })
exports.isOauthAuthenticated = passport.authenticate('bearer', { session : false })
