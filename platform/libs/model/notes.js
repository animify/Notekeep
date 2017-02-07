const mongoose = require('mongoose')
const Schema = mongoose.Schema
const shortid = require('shortid')
const User = require('./user')
const Team = require('./team')

let	Note = new Schema({
	_id: {
		type: String,
		'default': shortid.generate
	},
	owner: {
		type: String,
		required: true,
		ref: 'User'
	},
	team: {
		type: String,
		trim: true
	},
	title : {
		type: String
	},
	draft : {
		type: Boolean,
		default: true,
		required: true
	},
	content : {
		type: String
	},
	plain : {
		type: String
	},
	created: {
		type: Date
	},
	updated: {
		type: Date,
		default: Date.now
	},
	private: {
		type: Boolean,
		default: false,
		required: true
	}
})

module.exports = mongoose.model('Note', Note)
