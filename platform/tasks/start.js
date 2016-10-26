'use strict'

const gulp = require('gulp')
const nodemon = require('gulp-nodemon')
const jetpack = require('fs-jetpack')


gulp.task('start', ['stylusmain', 'stylus'], function () {
	nodemon({
		script: 'app.js'
	, ext: 'js html'
	, env: { 'NODE_ENV': 'development' }
	})
})
