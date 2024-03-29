const mongoose = require('mongoose')
const	Schema = mongoose.Schema
const User = require('./user')

let	File = new Schema({
	filename: {
		type: String,
		required: true
	},
	owner: {
		type: String,
		required: true,
		ref: 'User'
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


module.exports = mongoose.model('File', File)
