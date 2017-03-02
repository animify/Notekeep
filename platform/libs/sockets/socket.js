const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const notes = require(jt.path('controllers/notes'))

const cookieParser = require('cookie-parser')
const passport = require('passport')
const passportSocketIo = require('passport.socketio')
const sharedsession = require("express-socket.io-session")
const diff = require('diff')

exports.connect = (server, io, sessionStore, eSession) => {
	onAuthorizeSuccess = (data, accept) => {
		log.info('Aunthenticated with socket.io')
		accept()
	}

	onAuthorizeFail = (data, message, error, accept) => {
		log.error('Unauthenticated connection to socket.io: ', data, message)
		error && accept(new Error(message))
	}

	updateNote = (noteID, noteBody, teamID) => {
		notes.updateNote(noteID, noteBody, teamID, (err, ret) => {
			log.info('saved')
		})
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

	io.on('connection', (socket) => {
		log.info('Connected to socket.io')
		let saveTimer = false

		socket.on('change', (chg) => {
			socket.broadcast.to(socket.teamSpace).emit('change', chg);
		})
		socket.on('preSave', (content) => {
			if (saveTimer) clearTimeout(saveTimer)
			saveTimer = setTimeout(() => {
				updateNote(content._id, content.body, socket.teamSpaceRaw)
			}, 800)
		})

		socket.on('note_join', (data) => {
			if (socket.lastTeamSpace) {
				socket.leave(socket.lastTeamSpace)
				socket.lastTeamSpace = null
			}
			socket.teamSpaceRaw = data.space
			socket.teamSpace = 'teamspace_' + data.space
			console.log('room', socket.teamSpace)
			socket.join(socket.teamSpace)
			socket.lastTeamSpace = socket.teamSpace
		})
	})
}
