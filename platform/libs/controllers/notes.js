const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const Notes = require(jt.path('model/notes'))
const Team = require(jt.path('model/team'))
const auth = require(jt.path('auth/auth'))
const teams = require(jt.path('controllers/teams'))
const activities = require(jt.path('controllers/activities'))
const moment = require('moment')
const async = require('async')
const _ = require('underscore')

let status = {
	0: "Low priority",
	2: "Medium priority",
	3: "High priority"
}

exports.newNote = (req, res, drafttype, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'title': {
			notEmpty: true,
			isLength: {
				options: [{ min: 2, max: 30 }],
				errorMessage: 'Note title must be between 2 and 30 chars long'
			},
			errorMessage: `Your note needs to have a title`
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
					activities.newActivity(req.user._id, null, 'create_note', team[0]._id, note._id)
					return callback(null, note)
				}).catch((err) => {
					return callback('404', err)
				})
			})
		} else {
			saveNote().then((note) => {
				activities.newActivity(req.user._id, null, 'create_note', req.body.team, note._id)
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
					return resolve(note)
				} else {
					if(err.name === 'ValidationError') {
						return reject('Validation error')
					} else {
						return reject('Server error')
					}
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

exports.findShard = (req, res, callback) => {

	req.sanitizeParams()
	req.checkParams({
	 'team': {
			notEmpty: true,
			errorMessage: `Team ID is empty`
		},
	 'note': {
			notEmpty: true,
			errorMessage: `Note ID is empty`
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array())
		}

		const populateQuery = [{path:'owner', select:'_id username firstname lastname email'}, {path: 'team'}]

		Notes.findOne({_id: req.params.note, team: req.params.team, shared: true})
		.populate(populateQuery)
		.exec((err, note) => {
			if(!note) {
				return callback('400', 'Validation error')
			}
			if (!err) {
				return callback(null, note)
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

exports.findTeamNotes = (req, res, callback) => {
	const populateQuery = [{path:'owner', select:'_id username firstname lastname email'}]

	Team.find({$or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
	.populate({ path: 'creator'})
	.lean()
	.exec((err, teams) => {
		let retrievedNotes = []

		if (err) {
			log.error('Internal error(%d): %s', '500', err.message)
			callback('500', 'Server error! Please try again soon.')
		}

		let teamObj = {}
		async.each(teams, function (tm, cb) {
			Notes.find({team: tm._id, draft: false, private: false})
			.populate(populateQuery)
			.lean()
			.exec((err, notes) => {
				if(notes.length > 0) {
					teamObj[tm._id] = {}
					teamObj[tm._id]._id = tm._id
					teamObj[tm._id].color = tm.color
					teamObj[tm._id].name = tm.name
					teamObj[tm._id].short = tm.name.substr(0, 1)
					teamObj[tm._id].notes = []
					_.each(notes, (note) => {
						teamObj[tm._id].notes.push(note)
						if (notes.indexOf(note) + 1 == notes.length)
							cb()
					})
				} else {
					cb()
				}
			})
		}, function (err) {
			if (err) return callback(400, err.message)
			callback(null, teamObj)
		})
	})
}

exports.findDraftNotes = (req, res, callback) => {
	const populateQuery = [{path:'owner', select:'_id username firstname lastname email'}]

	Team.find({$or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
	.populate({ path: 'creator'})
	.lean()
	.exec((err, teams) => {
		let retrievedNotes = []

		if (err) {
			log.error('Internal error(%d): %s', '500', err.message)
			callback('500', 'Server error! Please try again soon.')
		}

		let teamObj = {}
		async.each(teams, function (tm, cb) {
			Notes.find({team: tm._id, draft: true})
			.populate(populateQuery)
			.lean()
			.exec((err, notes) => {
				if(notes.length > 0) {
					teamObj[tm._id] = {}
					teamObj[tm._id]._id = tm._id
					teamObj[tm._id].color = tm.color
					teamObj[tm._id].name = tm.name
					teamObj[tm._id].short = tm.name.substr(0, 1)
					teamObj[tm._id].notes = []
					_.each(notes, (note) => {
						teamObj[tm._id].notes.push(note)
						if (notes.indexOf(note) + 1 == notes.length)
							cb()
					})
				} else {
					cb()
				}
			})
		}, function (err) {
			if (err) return callback(400, err.message)
			callback(null, teamObj)
		})
	})
}

exports.updateNote = (noteID, noteBody, teamID, callback) => {
	Notes.findOneAndUpdate(
		{_id: noteID, team: teamID},
		{$set: {content: noteBody}},
		{upsert: true, new: true},
		(err, doc) => {
			callback(null, doc)
		})
}

exports.updateStatus = (req, res, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'note': {
			notEmpty: true,
			errorMessage: `Note ID is empty`
		},
	 'team': {
			notEmpty: true,
			errorMessage: `Team ID is empty`
		},
	 'status': {
			notEmpty: true,
			errorMessage: `Status is empty`
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array())
		}
		Team.findOne({_id: req.body.team, $or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
		.lean()
		.exec((err, team) => {
			if (team == null) return callback(400, "Team not found")
			Notes.findOneAndUpdate(
				{_id: req.body.note, team: req.body.team},
				{$set: {status: req.body.status}},
				{upsert: true, new: true},
				(err, note) => {
					callback(null, note)
				})
		})
	})
}

exports.shareNote = (req, res, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'note': {
			notEmpty: true,
			errorMessage: `Note ID is empty`
		},
	 'team': {
			notEmpty: true,
			errorMessage: `Team ID is empty`
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array())
		}
		Team.findOne({_id: req.body.team, $or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
		.lean()
		.exec((err, team) => {
			if (team == null) return callback(400, "Team not found")
			Notes.findOneAndUpdate(
				{_id: req.body.note, team: req.body.team},
				{$set: {shared: true}},
				{upsert: true},
				(err, note) => {
					if (note.shared) return callback('100', 'Note is already shared')
					const shareURL = `${req.protocol}://${req.get('host')}/shard/${req.body.team}/${req.body.note}`
					callback(null, shareURL)
				})
		})
	})
}

exports.deleteNote = (req, res, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'note': {
			notEmpty: true,
			errorMessage: `Note ID is empty`
		},
	 'team': {
			notEmpty: true,
			errorMessage: `Team ID is empty`
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array())
		}
		Team.findOne({_id: req.body.team, 'creator':req.user._id})
		.lean()
		.exec((err, team) => {
			if (team == null) return callback(400, "Team not found")
			Notes.findOneAndRemove(
				{_id: req.body.note, team: req.body.team},
				(err, sts) => {
					if (err) return callback('400', err)
					callback(null, true)
				})
		})
	})
}
