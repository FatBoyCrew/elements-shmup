var program = require('commander');
var browserify = require('browserify');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var path = require('path');
var rimraf = require('rimraf');

var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var buffer = require('gulp-buffer');
var concat = require('gulp-concat');
var cssmin = require('gulp-cssmin');
var eslint = require('gulp-eslint');
var htmlmin = require('gulp-htmlmin');
var less = require('gulp-less');
var micro = require('gulp-micro');
var size = require('gulp-size');
var uglify = require('gulp-uglify');
var zip = require('gulp-zip');
var source = require('vinyl-source-stream');
var deploy = require('gulp-gh-pages');

program.on('--help', function(){
  console.log('  Tasks:');
  console.log();
  console.log('    build       build the game');
  console.log('    clean       delete generated files');
  console.log('    dist        generate archive');
  console.log('    serve       launch development server');
  console.log('    watch       watch for file changes and rebuild automatically');
  console.log();
});

program
  .usage('<task> [options]')
  .option('-P, --prod', 'generate production assets')
  .parse(process.argv);

var prod = !!program.prod;

gulp.task('default', ['build']);
gulp.task('build', ['build_source', 'build_index', 'build_styles']);

gulp.task('build_source', function() {
  var bundler = browserify('./src/main', {debug: !prod});
  if (prod) {
    bundler.plugin(require('bundle-collapser/plugin'));
  }

  return bundler
    .bundle()
    .on('error', browserifyError)
    .pipe(source('build.js'))
    .pipe(buffer())
    .pipe(gulpif(prod, uglify()))
    .pipe(gulp.dest('build'));
});

gulp.task('build_index', function() {
  return gulp.src('src/index.html')
    .pipe(gulpif(prod, htmlmin({
      collapseWhitespace: true,
      removeAttributeQuotes: true,
      removeComments: true,
    })))
    .pipe(gulp.dest('build'));
});

gulp.task('build_styles', function() {
  return gulp.src('src/styles.less')
    .pipe(less())
    .pipe(concat('build.css'))
    .pipe(gulpif(prod, cssmin()))
    .pipe(gulp.dest('build'));
});

gulp.task('clean', function() {
  rimraf.sync('build');
  rimraf.sync('dist');
});

gulp.task('lint', function() {
  return gulp.src(['*.js', 'src/**/*.js', '!src/modules/*.js'])
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('dist', ['build'], function() {
  if (!prod) {
    gutil.log(gutil.colors.yellow('WARNING'), gutil.colors.gray('Missing flag --prod'));
    gutil.log(gutil.colors.yellow('WARNING'), gutil.colors.gray('You should generate production assets to lower the archive size'));
  }

  return gulp.src('build/*')
    .pipe(zip('archive.zip'))
    .pipe(size())
    .pipe(micro({limit: 13 * 1024}))
    .pipe(gulp.dest('dist'));
});

// Watch Files For Changes & Reload
gulp.task('serve', ['build'], function () {
  browserSync({
    notify: false,
    server: {
      baseDir: ['build']
    }
  });

  gutil.log("Server started on '" + gutil.colors.green('http://localhost:3000') + "'");

  gulp.watch(['src/**/*.js'], ['lint', 'build_source', reload]);
  gulp.watch(['src/styles.less'], ['build_styles', reload]);
  gulp.watch(['src/index.html'], ['build_index', reload]);
});

// Deploy to GitHub Pages.
gulp.task('deploy', function () {
  gutil.log("Deploying to GitHub Pages");

  gulp.src('build/*')
    .pipe(deploy({
      remoteUrl: 'git@github.com:FatBoyCrew/elements-shmup.git',
      origin: 'origin',
      branch: 'gh-pages'
    }));
});

function browserifyError(err) {
  gutil.log(gutil.colors.red('ERROR'), gutil.colors.gray(err.message));
  this.emit('end');
}
