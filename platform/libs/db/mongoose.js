var mongoose = require('mongoose');

var libs = process.cwd() + '/libs/';

var log = require(libs + 'logs/log')(module);
var config = require(libs + 'config');

mongoose.connect(config.get('mongoose:uri'));

var db = mongoose.connection;

db.on('error', function (err) {
	log.error('Connection error:', err.message);
});

db.once('open', function callback () {
	log.info("Connected to MongoDB");
});

module.exports = mongoose;
module.exports.connection = db;
