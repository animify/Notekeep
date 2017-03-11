const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const notes = require(jt.path('controllers/notes'))
const comments = require(jt.path('controllers/comments'))
const teams = require(jt.path('controllers/teams'))

const cookieParser = require('cookie-parser')
const passport = require('passport')
const passportSocketIo = require('passport.socketio')
const sharedsession = require("express-socket.io-session")
const diff = require('diff')
const _ = require('underscore')

exports.connect = (server, io, sessionStore, eSession) => {
	onAuthorizeSuccess = (data, accept) => {
		log.info('Aunthenticated with socket.io')
		accept()
	}

	onAuthorizeFail = (data, message, error, accept) => {
		log.error('Unauthenticated connection to socket.io: ', data, message)
		error && accept(new Error(message))
	}

	updateNote = (noteID, noteBody, notePlain, teamID) => {
		notes.updateNote(noteID, noteBody, notePlain, teamID, (err, ret) => {
			console.log(err, ret);
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
		let changeQueue = []

		socket.on('change', (chg) => {
			changeQueue.push(chg)
			_.each(changeQueue, (change) => {
				socket.broadcast.to(socket.teamSpace).emit('change', change)
				changeQueue.pop()
			})
		}).on('note-new_comment', (commentID) => {
			comments.findComment(commentID, (err, comment) => {
				if (!err) return socket.broadcast.to(socket.teamSpace).emit('new_comment', comment)
			})
		}).on('preSave', (content) => {
			if (saveTimer) clearTimeout(saveTimer)
			saveTimer = setTimeout(() => {
				updateNote(content._id, content.body, content.plain, socket.teamRaw)
			}, 800)
		}).on('team_join', (data) => {
			if (socket.lastTeamSpace) {
				socket.leave(socket.lastTeamSpace)
				socket.lastTeamSpace = null
			}
			teams.isMember(socket.request.user, data.team, (err, isMember) => {
				if (isMember) {
					socket.teamRaw = data.team
					socket.noteRaw = data.note
					socket.teamSpace = `space-${data.team}_${data.note}`
					socket.join(socket.teamSpace)
					log.info('joined ' + socket.teamSpace)
					socket.lastTeamSpace = socket.teamSpace
				}
			})
		})
	})
}
