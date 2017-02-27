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
		log.info(to, team, accountID)
		Invite.findOne({'to': accountID, 'team': team})
		.lean()
		.exec((err, inv) => {
			console.log(inv);
			if (inv == null) {
				let invite = new Invite({
					by: req.user._id,
					to: accountID,
					team: team
				})
				invite.save()
				return callback(null, 'Invite has been sent.')
			} else {
				return callback('100', 'A team invite to that member already exists.')
			}
		})
	})
}
