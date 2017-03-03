const express = require('express')
const router = express.Router()
const passport = require('passport')
const mongoose = require('mongoose')
const crypto = require('crypto')
const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const db = require(jt.path('db/mongoose'))
const config = require(jt.path('config'))
const User = require(jt.path('model/user'))
const notesController = require(jt.path('controllers/notes'))
const teamsController = require(jt.path('controllers/teams'))
const async = require('async')

router.get('/', (req, res) => {
	return res.render('dashboard', {title: 'Dashboard - Notekeep', user: req.user, selected: 'dashboard', light: true})
})

router.get('/notes', (req, res) => {
	teamsController.findUserTeams(req, res, (err, teams) => {
		async.eachOf(teams, (team, key, cb) => {
			notesController.findPublishedTeamNotes(req, res, team._id, (err, notes) => {
				teams[key].notes = notes
				cb()
			})
		}, (err) => {
			return res.render('notes', {title: 'Notes - Notekeep', teams: teams, user: req.user, selected: 'notes', light: true})
		})
	})
})

router.get('/teams', (req, res) => {
	teamsController.findUserTeams(req, res, (err, teams) => {
		if (err) return res.redirect('/')
		res.render('teams', {title: 'Teams - Notekeep', user: req.user, selected: 'teams', teams: teams, light: true})
	})
})

router.get('/invites', (req, res) => {
	async.parallel({
		pending: (callback) => {
			teamsController.findUserInvites(req, res, (err, invites) => {
				callback(err, invites)
			})
		},
		sent: (callback) => {
			teamsController.findSentInvites(req, res, (err, invites) => {
				callback(err, invites)
			})
		}
	}, (err, invites) => {
		if (err) return res.redirect('/')
		res.render('invites', {title: 'Invites - Notekeep', user: req.user, selected: 'invites', invites: invites, light: true})
	})
})

router.get('/team/:team', (req, res) => {
	teamsController.findTeam(req, res, req.params.team, (err, team) => {
		if (err) return res.redirect('/')
		res.render('team', {title: 'Team - Notekeep', user: req.user, selected: 'team', team: team, light: true})
	})
})

router.get('/settings', (req, res) => {
	return res.render('settings', {title: 'Dashboard - Notekeep', user: req.user, light:true})
})

router.get('/activity', (req, res) => {
	return res.render('activity', {title: 'Activity - Notekeep', selected: 'activity', user: req.user, light:true})
})

module.exports = router
