const jetpack = require('fs-jetpack')

const jt = jetpack.cwd('./libs/')
const log = require(jt.path('logs/log'))(module)
const config = require(jt.path('config'))
const Notes = require(jt.path('model/notes'))
const Team = require(jt.path('model/team'))
const Invite = require(jt.path('model/invite'))
const auth = require(jt.path('auth/auth'))
const teams = require(jt.path('controllers/teams'))
const account = require(jt.path('controllers/account'))
const moment = require('moment')
const async = require('async')
const _ = require('underscore')

exports.newInvite = (req, res, to, team, callback) => {
	account.findByEmail(req, res, to).then((accountID) => {
		Invite.findOne({'to': accountID, 'team': team})
		.lean()
		.exec((err, inv) => {
			console.log(inv);
			if (inv == null) {
				Team.findOne({_id: team, $or:[{'creator':accountID}, {'userlist': { $in : [accountID]}}]})
				.populate({ path: 'creator'})
				.lean()
				.exec((err, inTeam) => {
					if (inTeam != null) return callback('100', 'User is already in that team.')
					let invite = new Invite({
						by: req.user._id,
						to: accountID,
						team: team
					})
					invite.save()
					return callback(null, 'Invite has been sent.')
				})
			} else {
				return callback('100', 'A team invite to that member already exists.')
			}
		})
	}).catch((error) => {
		callback('100', error)
	})
}

exports.acceptInvite = (req, res, inviteID, teamID, callback) => {
	accept = () => {
		return new Promise(function(resolve, reject) {
			Team.findOneAndUpdate(
				{_id: teamID},
				{$addToSet: {'userlist': req.user._id}},
				{safe: true, upsert: true},
				(err, team) => {
					if (err) return reject(err)
				resolve(team)
			})
		})
	}

	accept().then((team) => {
		callback(deleteInvite(team._id, inviteID))
	}).catch((err) => {
		callback(err)
	})
}
exports.declineInvite = (req, res, inviteID, teamID, callback) => {
	callback(deleteInvite(teamID, inviteID))
}

exports.deleteInvite = (teamID, inviteID) => {
	deleteInvite(teamID, inviteID)
}

deleteInvite = (teamID, inviteID, cb) => {
	Invite.findOneAndRemove({_id: inviteID, team: teamID},
		(wr, wrg) => {
			return true
	})
}
