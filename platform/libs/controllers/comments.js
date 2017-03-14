const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const Notes = require(jt.path('model/notes'))
const Group = require(jt.path('model/group'))
const Invite = require(jt.path('model/invite'))
const Activity = require(jt.path('model/activity'))
const Comment = require(jt.path('model/comment'))
const auth = require(jt.path('auth/auth'))
const groups = require(jt.path('controllers/groups'))
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
	 'group': {
			notEmpty: true,
			errorMessage: `No group ID`
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

		execNewComment(req.user._id, req.body.content, req.body.group, req.body.note)
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

exports.deleteForGroup = (group) => {
	Comment.remove({group: group}, (err) => {
		log.info(`group: ${group}`);
		if (err) info.debug('500', `Error deleting comments for group: ${group}`)
	})
}

exports.getComments = (req, res, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'group': {
			notEmpty: true,
			errorMessage: `No group ID`
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

		const populateQuery = [{path:'creator', select:'_id username avatar firstname lastname email'}, {path: 'group', select: '_id name'}, {path: 'note', select: '_id title'}]

		Comment.find({group: req.body.group, note: req.body.note})
		.sort({created: 'descending'})
		.populate(populateQuery)
		.lean()
		.exec((err, comments) => {
			if (!err) return callback(null, comments)
			callback('500', 'Internal error')
		})
	})
}

execNewComment = (creator, content, groupID, noteID) => {
	return new Promise((resolve, reject) => {

		const populateQuery = [{path:'creator', select:'_id username avatar firstname lastname email'}]

		let comm = new Comment({
			creator: creator,
			content: content,
			group: groupID,
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
