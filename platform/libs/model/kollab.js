const mongoose = require('mongoose')
const Schema = mongoose.Schema
const shortid = require('shortid')

var	Notekeep = new Schema({
		_id: {
			type: String,
			'default': shortid.generate
		},
		owner: {
			type: String,
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
			default: false,
			required: true
		}
	});


module.exports = mongoose.model('Notekeep', Notekeep);
