# TL;DR

The [gulpHelper](../gulpHelper.js) generates  a suite of gulp tasks for building typescript nodejs and webapps from code layed out as a little application.

## Overview

The gulp build system consumes typescript and web assets from `src/module/name`, and produces nodejs runtime under `commonjs/` and web runtime under `web/`.

```
commonjs
├── bin
│   ├── spec
├── common
│   └── spec
└── maps
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

Import the `gulpHelper` module into your [gulpfile](../gulpfile.js), and call `gulpHelper.defineTasks(gulp, { basePath })` to generate the rules.

```
const gulp = require('gulp');
const gulpHelper = require('./gulpHelper');


gulpHelper.defineTasks(gulp);

gulp.task('default', gulp.series('little-compile', 
    (done) => { done(); }
);

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
[06:33:05] Tasks for ~/Code/little-nodedev/gulpfile.js
[06:33:05] ├── little-clean
[06:33:05] ├── little-compilenunjucks
[06:33:05] ├─┬ little-compilehtml
[06:33:05] │ └─┬ <series>
[06:33:05] │   ├── little-compilenunjucks
[06:33:05] │   └── <anonymous>
[06:33:05] ├── little-compilets-commonjs
[06:33:05] ├── little-compilets-web
[06:33:05] ├── little-compileimg
[06:33:05] ├── little-json
[06:33:05] ├── little-copynjk
[06:33:05] ├─┬ little-compile
[06:33:05] │ └─┬ <series>
[06:33:05] │   ├─┬ little-compilehtml
[06:33:05] │   │ └─┬ <series>
[06:33:05] │   │   ├── little-compilenunjucks
[06:33:05] │   │   └── <anonymous>
[06:33:05] │   ├── little-compilets-web
[06:33:05] │   ├── little-compilets-commonjs
[06:33:05] │   ├── little-compileimg
[06:33:05] │   ├── little-copynjk
[06:33:05] │   ├── little-json
[06:33:05] │   └── <anonymous>
[06:33:05] ├── little-watchts
[06:33:05] ├── little-watchhtml
[06:33:05] ├─┬ little-watch
[06:33:05] │ └─┬ <parallel>
[06:33:05] │   ├── little-watchts
[06:33:05] │   ├── little-watchhtml
[06:33:05] │   └── <anonymous>
[06:33:05] ├─┬ little-compileclean
[06:33:05] │ └─┬ <series>
[06:33:05] │   ├── little-clean
[06:33:05] │   └─┬ little-compile
[06:33:05] │     └─┬ <series>
[06:33:05] │       ├─┬ little-compilehtml
[06:33:05] │       │ └─┬ <series>
[06:33:05] │       │   ├── little-compilenunjucks
[06:33:05] │       │   └── <anonymous>
[06:33:05] │       ├── little-compilets-web
[06:33:05] │       ├── little-compilets-commonjs
[06:33:05] │       ├── little-compileimg
[06:33:05] │       ├── little-copynjk
[06:33:05] │       ├── little-json
[06:33:05] │       └── <anonymous>
[06:33:05] ├─┬ little-stage
[06:33:05] │ └─┬ <series>
[06:33:05] │   ├── little-clean
[06:33:05] │   ├─┬ little-compile
[06:33:05] │   │ └─┬ <series>
[06:33:05] │   │   ├─┬ little-compilehtml
[06:33:05] │   │   │ └─┬ <series>
[06:33:05] │   │   │   ├── little-compilenunjucks
[06:33:05] │   │   │   └── <anonymous>
[06:33:05] │   │   ├── little-compilets-web
[06:33:05] │   │   ├── little-compilets-commonjs
[06:33:05] │   │   ├── little-compileimg
[06:33:05] │   │   ├── little-copynjk
[06:33:05] │   │   ├── little-json
[06:33:05] │   │   └── <anonymous>
[06:33:05] │   └── <anonymous>
[06:33:05] └─┬ default
[06:33:05]   └─┬ <series>
[06:33:05]     ├─┬ little-compile
[06:33:05]     │ └─┬ <series>
[06:33:05]     │   ├─┬ little-compilehtml
[06:33:05]     │   │ └─┬ <series>
[06:33:05]     │   │   ├── little-compilenunjucks
[06:33:05]     │   │   └── <anonymous>
[06:33:05]     │   ├── little-compilets-web
[06:33:05]     │   ├── little-compilets-commonjs
[06:33:05]     │   ├── little-compileimg
[06:33:05]     │   ├── little-copynjk
[06:33:05]     │   ├── little-json
[06:33:05]     │   └── <anonymous>
[06:33:05]     └── <anonymous>

```
