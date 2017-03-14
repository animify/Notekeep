const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const Notes = require(jt.path('model/notes'))
const Group = require(jt.path('model/group'))
const Invite = require(jt.path('model/invite'))
const auth = require(jt.path('auth/auth'))
const groups = require(jt.path('controllers/groups'))
const account = require(jt.path('controllers/account'))
const activities = require(jt.path('controllers/activities'))
const moment = require('moment')
const async = require('async')
const _ = require('underscore')

exports.newInvite = (req, res, to, group, callback) => {
	account.findByEmail(req, res, to).then((accountID) => {
		Invite.findOne({'to': accountID, 'group': group})
		.lean()
		.exec((err, inv) => {
			console.log(inv);
			if (inv == null) {
				Group.findOne({_id: group, $or:[{'creator':accountID}, {'userlist': { $in : [accountID]}}]})
				.populate({ path: 'creator'})
				.lean()
				.exec((err, inGroup) => {
					if (inGroup != null) return callback('100', 'User is already in that group.')
					let invite = new Invite({
						by: req.user._id,
						to: accountID,
						group: group
					})
					invite.save()
					activities.newActivity(req.user._id, accountID, 'sent_invite', group, null)
					return callback(null, 'Invite has been sent.')
				})
			} else {
				return callback('100', 'A group invite to that member already exists.')
			}
		})
	}).catch((error) => {
		callback('100', error)
	})
}

exports.acceptInvite = (req, res, inviteID, groupID, callback) => {
	accept = () => {
		return new Promise(function(resolve, reject) {
			Group.findOneAndUpdate(
				{_id: groupID},
				{$addToSet: {'userlist': req.user._id}},
				{safe: true, upsert: true},
				(err, group) => {
					if (err) return reject(err)
				activities.newActivity(req.user._id, null, 'accepted_invite', groupID, null)
				resolve(group)
			})
		})
	}

	accept().then((group) => {
		callback(deleteInvite(group._id, inviteID))
	}).catch((err) => {
		callback(err)
	})
}
exports.declineInvite = (req, res, inviteID, groupID, callback) => {
	activities.newActivity(req.user._id, null, 'declined_invite', groupID, null)
	callback(deleteInvite(groupID, inviteID))
}

exports.deleteInvite = (groupID, inviteID) => {
	deleteInvite(groupID, inviteID)
}

deleteInvite = (groupID, inviteID, cb) => {
	Invite.findOneAndRemove({_id: inviteID, group: groupID},
		(wr, wrg) => {
			return true
	})
}
