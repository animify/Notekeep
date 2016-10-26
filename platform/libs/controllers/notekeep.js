const libs = process.cwd() + '/libs/'
const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')
const Notekeep = require(libs + 'model/notekeep')

const auth = require(libs + 'auth/auth')

exports.newNotekeep = function(req, res, callback) {
	req.sanitizeBody()
	var errors = req.validationErrors()
	if (errors) {
		return callback('500', errors)
	}

	if (req.isAuthenticated()) {
		console.log(req.user);
		var notekeep = new Notekeep({
			owner: req.user._id
		})
	} else {
		var notekeep = new Notekeep({
			owner: 0
		})
	}

	notekeep.save(function (err) {
		if (!err) {
			log.info("New notekeep created with id: %s", notekeep._id);
			return callback(null, notekeep);
		} else {
			if(err.name === 'ValidationError') {
				return callback('400', 'Validation error');
			} else {
				return callback('500', 'Server error');
			}
			log.error('Internal error(%d): %s', '500', err.message);
		}
	});
}

exports.findNotekeep = function(req, res, callback) {
	const populateQuery = [{path:'owner', select:'_id username fullname email'}]

	Notekeep.findOne({'_id': req.params.notekeep})
	.populate(populateQuery)
	.exec((err, notekeep) => {
		if(!notekeep) {
			return callback('400', 'Validation error');
		}
		if (!err) {
			return callback(null, notekeep);
		} else {
			log.error('Internal error(%d): %s', '500' , err.message);
			return callback('500', 'Internal error');
		}
	})
}
