# TL;DR

The [gulpHelper](../gulpHelper.js) generates  a suite of gulp tasks for building typescript nodejs and webapps from code layed out as a little application.

## Overview

The gulp build system consumes typescript and web assets from `src/module/name`, and produces nodejs runtime under `commonjs/` and web runtime under `web/`.

```
commonjs
├── bin
│   ├── spec
└── common
    └── spec
```
```
web
├── common
├── lib
└── maps
```
```
src/@littleware/little-elements
├── bin
├── common
├── lib
└── site
```

## Use

Import the `gulpHelper` module into your [gulpfile](../gulpfile.js), and call `gulpHelper.defineTasks(gulp, { basePath })` to generate the rules where `basePath` points to the source folder (ex: `src/@littleware/little-elements`).

```
const gulp = require('gulp');
const gulpHelper = require('./gulpHelper');


gulpHelper.defineTasks(gulp);

gulp.task('default', gulp.series('little-compile', (done) => {
    // place code for your default task here
    //console.log( "Hello, World!" );
    //gulp.src( "src/**/*" ).pipe( gulp.dest( "lib/" ) );
    done();
    }));
```

## Configuration

The `defineTasks` method takes an optional configuration argument.  The default configuration pulls values from `package.json`:

```
const defaultConfig = {
    basePath: `src/${package.name}`,
    nunjucks: {
        data: {
            jsroot: "/modules",
        },
    },
    staging: {
        jsroot: `modules/${package.version}`,
        modules: [
            '@littleware/little-elements/web',
            'font-awesome',
            'i18next',
            'jasmine-core/lib/jasmine-core',
            'lit-html',
            'purecss',
            '@webcomponents/webcomponentsjs',
        ]
    }
};

```

## Rules

```
$ npx gulp --tasks
[06:52:43] Tasks for ~/Code/little-elements/gulpfile.js
[06:52:43] ├── little-clean
[06:52:43] ├── little-compilenunjucks
[06:52:43] ├─┬ little-compilehtml
[06:52:43] │ └─┬ <series>
[06:52:43] │   ├── little-compilenunjucks
[06:52:43] │   └── <anonymous>
[06:52:43] ├── little-compilets-commonjs
[06:52:43] ├── little-compilets-web
[06:52:43] ├── little-compileimg
[06:52:43] ├── little-json
[06:52:43] ├── little-copynjk
[06:52:43] ├─┬ little-compile
[06:52:43] │ └─┬ <series>
[06:52:43] │   ├─┬ little-compilehtml
[06:52:43] │   │ └─┬ <series>
[06:52:43] │   │   ├── little-compilenunjucks
[06:52:43] │   │   └── <anonymous>
[06:52:43] │   ├── little-compilets-web
[06:52:43] │   ├── little-compilets-commonjs
[06:52:43] │   ├── little-compileimg
[06:52:43] │   ├── little-copynjk
[06:52:43] │   ├── little-json
[06:52:43] │   └── <anonymous>
[06:52:43] ├── little-watchts
[06:52:43] ├── little-watchhtml
[06:52:43] ├─┬ little-watch
[06:52:43] │ └─┬ <parallel>
[06:52:43] │   ├── little-watchts
[06:52:43] │   ├── little-watchhtml
[06:52:43] │   └── <anonymous>
[06:52:43] ├─┬ little-compileclean
[06:52:43] │ └─┬ <series>
[06:52:43] │   ├── little-clean
[06:52:43] │   └─┬ little-compile
[06:52:43] │     └─┬ <series>
[06:52:43] │       ├─┬ little-compilehtml
[06:52:43] │       │ └─┬ <series>
[06:52:43] │       │   ├── little-compilenunjucks
[06:52:43] │       │   └── <anonymous>
[06:52:43] │       ├── little-compilets-web
[06:52:43] │       ├── little-compilets-commonjs
[06:52:43] │       ├── little-compileimg
[06:52:43] │       ├── little-copynjk
[06:52:43] │       ├── little-json
[06:52:43] │       └── <anonymous>
[06:52:43] └─┬ default
[06:52:43]   └─┬ <series>
[06:52:43]     ├─┬ little-compile
[06:52:43]     │ └─┬ <series>
[06:52:43]     │   ├─┬ little-compilehtml
[06:52:43]     │   │ └─┬ <series>
[06:52:43]     │   │   ├── little-compilenunjucks
[06:52:43]     │   │   └── <anonymous>
[06:52:43]     │   ├── little-compilets-web
[06:52:43]     │   ├── little-compilets-commonjs
[06:52:43]     │   ├── little-compileimg
[06:52:43]     │   ├── little-copynjk
[06:52:43]     │   ├── little-json
[06:52:43]     │   └── <anonymous>
[06:52:43]     └── <anonymous>
```
