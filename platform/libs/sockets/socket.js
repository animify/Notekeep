const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))

const cookieParser = require('cookie-parser')
const passport = require('passport')
const passportSocketIo = require('passport.socketio')
const sharedsession = require("express-socket.io-session")

exports.connect = (server, io, sessionStore, eSession) => {
	onAuthorizeSuccess = (data, accept) => {
		log.info('Aunthenticated with socket.io')
		accept()
	}

	onAuthorizeFail = (data, message, error, accept) => {
		log.error('Unauthenticated connection to socket.io: ', data, message)
		error && accept(new Error(message))
	}

	io.use(sharedsession(eSession))
	io.use(passportSocketIo.authorize({
			passport: passport,
			cookieParser: cookieParser,
			key: 'connect.sid',
			secret: 'secret',
			store: sessionStore,
			success: onAuthorizeSuccess,
			fail: onAuthorizeFail
	}))

	io.on('connection', function (socket) {
		log.info('Connected to socket.io')
		socket.on('note_join', (data) => {
			if (socket.lastNoteSpace) {
				socket.leave(socket.lastNoteSpace)
				socket.lastNoteSpace = null
			}
			socket.noteSpace = 'notespace_' + data.space
			console.log('room', socket.noteSpace)
			socket.join(socket.noteSpace)
			socket.lastNoteSpace = socket.noteSpace
		})
	})
}
