var libs = process.cwd() + '/libs/'
var log = require(libs + 'logs/log')(module);
var config = require(libs + 'config')

var file = require(libs + 'model/file')

var errors = require('errors');
var request = require('request').defaults({ encoding: null })

exports.pushFile = function(req, res, key, callback) {

	req.sanitizeBody()
	req.checkBody({
		'aid': {
			notEmpty: true,
			errorMessage: 'AID not provided'
		},
		'filekey': {
			notEmpty: true,
			isLength: {
				options: [{ max: 12 }],
				errorMessage: 'No file key provided'
			},
			errorMessage: 'No file key provided'
		}
	})

	var errors = req.validationErrors()

	if (errors) {
		return res.send(errors)
	} else {

	}
}
