const mongoose = require('mongoose')
const	Schema = mongoose.Schema
const User = require('./user')
const Group = require('./group')
const Note = require('./notes')

let	Comment = new Schema({
	creator: {
		type: String,
		ref: 'User',
		required: true
	},
	content: {
		type: String
	},
	group: {
		type: String,
		ref: 'Group',
		required: true
	},
	note: {
		type: String,
		ref: 'Note',
		required: true
	},
	created: {
		type: Date,
		default: Date.now
	}
})

module.exports = mongoose.model('Comment', Comment)
