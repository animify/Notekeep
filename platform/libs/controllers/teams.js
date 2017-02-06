const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const Team = require(jt.path('model/team'))
const Notes = require(jt.path('model/notes'))
const auth = require(jt.path('auth/auth'))
const randomColor = require('randomcolor')

exports.newTeam = (req, res, name, callback) => {
	req.sanitizeBody()
	req.checkBody({
		'name' :{
			notEmpty: true,
			isLength: {
				options: [{ min: 6 }],
				errorMessage: 'A team name needs to be at least 6 characters long.'
			},
			isLength: {
				options: [{ max: 30 }],
				errorMessage: 'A team name can only be 30 characters long.'
			}
		}
	})

	let errors = req.validationErrors()
	if (errors) return callback('500', errors)

	let team = new Team({
		name: name,
		color: randomColor(),
		creator: req.user._id
	})

	team.save((err) => {
		if (!err) {
			log.info("New team created with id: %s", team._id)
			return callback(null, team)
		} else {
			if(err.name === 'ValidationError') {
				return callback('400', 'There was an error validating your team name.')
			} else {
				return callback('500', 'Server error! Please try again soon.')
			}
			log.error('Internal error(%d): %s', '500', err.message)
		}
	})
}

exports.findUserTeams = (req, res, callback) => {
	Team.find({$or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
	.populate({ path: 'creator'})
	.lean()
	.exec((err, teams) => {
		if (!err) return callback(null, teams)

		log.error('Internal error(%d): %s', '500',err.message)
		callback('500', 'Server error! Please try again soon.')
	})
}

exports.findTeam = (req, res, teamid, callback) => {
	Team.find({_id: teamid, $or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
	.populate({ path: 'creator',
		populate: {
			path: 'userlist',
			model: 'User'
		}
	})
	.lean()
	.exec((err, team) => {
		if (!err && !(team.length == 0)) {
			return callback(null, team)
		} else {
			return callback('404', 'Team could not be found')
		}

		return callback('500', 'Internal server error')
		log.error('Internal error(%d): %s', '500', err.message)
	})
}
