const passport = require('passport')
const LocalStategy = require('passport-local')
const BasicStrategy = require('passport-http').BasicStrategy
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy
const BearerStrategy = require('passport-http-bearer').Strategy

const libs = process.cwd() + '/libs/'

const config = require(libs + 'config')

const User = require(libs + 'model/user')
const Client = require(libs + 'model/client')
const AccessToken = require(libs + 'model/accessToken')
const RefreshToken = require(libs + 'model/refreshToken')

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
		function(clientId, clientSecret, done) {
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

								var info = { scope: '*' }
								done(null, user, info)
						})
				})
		}
))

exports.isAuthenticatedLocal = (req, res, callback) => {
	if (req.isAuthenticated()) {
		// if (!req.user.workspace && req.originalUrl != '/workspaces/new')
			// return res.redirect('/workspaces/new')
		callback(null, true)
	} else {
		res.redirect('/signin')
	}
}

exports.isAuthenticated = passport.authenticate('local', { session : true })
exports.isOauthAuthenticated = passport.authenticate('bearer', { session : false })