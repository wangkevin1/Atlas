////////////////
//GULP SCRIPTS//
////////////////

//////////
//CONFIG//
//////////

//vendor
var VENDORS = [
    'bower_components/moment-duration-format/lib/moment-duration-format.js', 
    'bower_components/atlasjs/production/**'
];

//browser-sync
var CONFIG = {
    server: {
        baseDir: 'dist'
    },
    port: 1212
};


//GULP
var gulp = require('gulp');

///////////
//PLUGINS//
///////////

//node
var fs = require('fs');
var path = require('path');

//hint
var jshint = require('gulp-jshint');

//concatenate
var concat = require('gulp-concat');

//sass
var sass = require('gulp-sass');
var csso = require('gulp-csso');

//scripts
var uglify = require('gulp-uglify');

//util
var rename = require('gulp-rename');
var changed = require('gulp-changed');
var clean = require('gulp-clean');
var util = require('gulp-util');
var jsonEditor = require('gulp-json-editor');
var merge = require('merge-stream');
var browsersync = require('browser-sync');

//////////////////
//File Structure//
//////////////////

//File Array in directory
var fileArray = function (dir) {
    return fs.readdirSync(dir).map(function (element) {
        return './' + dir + '/' + element;
    });
};

var blogPostArray = function (dir, attrs) {
    var postArray = [];
    fileArray(dir).map(function (element) {
        var data = require(element);

        var attributes = {};

        for (var i = 0; i < attrs.length; i++) {
            attributes[attrs[i]] = data[attrs[i]];
        }
        postArray.unshift(attributes);
    });
    return postArray;
};

/////////
//TASKS//
/////////

//BROWSER-SYNC tasks
gulp.task('bs', ['compile'], function () {
    browsersync(CONFIG);
});

//CLEAN dist
gulp.task('clean', function () {
    return gulp.src('dist', {
            read: false
        })
        .pipe(clean());
});

//HTML
gulp.task('html', function () {
    return gulp.src('html/front.html')
        .pipe(rename('index.html'))
        .pipe(gulp.dest('dist'))
        .pipe(browsersync.reload({
            stream: true
        }));
});

//TEMPLATES
gulp.task('templates', function () {
    return gulp.src('templates/*.html')
        .pipe(gulp.dest('dist/templates'))
        .pipe(browsersync.reload({
            stream: true
        }));
});

//ASSETS
gulp.task('assets', function () {
    return gulp.src('assets/**')
        .pipe(gulp.dest('dist/assets'))
        .pipe(browsersync.reload({
            stream: true
        }));
});

//DATA
gulp.task('data', function () {
    return gulp.src('data/**')
        .pipe(gulp.dest('dist/data'))
        .pipe(browsersync.reload({
            stream: true
        }));
});


//Data Blog Array
gulp.task('dataBlogArray', ['data'], function () {

    var posts = blogPostArray('data/data_blog', ['id', 'title', 'date']);
    return gulp.src('data/blogPostArray.json')
        .pipe(jsonEditor(function (json) {
            return posts;
        }))
        .pipe(gulp.dest('dist/data'));
});

//SASS compile minify
gulp.task('scss', function () {
    return gulp.src('scss/front.scss')
        .pipe(rename('style.min.css'))
        .pipe(sass())
        .pipe(csso())
        .pipe(gulp.dest('dist'))
        .pipe(browsersync.reload({
            stream: true
        }));
});

//SCRIPT concat minify
gulp.task('scripts', function () {
    return gulp.src('js/*.js')
        .pipe(concat('main.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'))
        .pipe(browsersync.reload({
            stream: true
        }));
});

//VENDOR
gulp.task('vendor', function () {
    return gulp.src(VENDORS)
        .pipe(gulp.dest('dist/vendor'))
        .pipe(browsersync.reload({
            stream: true
        }));
});

//WATCH changes
gulp.task('watch', ['compile'], function () {
    gulp.watch('html/*.html', ['html']);
    gulp.watch('templates/*.html', ['templates']);
    gulp.watch('assets/**', ['assets']);
    gulp.watch('data/**', ['data', 'dataBlogArray']);
    gulp.watch('config/**', ['config']);
    gulp.watch('js/*.js', ['scripts']);
    gulp.watch('scss/*.scss', ['scss']);

});

//Watch dev 
gulp.task('watch-D', ['compile-D'], function () {
    gulp.watch('html/*.html', ['html']);
    gulp.watch('templates/*.html', ['templates']);
    gulp.watch('assets/**', ['assets']);
    gulp.watch('data/**', ['data', 'dataBlogArray']);
    gulp.watch('config/**', ['config']);
    gulp.watch('js/*.js', ['scripts-D']);
    gulp.watch('scss/*.scss', ['scss']);

});

//COMPILE
gulp.task('compile', ['vendor', 'html', 'templates', 'assets', 'data', 'dataBlogArray', 'scss', 'scripts']);

///////
//DEV//
///////

//SCRIPT concat without minify
gulp.task('scripts-D', function () {
    return gulp.src('js/*.js')
        .pipe(concat('main.min.js'))
        .pipe(gulp.dest('dist'))
        .pipe(browsersync.reload({
            stream: true
        }));
});

//COMPILE dev 
gulp.task('compile-D', ['vendor', 'html', 'templates', 'assets', 'data', 'dataBlogArray', 'scss', 'scripts-D']);

//ATLAS 

gulp.task('atScript', function () {
    return gulp.src('src/*.js')
        .pipe(concat('atlas.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('production/atlas'));
});

gulp.task('atScss', function () {
    return gulp.src('src/atlas.scss')
        .pipe(rename('atlas.min.css'))
        .pipe(sass())
        .pipe(csso())
        .pipe(gulp.dest('production/atlas'));
});

gulp.task('atTemplate', function () {
    return gulp.src('src/templates/**')
        .pipe(gulp.dest('production/atlas/templates'));
});

gulp.task('compileAtlas', ['atScript', 'atScss', 'atTemplate']);

//GHPAGES
gulp.task('ghpages', ['compile'], function () {
    return gulp.src('dist/**')
        .pipe(gulp.dest('../siteGhpages'));
});

//Start Server 
gulp.task('start', ['compile', 'bs', 'watch'], function () {
    util.log('\n' +
        '            $$\\     $$\\                      \n' +
        '            $$ |    $$ |                     \n' +
        '  $$$$$$\\ $$$$$$\\   $$ | $$$$$$\\   $$$$$$$\\  \n' +
        '  \\____$$\\\\_$$  _|  $$ | \\____$$\\ $$  _____| \n' +
        '  $$$$$$$ | $$ |    $$ | $$$$$$$ |\\$$$$$$\   \n' +
        ' $$  __$$ | $$ |$$\\ $$ |$$  __$$ | \\____$$\\  \n' +
        ' \\$$$$$$$ | \\$$$$  |$$ |\\$$$$$$$ |$$$$$$$  | \n' +
        '  \\_______|  \\____/ \\__| \\_______|\\_______/  \n' +
        '\n//LOCALHOST:' + CONFIG.port + '//\n'
    );
});

//Start Server dev 
gulp.task('start-D', ['compile-D', 'bs', 'watch-D']);

//DEFAULT run server 
gulp.task('default', ['start']);