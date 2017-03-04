const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')
const	Schema = mongoose.Schema
const User = require('./user')
const Team = require('./team')
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
	team: {
		type: String,
		ref: 'Team'
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
