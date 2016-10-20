var mongoose = require('mongoose');
var	Schema = mongoose.Schema;

var	File = new Schema({
		filename: {
			type: String,
			required: true
		},
		owner: {
			type: String,
			required: true
		},
		updated: {
			type: Date,
			default: Date.now
		},
		lastname: {
			type: String,
			required: true
		},
		private: {
			type: Boolean,
			default: false,
			required: true
		}
	});


module.exports = mongoose.model('File', File);
