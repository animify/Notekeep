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

router.post('/notes/new', (req, res) => {
	notesController.newNote(req, res, (err, ret) => {
		if (err) return res.send({Error: err})
		res.send({Message: ret})
	})
})

router.post('/teams/new', (req, res) => {
	if (req.body.name === null || req.body.name == '') res.send({Error: 404, Message: 'No team name found.'})

	teamsController.newTeam(req, res, req.body.name, (err, ret) => {
		if (err) return res.send({error: err, message: ret[0].description})
		res.send({team: ret, fn: req.user.firstname, ln: req.user.lastname})
	})
})

router.post('/teams/find', (req, res) => {
	if (req.body.team === null || req.body.team == '') res.send({Error: 404, Message: 'No team found.'})

	teamsController.findTeam(req, res, req.body.team, (err, team) => {
		if (err) return res.send({error: err})
		res.send({team: team})
	})
})

module.exports = router
