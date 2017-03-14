const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const Notes = require(jt.path('model/notes'))
const Team = require(jt.path('model/team'))
const Invite = require(jt.path('model/invite'))
const Activity = require(jt.path('model/activity'))
const Comment = require(jt.path('model/comment'))
const auth = require(jt.path('auth/auth'))
const teams = require(jt.path('controllers/teams'))
const account = require(jt.path('controllers/account'))
const moment = require('moment')
const async = require('async')
const _ = require('underscore')

exports.newComment = (req, res, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'content': {
			notEmpty: true,
			errorMessage: `No comment content`
		},
	 'team': {
			notEmpty: true,
			errorMessage: `No team ID`
		},
	 'note': {
			notEmpty: true,
			errorMessage: `No note ID`
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array()[0].msg)
		}

		execNewComment(req.user._id, req.body.content, req.body.team, req.body.note)
		.then((comment) => {
			return callback(null, comment)
		})
		.catch((err) => {
			callback('500', 'Server error! Please try again soon.')
		})
	})
}

exports.findComment = (commentID, callback) => {
	const populateQuery = [{path:'creator', select:'_id username avatar firstname lastname email'}]

	Comment.findOne({_id: commentID})
	.populate(populateQuery)
	.lean()
	.exec((err, comment) => {
		console.log(err, comment);
		if (!err && comment != null) return callback(null, comment)
		callback('500', 'Internal error')
	})
}

exports.deleteForTeam = (team) => {
	Comment.remove({team: team}, (err) => {
		log.info(`team: ${team}`);
		if (err) info.debug('500', `Error deleting comments for team: ${team}`)
	})
}

exports.getComments = (req, res, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'team': {
			notEmpty: true,
			errorMessage: `No team ID`
		},
	 'note': {
			notEmpty: true,
			errorMessage: `No note ID`
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array()[0].msg)
		}

		const populateQuery = [{path:'creator', select:'_id username avatar firstname lastname email'}, {path: 'team', select: '_id name'}, {path: 'note', select: '_id title'}]

		Comment.find({team: req.body.team, note: req.body.note})
		.sort({created: 'descending'})
		.populate(populateQuery)
		.lean()
		.exec((err, comments) => {
			if (!err) return callback(null, comments)
			callback('500', 'Internal error')
		})
	})
}

execNewComment = (creator, content, teamID, noteID) => {
	return new Promise((resolve, reject) => {

		const populateQuery = [{path:'creator', select:'_id username avatar firstname lastname email'}]

		let comm = new Comment({
			creator: creator,
			content: content,
			team: teamID,
			note: noteID
		})

		comm.save((err) => {
			comm.populate(populateQuery, function(err) {
			 if (!err) return resolve(comm)
			 return reject('Server error')
			});
		})
	})
}
