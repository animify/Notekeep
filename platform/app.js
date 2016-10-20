const express = require('express')
const app = express()
const fs = require('fs')
const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')

const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))

const passport = require('passport')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const request = require('request').defaults({ encoding: null })
const session = require('express-session')
const mongoStore = require('connect-mongo')(session)
const validator = require('express-validator')

const db = require(jt.path('db/mongoose'))
const root = require(jt.path('routes/root'))
const endpoint = require(jt.path('routes/endpoint'))
const authcontroller = require(jt.path('auth/auth'))
const oauth2 = require(jt.path('auth/oauth2'))
const User = require(jt.path('model/user'))

const sessionStore = new mongoStore({ mongooseConnection: db.connection })

const eSession = session({
	key: 'connect.sid',
	secret: 'secret',
	store: sessionStore,
	resave: true,
	saveUninitialized: true
})

app.use(eSession)
app.use(express.static("libs/public"))
app.use(bodyParser())

app.use(passport.initialize())
app.use(passport.session())

app.use(validator({
	customValidators: {
		isArray: (value) => {
			return Array.isArray(value)
		},
		onlyLetters: (str) => {
			return /^\w+$/.test(str)
		}
 }
}))

app.use(validator({
	errorFormatter: (param, msg, value) => {
		let namespace = param.split('.')
		let root = namespace.shift()
		let formParam = root

		while(namespace.length) {
			formParam += '[' + namespace.shift() + ']'
		}
		return {
			parameter: formParam,
			description: msg
		}
	}
}))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

app.set('port', process.env.PORT || config.get('port') || 80)
app.set('views', jt.path('views/modules'))
app.set('view engine', 'pug')
app.set('view options', { layout: false })

app.use('/', root)
app.use('/facets/endpoints', endpoint)

app.listen(app.get('port'), () => {
	log.info('Notekeep running on port' + app.get('port'))
})
