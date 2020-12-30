const gulp = require("gulp");
const gulpHelper = require("./gulpHelper");

gulpHelper.defineTasks(gulp);

gulp.task('default', gulp.series('little-compile', (done) => {
    // place code for your default task here
    //console.log( "Hello, World!" );
    //gulp.src( "src/**/*" ).pipe( gulp.dest( "lib/" ) );
    done();
    }));
