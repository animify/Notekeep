const mongoose = require('mongoose')
const	crypto = require('crypto')
const passportLocalMongoose = require('passport-local-mongoose')
const bcrypt = require('bcrypt-nodejs')
const	Schema = mongoose.Schema

let	User = new Schema({
	username: {
		type: String,
		unique: true,
		required: true
	},
	avatar: {
		type: String,
		required: true
	},
	firstname: {
		type: String,
		required: true
	},
	lastname: {
		type: String,
		required: true
	},
	email: {
		type: String,
		unique: true,
		required: true
	},
	ip_address: {
		type: String
	},
	location: {
		name: String,
		code: String,
	},
	useragent: {
		type: Array
	},
	hashedPassword: {
		type: String,
		required: true
	},
	salt: {
		type: String,
		required: true
	},
	workspace: {
		type: String
	},
	created: {
		type: Date,
		default: Date.now
	},
	resetPasswordToken: String,
	resetPasswordExpires: Date
})

User.plugin(passportLocalMongoose)

User.virtual('userId')
	.get(function () {
		return this.id
	})

User.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, this.salt, null)
}

User.virtual('password')
	.set(function(password) {
		this._plainPassword = password
		this.salt = bcrypt.genSaltSync(64)
		this.hashedPassword = this.generateHash(password)
	})
	.get(function() { return this.hashedPassword })

User.methods.checkPassword = function(password) {
	return bcrypt.compareSync(password, this.hashedPassword)
}

module.exports = mongoose.model('User', User)
