const mongoose = require('mongoose')
const	Schema = mongoose.Schema
const User = require('./user')
const shortid = require('shortid')
const Group = require('./group')

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
	group: {
		type: String,
		required: true,
		ref: 'Group'
	},
	created: {
		type: Date,
		default: Date.now
	}
})

module.exports = mongoose.model('Invite', Invite)
