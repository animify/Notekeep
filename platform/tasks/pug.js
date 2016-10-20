'use strict'

const gulp = require('gulp')
const watch = require('gulp-watch')
const pug = require('gulp-pug')
const gulp_watch_pug = require('gulp-watch-pug')
const jetpack = require('fs-jetpack')

const srcDir = jetpack.cwd('./libs/templates/pug')
const destDir = jetpack.cwd('./libs/templates')

gulp.task('pug', () => {
	gulp.src(srcDir.path('*.pug'))
		.pipe(watch(srcDir.path('*.pug')))
		.pipe(gulp_watch_pug(srcDir.path('*.pug'), { delay: 100 }))
		.pipe(pug())
		.pipe(gulp.dest(destDir.path('html')))
})
