const mongoose = require('mongoose')
const	Schema = mongoose.Schema
const User = require('./user')
const shortid = require('shortid')
const Team = require('./team')

let	Invite = new Schema({
	_id: {
		type: String,
		'default': shortid.generate
	},
	by: {
		type: String,
		required: true,
		ref: 'User'
	},
	to: {
		type: String,
		required: true,
		ref: 'User'
	},
	team: {
		type: String,
		required: true,
		ref: 'Team'
	},
	created: {
		type: Date,
		default: Date.now
	}
})

module.exports = mongoose.model('Invite', Invite)
