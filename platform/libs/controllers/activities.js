const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const Notes = require(jt.path('model/notes'))
const Team = require(jt.path('model/team'))
const Invite = require(jt.path('model/invite'))
const Activity = require(jt.path('model/activity'))
const auth = require(jt.path('auth/auth'))
const teams = require(jt.path('controllers/teams'))
const account = require(jt.path('controllers/account'))
const moment = require('moment')
const async = require('async')
const _ = require('underscore')

exports.newActivity = (by, to, type, teamID, noteID, callback) => {
	createActivity(by, to, type, teamID, noteID)
	.then((story) => {
		console.log(story)
	})
	.catch((err) => {
		log.error(err)
	})
}

exports.teamActivities = (req, res, limit, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'team': {
			notEmpty: true,
			errorMessage: `Team identifier is empty`
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array())
		}

		const populateQuery = [{path:'by', select:'_id username firstname lastname email'}, {path:'to', select:'_id username firstname lastname email'}, {path: 'team', select: '_id'}, {path: 'note', select: '_id title'}]

		Activity.find({team: req.body.team})
		.sort({created: 'descending'})
		.populate(populateQuery)
		.limit(limit)
		.lean()
		.exec((err, activities) => {
			if (!err) return callback(null, activities)
			callback('500', 'Internal error')
		})
	})
}

exports.userActivities = (req, res, callback) => {

	const populateQuery = [{path:'by', select:'_id username firstname lastname email'}, {path:'to', select:'_id username firstname lastname email'}, {path: 'team', select: '_id'}, {path: 'note', select: '_id title'}]

	split = {}

	teams.findUserTeams(req, res, (err, userTeams) => {
		async.each(userTeams, function (tm, cb) {
			Activity.find({team: tm._id})
			.sort({created: 'descending'})
			.populate(populateQuery)
			.lean()
			.exec((err, activities) => {
				async.each(activities, function (at, cbb) {
					console.log(at);
					timeline = moment(at.created).format("MMMM Do")

					if (!_.isArray(split[timeline]))
						split[timeline] = []

					split[timeline].push(at)
					cbb()
				})

				if (!err) return cb()
				cb('Internal error')
			})
		}, function (err) {
			if (err) return callback(400, err)
			callback(null, split)
		})
	})
}

createActivity = (by, to, type, teamID, noteID) => {
	return new Promise((resolve, reject) => {
		let doc = {}

		doc.by = by || null
		doc.to = to || null
		doc.type = type || null
		doc.teamID = teamID || null
		doc.noteID = noteID || null

		let story = new Activity({
			by: doc.by,
			to: doc.to,
			type: doc.type,
			team: doc.teamID,
			note: doc.noteID
		})

		story.save((err) => {
			if (!err) return resolve(story)
			return reject('Server error')
		})
	})
}
