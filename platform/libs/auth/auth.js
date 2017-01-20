const passport = require('passport')
const LocalStategy = require('passport-local')
const BasicStrategy = require('passport-http').BasicStrategy
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy
const BearerStrategy = require('passport-http-bearer').Strategy
const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')

const config = require(jt.path('config'))

const User = require(jt.path('model/user'))
const Client = require(jt.path('model/client'))
const AccessToken = require(jt.path('model/accessToken'))
const RefreshToken = require(jt.path('model/refreshToken'))

passport.use('local', new LocalStategy((email, password, done) => {
		User.findOne({'email': new RegExp('^'+email+'$', "i")})
		.exec((err, user) => {
			if (err) {
				return done(err)
			}

			if (!user) {
				return done(null, false, { message: 'Unknown user' })
			}

			if (!user.checkPassword(password))
				return done(null, false, { message: 'Incorrect password' })

			return done(null, user)
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

exports.isAuthenticated = passport.authenticate('local', { session : true })
exports.isOauthAuthenticated = passport.authenticate('bearer', { session : false })
