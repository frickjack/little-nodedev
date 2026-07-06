const gulp = require("gulp");
const gulpHelper = require("./gulpHelper");

gulpHelper.defineTasks(gulp);

gulp.task('default', gulp.series('little-compile'));
