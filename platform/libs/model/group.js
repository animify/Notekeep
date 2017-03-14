const mongoose = require('mongoose')
const Schema = mongoose.Schema
const shortid = require('shortid')
const User = require('./user')

let	Group = new Schema({
	_id: {
		type: String,
		'default': shortid.generate
	},
	color: {
		type: String
	},
	name: {
		type: String,
		required: true,
		trim: true
	},
	creator: {
		type: String,
		required: true,
		ref: 'User'
	},
	created_at: {
		type: Date,
		default: Date.now
	},
	modified_at: {
		type: Date,
		default: Date.now
	},
	userlist: {
		type: Array,
		ref: 'User'
	}
})

module.exports = mongoose.model('Group', Group)
