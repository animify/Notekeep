var mongoose = require('mongoose');
var	crypto = require('crypto');
var passportLocalMongoose = require('passport-local-mongoose');
var bcrypt = require('bcrypt-nodejs');
var	Schema = mongoose.Schema;

var	User = new Schema({
		username: {
			type: String,
			unique: true,
			required: true
		},
		avatar: {
			type: String,
			required: true,
			default: "/images/avatar.png"
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
	});
User.plugin(passportLocalMongoose);

User.methods.generateHash = function(password) {
		return bcrypt.hashSync(password, this.salt, null);
};

User.virtual('userId')
.get(function () {
	return this.id;
});

User.virtual('password')
	.set(function(password) {
		this._plainPassword = password;
		this.salt = bcrypt.genSaltSync(64);
		this.hashedPassword = this.generateHash(password);
	})
	.get(function() { return this.hashedPassword; });


User.methods.checkPassword = function(password) {
		return bcrypt.compareSync(password, this.hashedPassword);
};

module.exports = mongoose.model('User', User);
