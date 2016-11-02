const express = require('express')
const router = express.Router()
const passport = require('passport')
const mongoose = require('mongoose')
const crypto = require('crypto')

const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const db = require(libs + 'db/mongoose')
const config = require(libs + 'config')
const User = require(libs + 'model/user')
const notekeep = require(libs + 'controllers/notekeep')

router.get('/dashboard', (req, res) => {
	return res.render('dashboard', {title: 'Dashboard - Notekeep', user: req.user})
})
router.get('/settings', (req, res) => {
	return res.render('settings', {title: 'Dashboard - Notekeep', user: req.user, light:true})
})

module.exports = router
