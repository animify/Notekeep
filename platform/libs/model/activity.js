const mongoose = require('mongoose')
const	Schema = mongoose.Schema
const User = require('./user')
const Group = require('./group')
const Note = require('./notes')

let	Activity = new Schema({
	by: {
		type: String,
		ref: 'User',
		required: true
	},
	to: {
		type: String,
		ref: 'User'
	},
	type: {
		type: String
	},
	group: {
		type: String,
		ref: 'Group'
	},
	note: {
		type: String,
		ref: 'Note'
	},
	created: {
		type: Date,
		default: Date.now
	}
})

module.exports = mongoose.model('Activity', Activity)
