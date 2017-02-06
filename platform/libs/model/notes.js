const mongoose = require('mongoose')
const Schema = mongoose.Schema
const shortid = require('shortid')
const User = require('./user')

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
	updated: {
		type: Date,
		default: Date.now
	},
	private: {
		type: Boolean,
		default: true,
		required: true
	}
})


module.exports = mongoose.model('Note', Note)
