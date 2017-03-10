const mongoose = require('mongoose')
const	Schema = mongoose.Schema
const User = require('./user')
const Team = require('./team')
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
	team: {
		type: String,
		ref: 'Team',
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
