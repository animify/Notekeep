const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const Notes = require(jt.path('model/notes'))
const auth = require(jt.path('auth/auth'))

exports.newNote = (req, res, callback) => {
	req.sanitizeBody()
	let errors = req.validationErrors()
	if (errors) {
		return callback('500', errors)
	}

	if (req.isAuthenticated()) {
		let notekeep = new Notes({
			owner: req.user._id
		})
	} else {
		let notekeep = new Notes({
			owner: 0
		})
	}

	notekeep.save((err) => {
		if (!err) {
			log.info("New notekeep created with id: %s", notekeep._id)
			return callback(null, notekeep)
		} else {
			if(err.name === 'ValidationError') {
				return callback('400', 'Validation error')
			} else {
				return callback('500', 'Server error')
			}
			log.error('Internal error(%d): %s', '500', err.message)
		}
	})
}

exports.findNote = (req, res, callback) => {
	const populateQuery = [{path:'owner', select:'_id username fullname email'}]

	Notes.findOne({'_id': req.params.note})
	.populate(populateQuery)
	.exec((err, notekeep) => {
		if(!notekeep) {
			return callback('400', 'Validation error')
		}
		if (!err) {
			return callback(null, notekeep)
		} else {
			log.error('Internal error(%d): %s', '500' , err.message)
			return callback('500', 'Internal error')
		}
	})
}
