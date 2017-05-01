const express = require('express')
const router = express.Router()
const passport = require('passport')
const mongoose = require('mongoose')
const	crypto = require('crypto')
const	async = require('async')
const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const db = require(jt.path('db/mongoose'))
const config = require(jt.path('config'))
const User = require(jt.path('model/user'))
const notesController = require(jt.path('controllers/notes'))
const groupsController = require(jt.path('controllers/groups'))
const activitiesController = require(jt.path('controllers/activities'))
const accountController = require(jt.path('controllers/account'))
const commentsController = require(jt.path('controllers/comments'))
const mailer = require(jt.path('controllers/mailer'))
const sessions = require(jt.path('controllers/sessions'))

//POST: PUBLISH A NOTE
router.post('/notes/publish', (req, res) => {
	notesController.newNote(req, res, false, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send({Message: ret})
	})
})

//GET: GET NOTE DATA
router.get('/notes/get/:note', (req, res) => {
	notesController.findNote(req, res, (err, ret) => {
		if (err) return res.send({error: err, message: 'Internal Error'})
		res.send(ret)
	})
})

//TEST SEND MAIL
router.get('/sendmail', (req, res) => {
	o = {}
	o.email = ["st.mansson@icloud.com", "stefan.aotik@gmail.com"]
	o.token = "1234"
	o.firstname = "Stefan"
	mailer.passwordReset(req, res, o, (err, id, response) => {
		res.json([{id: id}, {res: response}])
	})
})

//POST: DELETE NOTE
router.post('/notes/delete', (req, res) => {
	notesController.deleteNote(req, res, (err, ret) => {
		if (err) return res.send({error: err, message: 'Internal Error'})
		res.send(ret)
	})
})

//POST: UPDATE NOTE STATUS
router.post('/notes/status', (req, res) => {
	notesController.updateStatus(req, res, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send(ret)
	})
})

//POST: CREATE SHARE LINK AND PUBLICISE
router.post('/notes/share', (req, res) => {
	notesController.shareNote(req, res, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send(ret)
	})
})

//POST: GET ACTIVITIES PER GROUP
router.post('/activities/group', (req, res) => {
	activitiesController.groupActivities(req, res, 10, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send(ret)
	})
})

//GET: RETRIEVE ACTIVITIES
router.get('/activities/all/:listed?', (req, res) => {
	let listed = false
	if (req.params.listed == "true") listed = true

	activitiesController.userTimelineActivities(req, res, listed, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send(ret)
	})
})

//GET: GET USER SESSIONS
router.get('/account/sessions', (req, res) => {
	sessions.userSessions(req, res, (err, ret) => {
		res.send(ret)
	})
})

//GET: FIND NOTES BY TYPE
router.get('/notes/retrieve/:type', (req, res) => {
	switch (req.params.type) {
		case 'group':
			notesController.findGroupNotes(req, res, (err, ret) => {
				if (err) return res.send({error: err, message: 'Internal Error'})
				res.send(ret)
			})
			break
		case 'draft':
			notesController.findDraftNotes(req, res, (err, ret) => {
				if (err) return res.send({error: err, message: 'Internal Error'})
				res.send(ret)
			})
			break
		case 'private':
			notesController.findPrivateNotes(req, res, (err, ret) => {
				if (err) return res.send({error: err, message: 'Internal Error'})
				res.send(ret)
			})
			break
		default:
			res.send('error')
	}
})

//POST: CREATE NEW GROUP
router.post('/groups/new', (req, res) => {
	if (req.body.name === null || req.body.name == '') res.send({Error: 404, Message: 'No group name found.'})

	groupsController.newGroup(req, res, req.body.name, (err, ret) => {
		if (err) return res.send({error: err, message: ret[0].description})
		res.send({group: ret, fn: req.user.firstname, ln: req.user.lastname})
	})
})

//POST: SEND GROUP INVITE
router.post('/groups/invite', (req, res) => {
	if (req.body.name === null || req.body.name == '') res.send({Error: 404, Message: 'No group name found.'})

	groupsController.inviteToGroup(req, res, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send(ret)
	})
})

//POST: ACCEPT GROUP INVITE
router.post('/invites/accept', (req, res) => {
	if (req.body.group === null || req.body.group == '') res.send({Error: 404, Message: 'No group name found.'})

	groupsController.acceptInvite(req, res, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send(ret)
	})
})

//POST: DECLINE GROUP INVITE
router.post('/invites/decline', (req, res) => {
	if (req.body.group === null || req.body.group == '') res.send({Error: 404, Message: 'No group name found.'})

	groupsController.declineInvite(req, res, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send(ret)
	})
})

//POST: FIND GROUP DATA
router.post('/groups/find', (req, res) => {
	if (req.body.group === null || req.body.group == '') res.send({Error: 404, Message: 'No group found.'})

	groupsController.findGroup(req, res, req.body.group, (err, group) => {
		if (err) return res.send({error: err})
		res.send({group: group})
	})
})

//POST: UPDATE ACCOUNT DETAILS
router.post('/account/update', (req, res) => {
	accountController.updatePreferences(req, res, (err, account) => {
		if (err) return res.send({error: err, message: account})
		res.send(account)
	})
})

//POST: POST A NEW COMMENT FOR NOTE
router.post('/comments/new', (req, res) => {
	commentsController.newComment(req, res, (err, comment) => {
		if (err) return res.send({error: err, message: comment})
		res.send(comment)
	})
})

//POST: GET COMMENTS FOR NOTE
router.post('/comments/get', (req, res) => {
	commentsController.getComments(req, res, (err, comments) => {
		if (err) return res.send({error: err, message: comments})
		res.send(comments)
	})
})

//POST: FORGOT PASSWORD SETUP
router.post('/forgot', (req, res) => {
	accountController.resetPassword(req, res, (err, status) => {
		if (err) return res.json({error: err, message: status})
		res.json({status: 200, message: status})
	})
})

//POST: FORGOT PASSWORD SETUP
router.post('/mail/note', (req, res) => {
	notesController.sendNote(req, res, (err, status) => {
		if (err) return res.json({error: err, message: status})
		res.json({status: 200, message: status})
	})
})

module.exports = router
