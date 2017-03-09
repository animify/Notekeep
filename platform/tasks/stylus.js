'use strict'

const gulp = require('gulp')
const watch = require('gulp-watch')
const stylus = require('gulp-stylus')
const jetpack = require('fs-jetpack')
const util = require('gulp-util')

const nib = require('nib')
const jeet = require('jeet')
const rupture = require('rupture')

const srcDir = jetpack.cwd('./libs/stylesheets/styl')
const templateDir = jetpack.cwd('./libs/templates/styling')
const destDir = jetpack.cwd('./libs/public/css')

gulp.task('stylus', () => {
	watch(srcDir.path('**/*.styl'), () => { gulp.start('stylusmain') })
	watch(templateDir.path('*.styl'), () => { gulp.start('stylusemail') })
})

gulp.task('stylusmain', () => {
	return gulp.src(srcDir.path('showtime.styl'))
		.pipe(stylus({
			use: [jeet(), nib(), rupture()]
		}))
	 .pipe(gulp.dest(destDir.path()))
})

gulp.task('stylusemail', () => {
	return gulp.src(templateDir.path('styling.styl'))
		.pipe(stylus({
			use: [jeet(), nib(), rupture()]
		}))
	 .pipe(gulp.dest(templateDir.path()))
})
