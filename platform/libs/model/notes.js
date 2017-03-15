const mongoose = require('mongoose')
const Schema = mongoose.Schema
const shortid = require('shortid')
const User = require('./user')
const Group = require('./group')

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
	group: {
		type: String,
		trim: true,
		ref: 'Group'
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
	status : {
		type: Number,
		Default: 0
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
	shared: {
		type: Boolean,
		default: false,
		required: true
	},
	private: {
		type: Boolean,
		default: false,
		required: true
	}
})

module.exports = mongoose.model('Note', Note)
