const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const Notes = require(jt.path('model/notes'))
const auth = require(jt.path('auth/auth'))
const teams = require(jt.path('controllers/teams'))
const moment = require('moment')
const _ = require('underscore')

exports.newNote = (req, res, drafttype, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'title': {
			notEmpty: true,
			isLength: {
				options: [{ min: 2, max: 30 }],
				errorMessage: 'Note title must be between 2 and 30 chars long'
			},
			errorMessage: `You'll need to enter a title for this note`
		},
	 'content': {
			notEmpty: true,
			errorMessage: `Why make a note with no content?!`
		},
	 'team': {
			notEmpty: true
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			console.log(errors);
			return callback('100', errors.useFirstErrorOnly().array())
		}

		if (req.body.team != 0) {
			teams.findTeam(req, res, req.body.team, (err, team) => {
				if (err) return callback('404', [{msg: 'Note could not be published'}])
				saveNote().then((note) => {
					return callback(null, note)
				}).catch((err) => {
					return callback('404', err)
				})
			})
		} else {
			saveNote().then((note) => {
				return callback(null, note)
			}).catch((err) => {
				return callback('404', err)
			})
		}

	})

	let saveNote = () => {
		return new Promise(function(resolve, reject) {
			let note = new Notes({
				owner: req.user._id,
				title: req.body.title,
				content: req.body.content,
				plain: req.body.plain,
				team: req.body.team,
				created: moment().format(),
				draft: drafttype,
				private: (req.body.team == 0) ? true : false
			})

			note.save((err) => {
				if (!err) {
					log.info("New note created with id: %s", note._id)
					return resolve(note)
				} else {
					if(err.name === 'ValidationError') {
						return reject('Validation error')
					} else {
						return reject('Server error')
					}
					log.error('Internal error(%d): %s', '500', err.message)
				}
			})
		})

	}

}

exports.findNote = (req, res, callback) => {

	req.sanitizeParams()
	req.checkParams({
	 'note': {
			notEmpty: true,
			errorMessage: `Note ID is empty`
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array())
		}

		const populateQuery = [{path:'owner', select:'_id username firstname lastname email'}]

		Notes.findOne({'_id': req.params.note})
		.populate(populateQuery)
		.exec((err, note) => {
			if(!note) {
				return callback('400', 'Validation error')
			}
			if (!err) {
				teams.findTeam(req, res, note.team, (err, team) => {
					if (team[0]._id) {
						return callback(null, [{note:note, team:team[0]}])
					}

					return callback('400', 'Validation error')
				})
			} else {
				log.error('Internal error(%d): %s', '500' , err.message)
				return callback('500', 'Internal error')
			}
		})
	})
}

exports.findPublishedTeamNotes = (req, res, teamid, callback) => {
	const populateQuery = [{path:'owner', select:'_id username firstname lastname email'}]

	Notes.find({team: teamid, draft: false, private: false})
	.populate(populateQuery)
	.exec((err, notes) => {
		if(!notes) {
			return callback('400', 'Validation error')
		}
		if (!err) {
			return callback(null, notes)
		} else {
			log.error('Internal error(%d): %s', '500' , err.message)
			return callback('500', 'Internal error')
		}
	})
}
