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

router.get('/', (req, res) => {
	return res.render('dashboard', {title: 'Dashboard - Notekeep', user: req.user, selected: 'dashboard', light: true})
})

router.get('/notes', (req, res) => {
	return res.render('notes', {title: 'Notes - Notekeep', user: req.user, selected: 'notes', light: true})
})

router.get('/teams', (req, res) => {
	return res.render('teams', {title: 'Teams - Notekeep', user: req.user, selected: 'teams', light: true})
})

router.get('/settings', (req, res) => {
	return res.render('settings', {title: 'Dashboard - Notekeep', user: req.user, light:true})
})

router.get('/activity', (req, res) => {
	return res.render('activity', {title: 'Activity - Notekeep', selected: 'activity', user: req.user, light:true})
})

module.exports = router
