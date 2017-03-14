const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const Notes = require(jt.path('model/notes'))
const Group = require(jt.path('model/group'))
const Invite = require(jt.path('model/invite'))
const Activity = require(jt.path('model/activity'))
const auth = require(jt.path('auth/auth'))
const groups = require(jt.path('controllers/groups'))
const account = require(jt.path('controllers/account'))
const moment = require('moment')
const async = require('async')
const _ = require('underscore')

exports.newActivity = (by, to, type, groupID, noteID, callback) => {
	createActivity(by, to, type, groupID, noteID)
	.then((story) => {
		console.log(story)
	})
	.catch((err) => {
		log.error(err)
	})
}

exports.groupActivities = (req, res, limit, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'group': {
			notEmpty: true,
			errorMessage: `Group identifier is empty`
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array())
		}

		const populateQuery = [{path:'by', select:'_id username firstname lastname email'}, {path:'to', select:'_id username firstname lastname email'}, {path: 'group', select: '_id name'}, {path: 'note', select: '_id title'}]

		Activity.find({group: req.body.group})
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

exports.userTimelineActivities = (req, res, listed, callback) => {

	const populateQuery = [{path:'by', select:'_id username firstname lastname email'}, {path:'to', select:'_id username firstname lastname email'}, {path: 'group', select: '_id name'}, {path: 'note', select: '_id title'}]

	let timeline = {}

	groups.findUserGroups(req, res, (err, userGroups) => {
		async.each(userGroups, function (tm, cb) {
			Activity.find({group: tm._id})
			.populate(populateQuery)
			.lean()
			.limit(50)
			.exec((err, activities) => {
				console.log(activities);
				if (!listed) {
					if (activities.length > 0) {
						async.each(activities, function (at, cbb) {
							const dataStruct = moment(at.created).format("MMMM Do")

							if (!_.isArray(timeline[dataStruct]))
								timeline[dataStruct] = []

							timeline[dataStruct].push(at)
							cbb()
						})
					}
				} else {
					if (!_.isArray(timeline['recent']))
						timeline['recent'] = []

					if (activities.length > 0) {
						async.each(activities, function (at, cbb) {
							timeline['recent'].push(at)
							cbb()
						})
					}
				}

				if (!err) return cb()
				cb('Internal error')
			})
		}, function (err) {
			if (err) return callback(400, err)
			if (listed) {
				timeline.recent.sort((a,b) => {
					if (a.created < b.created) return 1
				})
				timeline.recent = timeline.recent.splice(0, 9)
			}
			callback(null, timeline)
		})
	})
}

createActivity = (by, to, type, groupID, noteID) => {
	return new Promise((resolve, reject) => {
		let doc = {}

		doc.by = by || null
		doc.to = to || null
		doc.type = type || null
		doc.groupID = groupID || null
		doc.noteID = noteID || null

		let story = new Activity({
			by: doc.by,
			to: doc.to,
			type: doc.type,
			group: doc.groupID,
			note: doc.noteID
		})

		story.save((err) => {
			if (!err) return resolve(story)
			return reject('Server error')
		})
	})
}
