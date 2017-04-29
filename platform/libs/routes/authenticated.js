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
const groupsController = require(jt.path('controllers/groups'))
const async = require('async')

router.get('/', (req, res) => {
	return res.render('dashboard', {title: 'Dashboard - Notekeep', user: req.user, selected: 'dashboard', light: true})
})

router.get('/notes/:note?', (req, res) => {
	groupsController.findUserGroups(req, res, (err, groups) => {
		async.eachOf(groups, (group, key, cb) => {
			notesController.findPublishedGroupNotes(req, res, group._id, (err, notes) => {
				groups[key].notes = notes
				cb()
			})
		}, (err) => {
			return res.render('notes', {title: 'Notes - Notekeep', groups: groups, user: req.user, selected: 'notes', light: true, selected: req.params.note})
		})
	})
})

router.get('/groups', (req, res) => {
	groupsController.findUserGroups(req, res, (err, groups) => {
		if (err) return res.redirect('/')
		res.render('groups', {title: 'Groups - Notekeep', user: req.user, selected: 'groups', groups: groups, light: true})
	})
})

router.get('/invites', (req, res) => {
	async.parallel({
		pending: (callback) => {
			groupsController.findUserInvites(req, res, (err, invites) => {
				callback(err, invites)
			})
		},
		sent: (callback) => {
			groupsController.findSentInvites(req, res, (err, invites) => {
				callback(err, invites)
			})
		}
	}, (err, invites) => {
		if (err) return res.redirect('/')
		res.render('invites', {title: 'Invites - Notekeep', user: req.user, selected: 'invites', invites: invites, light: true})
	})
})

router.get('/group/:group', (req, res) => {
	groupsController.findGroup(req, res, req.params.group, (err, group) => {
		if (err) return res.redirect('/')
		res.render('group', {title: 'Group - Notekeep', user: req.user, selected: 'group', group: group, light: true})
	})
})

router.get('/settings', (req, res) => {
	return res.render('settings', {title: 'Dashboard - Notekeep', user: req.user, light:true})
})

router.get('/activity', (req, res) => {
	return res.render('activity', {title: 'Activity - Notekeep', selected: 'activity', user: req.user, light:true})
})

router.get('/signout', (req, res) => {
	req.logout()
	res.redirect('/')
})

module.exports = router
