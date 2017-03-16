const mongoose = require('mongoose')

const libs = process.cwd() + '/libs/'

const log = require(libs + 'logs/log')(module)
const config = require(libs + 'config')

mongoose.connect(config.get('mongoose:uri'))

const connection = mongoose.connection

connection.on('error', function (err) {
	log.error('Connection error:', err.message)
})

connection.once('open', function callback () {
	log.info("Connected to MongoDB")
})

module.exports = mongoose
module.exports.connection = connection
