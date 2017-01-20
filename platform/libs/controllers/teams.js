const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const Team = require(jt.path('model/team'))
const Notes = require(jt.path('model/notes'))
const auth = require(jt.path('auth/auth'))
const randomColor = require('randomcolor')

exports.newTeam = (req, res, callback) => {
	req.sanitizeBody()
	req.checkBody({
		'name' :{
			notEmpty: true,
			isLength: {
				options: [{ max: 30 }],
				errorMessage: 'Team name can only be up to 30 characters long'
			}
		}
	})

	let errors = req.validationErrors()
	if (errors) return callback('500', errors)

	let team = new Team({
		name: req.body.name,
		color: randomColor(),
		creator: req.user._id
	})

	team.save((err) => {
		if (!err) {
			log.info("New team created with id: %s", team._id)
			return callback(null, team)
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
