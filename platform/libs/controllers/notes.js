const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const Notes = require(jt.path('model/notes'))
const Group = require(jt.path('model/group'))
const auth = require(jt.path('auth/auth'))
const account = require(jt.path('controllers/account'))
const groups = require(jt.path('controllers/groups'))
const activities = require(jt.path('controllers/activities'))
const comments = require(jt.path('controllers/comments'))
const moment = require('moment')
const async = require('async')
const _ = require('underscore')

let status = {
	0: "Low priority",
	2: "Medium priority",
	3: "High priority"
}

exports.newNoteByEmail = (email, groupID, subject, content) => {
	let note = new Notes({
		owner: null,
		title: null,
		content: null,
		plain: null,
		group: null,
		created: moment().format(),
		draft: false,
		private: false
	})

	account.findByEmail(null, null, email).then((userID) => {
		log.info(`Email by user: ${userID}`)
		note.group = groupID

		let userObj = {_id: userID}

		groups.isMember(userObj, note.group, (err, isMember) => {
			if(isMember) {
				note.owner = userID
				note.title = subject
				note.content = content
				note.plain = content
				note.save().then((createdNote) => {
					console.log(createdNote);
					activities.newActivity(note.owner, null, 'create_note', note.group, createdNote._id)
				})
			}
		})
	}).catch((err) => {
		log.info(`${err} finding user on the system`)
	})
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
	 'group': {
			notEmpty: true
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array())
		}

		if (req.body.group != 0) {
			groups.findGroup(req, res, req.body.group, (err, group) => {
				if (err) return callback('404', [{msg: 'Note could not be published'}])
				saveNote().then((note) => {
					activities.newActivity(req.user._id, null, 'create_note', group[0]._id, note._id)
					return callback(null, note)
				}).catch((err) => {
					return callback('404', err)
				})
			})
		} else {
			saveNote().then((note) => {
				activities.newActivity(req.user._id, null, 'create_note', req.body.group, note._id)
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
				group: req.body.group,
				created: moment().format(),
				draft: drafttype,
				private: (req.body.group == 0) ? true : false
			})

			note.save((err) => {
				if (!err) {
					const populateQuery = [{path:'group', select:'_id color name'}]

					note.populate(populateQuery, function(err) {
						console.log(note);
						if (!err) return resolve(note)
						return reject('Server error')
					})
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

		const populateQuery = [{path:'owner', select:'_id avatar username firstname lastname email'}]

		Notes.findOne({'_id': req.params.note})
		.populate(populateQuery)
		.exec((err, note) => {
			if(!note) return callback('400', 'Validation error')
			if (note.group == "0") return callback(null, [{note:note}])

			if (!err) {
				groups.findGroup(req, res, note.group, (err, group) => {
					if (group[0]._id) {
						return callback(null, [{note:note, group:group[0]}])
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
	 'group': {
			notEmpty: true,
			errorMessage: `Group ID is empty`
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

		const populateQuery = [{path:'owner', select:'_id username firstname lastname email avatar'}, {path: 'group'}]

		Notes.findOne({_id: req.params.note, group: req.params.group, shared: true})
		.populate(populateQuery)
		.exec((err, note) => {
			if(!note) {
				return callback('400', 'Validation error')
			}
			if (!err) {
				note.content = _.unescape(note.content)
				return callback(null, note)
			} else {
				log.error('Internal error(%d): %s', '500' , err.message)
				return callback('500', 'Internal error')
			}
		})
	})
}

exports.findPublishedGroupNotes = (req, res, groupid, callback) => {
	const populateQuery = [{path:'owner', select:'_id username firstname lastname email'}]

	Notes.find({group: groupid, draft: false, private: false})
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

exports.findPrivateNotes = (req, res, callback) => {
	const populateQuery = [{path:'owner', select:'_id username firstname lastname email'}]

	Notes.find({owner: req.user._id, group: "0", draft: false, private: true})
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

exports.findGroupNotes = (req, res, callback) => {
	const populateQuery = [{path:'owner', select:'_id username firstname lastname email'}]

	Group.find({$or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
	.populate({ path: 'creator'})
	.lean()
	.exec((err, groups) => {
		let retrievedNotes = []

		if (err) {
			log.error('Internal error(%d): %s', '500', err.message)
			callback('500', 'Server error! Please try again soon.')
		}

		let groupObj = {}
		async.each(groups, function (tm, cb) {
			Notes.find({group: tm._id, draft: false, private: false})
			.populate(populateQuery)
			.lean()
			.exec((err, notes) => {
				if(notes.length > 0) {
					groupObj[tm._id] = {}
					groupObj[tm._id]._id = tm._id
					groupObj[tm._id].color = tm.color
					groupObj[tm._id].name = tm.name
					groupObj[tm._id].short = tm.name.substr(0, 1)
					groupObj[tm._id].notes = []
					_.each(notes, (note) => {
						groupObj[tm._id].notes.push(note)
						if (notes.indexOf(note) + 1 == notes.length)
							cb()
					})
				} else {
					cb()
				}
			})
		}, function (err) {
			if (err) return callback(400, err.message)
			callback(null, groupObj)
		})
	})
}

exports.findDraftNotes = (req, res, callback) => {
	const populateQuery = [{path:'owner', select:'_id username firstname lastname email'}]

	Group.find({$or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
	.populate({ path: 'creator'})
	.lean()
	.exec((err, groups) => {
		let retrievedNotes = []

		if (err) {
			log.error('Internal error(%d): %s', '500', err.message)
			callback('500', 'Server error! Please try again soon.')
		}

		let groupObj = {}
		async.each(groups, function (tm, cb) {
			Notes.find({group: tm._id, draft: true})
			.populate(populateQuery)
			.lean()
			.exec((err, notes) => {
				if(notes.length > 0) {
					groupObj[tm._id] = {}
					groupObj[tm._id]._id = tm._id
					groupObj[tm._id].color = tm.color
					groupObj[tm._id].name = tm.name
					groupObj[tm._id].short = tm.name.substr(0, 1)
					groupObj[tm._id].notes = []
					_.each(notes, (note) => {
						groupObj[tm._id].notes.push(note)
						if (notes.indexOf(note) + 1 == notes.length)
							cb()
					})
				} else {
					cb()
				}
			})
		}, function (err) {
			if (err) return callback(400, err.message)
			callback(null, groupObj)
		})
	})
}

exports.getRecentNotes = (req, res, callback) => {
	const populateQuery = [{path:'owner', select:'_id username firstname lastname email'}]

	Notes.find({owner: req.user._id, draft: false})
	.populate(populateQuery)
	.sort({updated: -1})
	.lean()
	.exec((err, notes) => {
		if(err) return callback("404", "Notes not found")
		callback(null, notes.splice(0, 7))
	})
}

exports.updateNote = (noteID, noteBody, notePlain, groupID, callback) => {
	if (groupID === undefined) groupID = "0"

	Notes.findOneAndUpdate(
		{_id: noteID, group: groupID},
		{$set: {content: noteBody, plain: notePlain}},
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
	 'group': {
			notEmpty: true,
			errorMessage: `Group ID is empty`
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
		Group.findOne({_id: req.body.group, $or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
		.lean()
		.exec((err, group) => {
			if (group == null) return callback(400, "Group not found")
			Notes.findOneAndUpdate(
				{_id: req.body.note, group: req.body.group},
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
	 'group': {
			notEmpty: true,
			errorMessage: `Group ID is empty`
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array())
		}
		Group.findOne({_id: req.body.group, $or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
		.lean()
		.exec((err, group) => {
			if (group == null) return callback(400, "Group not found")
			Notes.findOneAndUpdate(
				{_id: req.body.note, group: req.body.group},
				{$set: {shared: true}},
				{upsert: true},
				(err, note) => {
					if (note.shared) return callback('100', 'Note is already shared')
					const shareURL = `${req.protocol}://${req.get('host')}/shard/${req.body.group}/${req.body.note}`
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
	 'group': {
			notEmpty: true,
			errorMessage: `Group ID is empty`
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array())
		}
		Group.findOne({_id: req.body.group, 'creator':req.user._id})
		.lean()
		.exec((err, group) => {
			if (group == null) return callback(400, "Group not found")
			Notes.findOneAndRemove(
				{_id: req.body.note, group: req.body.group},
				(err, sts) => {
					if (err) return callback('400', err)
					comments.deleteForGroup(req.body.group)
					activities.newActivity(req.user._id, null, 'delete_note', req.body.group, sts._id)
					callback(null, true)
				})
		})
	})
}
