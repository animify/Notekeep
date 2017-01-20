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
	teamsController.newTeam(req, res, (err, ret) => {
		if (err) return res.send({Error: err})
		console.log(ret);
		res.send({Message: ret})
	})
})

module.exports = router
