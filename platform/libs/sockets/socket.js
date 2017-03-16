const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const notes = require(jt.path('controllers/notes'))
const comments = require(jt.path('controllers/comments'))
const groups = require(jt.path('controllers/groups'))

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
		log.error('Unauthenticated connection to socket.io: ')
		error && accept(new Error(message))
	}

	updateNote = (noteID, noteBody, notePlain, groupID) => {
		notes.updateNote(noteID, noteBody, notePlain, groupID, (err, ret) => {
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
				socket.broadcast.to(socket.groupSpace).emit('change', change)
				changeQueue.pop()
			})
		}).on('note-new_comment', (commentID) => {
			comments.findComment(commentID, (err, comment) => {
				if (!err) return socket.broadcast.to(socket.groupSpace).emit('new_comment', comment)
			})
		}).on('preSave', (content) => {
			if (saveTimer) clearTimeout(saveTimer)
			saveTimer = setTimeout(() => {
				updateNote(content._id, content.body, content.plain, socket.groupRaw)
			}, 800)
		}).on('group_join', (data) => {
			if (socket.lastGroupSpace) {
				socket.leave(socket.lastGroupSpace)
				socket.lastGroupSpace = null
			}
			groups.isMember(socket.request.user, data.group, (err, isMember) => {
				if (isMember) {
					socket.groupRaw = data.group
					socket.noteRaw = data.note
					socket.groupSpace = `space-${data.group}_${data.note}`
					socket.join(socket.groupSpace)
					log.info('joined ' + socket.groupSpace)
					socket.lastGroupSpace = socket.groupSpace
				}
			})
		})
	})
}
