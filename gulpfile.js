const gulp = require('gulp');
const gulpHelper = require('./gulpHelper');
const basePath = "src/@littleware/little-elements";

const workboxBuild = require('workbox-build');

const buildSW = () => {
    // This will return a Promise
    return workboxBuild.generateSW({
      swDest: 'web/lib/appContext/service-worker.js',
  
      // Define runtime caching rules.
      runtimeCaching: [{
        // Match any request that ends with .js, .css, .html, or .svg.
        urlPattern: /\.(?:js|css|html|svg)$/,
  
        // Apply a cache-first strategy.
        handler: 'CacheFirst',
  
        options: {
          // Use a custom cache name.
          cacheName: 'assets',
  
          /* Only cache 10 images.
          expiration: {
            maxEntries: 10,
          }, */
        },
      }],
    });
  };

gulpHelper.defineTasks(gulp, { basePath });

gulp.task('service-worker', () => {
    return buildSW();
});

gulp.task('default', gulp.series('little-compile', 'service-worker', (done) => {
    // place code for your default task here
    //console.log( "Hello, World!" );
    //gulp.src( "src/**/*" ).pipe( gulp.dest( "lib/" ) );
    done();
    }));
