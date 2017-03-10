const express = require('express')
const router = express.Router()
const passport = require('passport')
const mongoose = require('mongoose')
const	crypto = require('crypto')
const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const db = require(jt.path('db/mongoose'))
const config = require(jt.path('config'))
const User = require(jt.path('model/user'))
const notesController = require(jt.path('controllers/notes'))
const teamsController = require(jt.path('controllers/teams'))
const activitiesController = require(jt.path('controllers/activities'))
const accountController = require(jt.path('controllers/account'))
const commentsController = require(jt.path('controllers/comments'))
const mailer = require(jt.path('controllers/mailer'))

router.post('/notes/publish', (req, res) => {
	notesController.newNote(req, res, false, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send({Message: ret})
	})
}).get('/notes/get/:note', (req, res) => {
	notesController.findNote(req, res, (err, ret) => {
		if (err) return res.send({error: err, message: 'Internal Error'})
		res.send(ret)
	})
}).get('/sendmail', (req, res) => {
	o = {}
	o.email = "st.mansson@icloud.com"
	o.token = "1234"
	mailer.passwordReset(req, res, o, (err, ret) => {
		console.log(err,ret);
	})
}).post('/notes/delete', (req, res) => {
	notesController.deleteNote(req, res, (err, ret) => {
		if (err) return res.send({error: err, message: 'Internal Error'})
		res.send(ret)
	})
}).post('/notes/status', (req, res) => {
	notesController.updateStatus(req, res, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send(ret)
	})
}).post('/notes/share', (req, res) => {
	notesController.shareNote(req, res, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send(ret)
	})
}).post('/activities/team', (req, res) => {
	activitiesController.teamActivities(req, res, 10, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send(ret)
	})
}).get('/activities/all/:listed?', (req, res) => {
	let listed = false
	if (req.params.listed == "true") listed = true

	activitiesController.userTimelineActivities(req, res, listed, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send(ret)
	})
}).get('/notes/retrieve/:type', (req, res) => {
	switch (req.params.type) {
		case 'team':
			notesController.findTeamNotes(req, res, (err, ret) => {
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
}).post('/teams/new', (req, res) => {
	if (req.body.name === null || req.body.name == '') res.send({Error: 404, Message: 'No team name found.'})

	teamsController.newTeam(req, res, req.body.name, (err, ret) => {
		if (err) return res.send({error: err, message: ret[0].description})
		res.send({team: ret, fn: req.user.firstname, ln: req.user.lastname})
	})
}).post('/teams/invite', (req, res) => {
	if (req.body.name === null || req.body.name == '') res.send({Error: 404, Message: 'No team name found.'})

	teamsController.inviteToTeam(req, res, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send(ret)
	})
}).post('/invites/accept', (req, res) => {
	if (req.body.team === null || req.body.team == '') res.send({Error: 404, Message: 'No team name found.'})

	teamsController.acceptInvite(req, res, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send(ret)
	})
}).post('/invites/decline', (req, res) => {
	if (req.body.team === null || req.body.team == '') res.send({Error: 404, Message: 'No team name found.'})

	teamsController.declineInvite(req, res, (err, ret) => {
		if (err) return res.send({error: err, message: ret})
		res.send(ret)
	})
}).post('/teams/find', (req, res) => {
	if (req.body.team === null || req.body.team == '') res.send({Error: 404, Message: 'No team found.'})

	teamsController.findTeam(req, res, req.body.team, (err, team) => {
		if (err) return res.send({error: err})
		res.send({team: team})
	})
}).post('/account/update', (req, res) => {
	accountController.updatePreferences(req, res, (err, account) => {
		if (err) return res.send({error: err, message: account})
		res.send(account)
	})
}).post('/comments/new', (req, res) => {
	commentsController.newComment(req, res, (err, comment) => {
		if (err) return res.send({error: err, message: comment})
		res.send(comment)
	})
}).post('/comments/get', (req, res) => {
	commentsController.getComments(req, res, (err, comments) => {
		if (err) return res.send({error: err, message: comments})
		res.send(comments)
	})
})

module.exports = router
