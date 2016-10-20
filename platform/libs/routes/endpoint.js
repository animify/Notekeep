var express = require('express')
var router = express.Router()
var passport = require('passport')
var mongoose = require('mongoose')
var	crypto = require('crypto')

var libs = process.cwd() + '/libs/'
var log = require(libs + 'logs/log')(module)
var db = require(libs + 'db/mongoose')
var config = require(libs + 'config')
var User = require(libs + 'model/user')
var notekeep = require(libs + 'controllers/notekeep')

router.post('/newnotekeep', function(req, res) {
	notekeep.newNotekeep(req, res, function(err, ret) {
		if (err)
			return res.send({Error: err})

		return res.send({Message: ret})
	});
})

module.exports = router
