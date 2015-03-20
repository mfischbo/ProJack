var gulp 			= require('gulp');
var clean 			= require('gulp-clean');

var useref			= require('gulp-useref');
var gulpif			= require('gulp-if');
var uglify			= require('gulp-uglify');
var minifyCss		= require('gulp-minify-css');
var rename			= require('gulp-rename');

var dist = 'dist';

gulp.task('clean', function() {
	return gulp.src(dist, {read : false})
		.pipe(clean());
}); 

gulp.task('html', ['clean'], function() {
	
	var assets = useref.assets();
	return gulp.src(['index.html', 'login.html'])
		.pipe(assets)
		.pipe(assets.restore())
		.pipe(useref())
		.pipe(gulp.dest(dist));
});


gulp.task('copy-static', ['clean'], function() {
	gulp.src(['resources/**', '!resources/css/*.css'])
		.pipe(gulp.dest(dist + '/resources'));

	gulp.src('bower_components/fontawesome/fonts/*.*')
		.pipe(gulp.dest(dist + '/resources/fonts'));


	// tinymce requires special treatment
	gulp.src('bower_components/tinymce/themes/modern/theme.min.js')
		.pipe(rename('themes/modern/theme.js'))
		.pipe(gulp.dest(dist));
	gulp.src('bower_components/tinymce/skins/**/*')
		.pipe(gulp.dest(dist + '/skins/'));
	gulp.src('resources/css/tinymce-style.css')
		.pipe(gulp.dest(dist + '/resources/css/'));
	

	gulp.src('modules/**/*.html')
		.pipe(gulp.dest(dist + '/modules'));

	gulp.src('config.js')
		.pipe(gulp.dest(dist));
});	

gulp.task('default', ['clean', 'html', 'copy-static']);

