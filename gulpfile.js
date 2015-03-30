// ### PACKAGES ###
// ---------------------------------------
var gulp    = require('gulp'),
    shell   = require('gulp-shell'),
    notify  = require('gulp-notify'),
    plumber = require('gulp-plumber'),
    mocha   = require('gulp-mocha');

// ############################################################################

gulp.task('watch', function() {
    gulp.watch('./**/*.js', {interval: 500}, ['mocha']);
});

gulp.task('mocha:shell', shell.task([
    'mocha'
]));

gulp.task('mocha', function () {
    return gulp
        .src('./test/**.js', {read: false})
        .pipe(plumber({
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(mocha({bail: true}));
});

// ############################################################################

gulp.task('default', ['mocha', 'watch']);
