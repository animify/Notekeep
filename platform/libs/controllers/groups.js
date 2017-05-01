const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const Group = require(jt.path('model/group'))
const Notes = require(jt.path('model/notes'))
const Invite = require(jt.path('model/invite'))
const invites = require(jt.path('controllers/invites'))
const randomColor = require('randomcolor')
const _ = require('underscore')

exports.newGroup = (req, res, name, callback) => {
	req.sanitizeBody()
	req.checkBody({
		'name' :{
			notEmpty: true,
			isLength: {
				options: [{ min: 6 }],
				errorMessage: 'A group name needs to be at least 6 characters long.'
			},
			isLength: {
				options: [{ max: 30 }],
				errorMessage: 'A group name can only be 30 characters long.'
			}
		}
	})

	let errors = req.validationErrors()
	if (errors) return callback('500', errors)

	let group = new Group({
		name: name,
		color: randomColor(),
		creator: req.user._id
	})

	group.save((err) => {
		if (!err) {
			return callback(null, group)
		} else {
			if(err.name === 'ValidationError') {
				return callback('400', 'There was an error validating your group name.')
			} else {
				return callback('500', 'Server error! Please try again soon.')
			}
			log.error('Internal error(%d): %s', '500', err.message)
		}
	})
}

exports.findUserGroups = (req, res, callback) => {
	Group.find({$or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
	.populate({ path: 'creator'})
	.lean()
	.exec((err, groups) => {
		if (!err) return callback(null, groups)

		log.error('Internal error(%d): %s', '500',err.message)
		callback('500', 'Server error! Please try again soon.')
	})
}

exports.isMember = (user, groupID, callback) => {
	Group.findOne({_id: groupID})
	.lean()
	.exec((err, group) => {
		if (group == null) return callback(null, false)
		isMember = _.filter(group.userlist, (member) => member.toString() == user._id.toString())
		if (!err && (isMember.length == 1 || group.creator.toString() == user._id.toString()))
			return callback(null, true)

		callback(null, false)
	})
}

exports.findGroup = (req, res, groupid, callback) => {
	let populateQuery = [{path:'creator'}, {path:'userlist', model: 'User', populate:{path: 'userlist', model: 'User'}}]

	Group.find({_id: groupid, $or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
	.populate(populateQuery)
	.lean()
	.exec((err, group) => {
		if (!err && !(group.length == 0)) {
			return callback(null, group)
		} else {
			return callback('404', 'Group could not be found')
		}

		return callback('500', 'Internal server error')
		log.error('Internal error(%d): %s', '500', err.message)
	})
}

exports.inviteToGroup = (req, res, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'user': {
			notEmpty: true,
			errorMessage: `User ID is empty`,
			isEmail: {
				errorMessage: 'That isnt a valid email address'
			}
		},
	 'group': {
			notEmpty: true,
			errorMessage: `No group selected`
		}
	})

	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array()[0].msg)
		}

		Group.findOne({_id: req.body.group, $or:[{'creator':req.user._id}, {'userlist': { $in : [req.user._id]}}]})
		.populate({ path: 'creator'})
		.lean()
		.exec((err, group) => {
			if (group == null) return callback('404', 'Something went wrong.')
			if (!err) {
				invites.newInvite(req, res, req.body.user, group._id, (err, ret) => {
					if (!err) return callback(null, ret)
					return callback(err, ret)
				})
			} else {
				log.error('Internal error(%d): %s', '500', err.message)
				callback('500', 'Server error! Please try again soon.')
			}
		})
	})
}

exports.findUserInvites = (req, res, callback) => {
	let populateQuery = [{path:'by', select:'firstname lastname avatar'}, {path:'group', select:'name'}]
	Invite.find({'to': req.user._id})
	.populate(populateQuery)
	.lean()
	.exec((err, invs) => {
		if (err) return callback('500', 'Could not retrieve invites. Try again later.')
		return callback(null, invs)
	})
}

exports.findSentInvites = (req, res, callback) => {
	let populateQuery = [{path:'by', select:'firstname lastname avatar'}, {path:'group', select:'name'}]
	Invite.find({'by': req.user._id})
	.populate(populateQuery)
	.lean()
	.exec((err, invs) => {
		if (err) return callback('500', 'Could not retrieve invites. Try again later.')
		return callback(null, invs)
	})
}

exports.acceptInvite = (req, res, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'group': {
			notEmpty: true,
			errorMessage: `No group selected`
		}
	})
	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array())
		}

		Invite.findOne({'to': req.user._id, 'group': req.body.group})
		.lean()
		.exec((err, inv) => {
			invites.acceptInvite(req, res, inv._id, inv.group, (deleted) => {
				return callback(null, true)
			})
		})
	})
}

exports.declineInvite = (req, res, callback) => {
	req.sanitizeBody()
	req.checkBody({
	 'group': {
			notEmpty: true,
			errorMessage: `No group selected`
		}
	})
	req.getValidationResult().then(function(errors) {
		if (!errors.isEmpty()) {
			return callback('100', errors.useFirstErrorOnly().array())
		}

		Invite.findOne({'to': req.user._id, 'group': req.body.group})
		.lean()
		.exec((err, inv) => {
			invites.declineInvite(req, res, inv._id, inv.group, (deleted) => {
				return callback(null, true)
			})
		})
	})
}
