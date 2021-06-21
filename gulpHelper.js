//const gulp = require('gulp');
const clean = require('gulp-rimraf');
const fs = require('fs');
const ts = require('gulp-typescript');
const markdown = require('nunjucks-markdown');
const marked = require('marked');
const nunjucksRender = require('gulp-nunjucks-render');
const sourcemaps = require('gulp-sourcemaps');
const mkdirp = require('mkdirp');
const merge = require('merge2');
const replace = require('gulp-replace');


function loadJsonFromFileSync(fileName) {
    const data = fs.readFileSync(fileName, "utf8");
    const config = JSON.parse(data);
    return config;
}

module.exports.loadJsonFromFileSync = loadJsonFromFileSync;

const package = loadJsonFromFileSync("package.json");
module.exports.package = package;

const defaultConfig = {
    basePath: `src/${package.name}`,
    nunjucks: {
        data: {
            jsroot: "/modules",
        },
    },
    staging: {
        jsroot: `/modules/${package.version}`,
        modules: [
            '@littleware/little-elements/web',
            '@fortawesome/fontawesome-free',
            'i18next',
            'jasmine-core/lib/jasmine-core',
            'lit-html',
            'purecss',
            '@webcomponents/webcomponentsjs',
        ]
    }
};

defaultConfig.staging.modules = defaultConfig.staging.modules.filter(
    (it) => fs.existsSync(`node_modules/${it}/`)
);

module.exports.defaultConfig = defaultConfig;

/**
 * makeFolder mkdirp adapter to Promise
 * 
 * @param {string} path 
 */
function makeFolder(path) {
    return new Promise( function(resolve, reject) {
            mkdirp( path, function(err) {
                    if (err) {
                        console.log( err );
                        reject( err );
                    } else {
                        resolve( path );
                    }
            });
        });
};

module.exports.makeFolder = makeFolder;

/**
 * Define gulp tasks for building the
 * typescript and nunjucks resources under
 * config.basePath 
 *     (ex: { basePath: src/@littleware/little-elements, jsroot: /modules })
 * 
 * @param {basePath, staging} config where basePath is the gulp.src basePath, 
 *       and staging object holds config for the little-stage task 
 */
function defineTasks(gulp, config) {
    config = { ...defaultConfig, ...(config || {}) };
    let basePath = config.basePath;
    if ( ! basePath ) {
        console.log( "ERROR: basePath must be configured" );
        return;
    }

    // register markdown support with nunjucks
    const nunjucksManageEnv = function(env) {
        // The second argument can be any function that renders markdown 
        markdown.register(env, marked);
    };

    //var env = new nunjucks.Environment(new nunjucks.FileSystemLoader("."));
    //markdown.register(env, marked);

    //var tsProject = ts.createProject("tsconfig.json");
    //var watch = require( 'gulp-watch' );

    gulp.task('little-clean', () => {
        console.log('Clean all files in web/, commonjs/, and site/ folders');
        return gulp.src(
            ['commonjs', 'dist', 'web', 'site', 'dist'],
            { read: false, allowEmpty: true }
         ).pipe(clean());
    });

    //
    // Server side templating with nunjucks
    // see https://zellwk.com/blog/nunjucks-with-gulp/
    // Also incorporating markdown support with nunjucks-markdown.
    //
    gulp.task('little-compilenunjucks', () => {
        return gulp.src( 
            [ basePath + '/**/*.html' ],
            { base: basePath }
        )
        .pipe( 
            nunjucksRender(
                {
                    data: config.nunjucks.data,
                    envOptions: { autoescape: false }, 
                    manageEnv:nunjucksManageEnv, 
                    path: [ basePath, "node_modules/@littleware" ]
                }
            ) ) // path: [ "src/templates" ], 
        .on('error', console.log)
        .pipe(gulp.dest('./web/'));
    });

    gulp.task('little-compilehtml', gulp.series('little-compilenunjucks', (done) => { return done(); }));

    const tsConfig = {
        //noImplicitAny: true,
        target: "ESNEXT",
        //module: commonsjs,
        module: "esnext",
        //moduleResolution: "Node",
        sourceMap: true,
        declaration: true,
        baseUrl: "src", // This must be specified if "paths" is.
        //paths: {
        //    "*.mjs": ["*", "*.ts"]
        //},
        rootDirs: [
            ".",
            "node_modules"
        ]
        // declaration: true
    };

    // compile the commonjs/ folder as nodejs modules
    gulp.task('little-compilets-commonjs', () => {
        const tsBinConfig = { ...tsConfig, module: "commonjs", moduleResolution: "Node" };
        //console.log(`Running with ${JSON.stringify(tsBinConfig)}`)
        const tsResult = gulp.src( [`${basePath}/bin/**/*.ts`, `${basePath}/common/**/*.ts`], 
                { base: basePath })
            .pipe(ts( tsBinConfig ));
        return merge(
            tsResult.js.pipe(gulp.dest("./commonjs")),
            tsResult.dts.pipe(gulp.dest("./commonjs"))
        );
    });

    // compile all folders except bin/ as es2015 modules
    gulp.task('little-compilets-web', () => {
        const tsResult = gulp.src( ['src/**/*.ts', `!${basePath}/bin/**/*.ts`], 
                { base: basePath })
            .pipe( sourcemaps.init() )
            .pipe(ts( tsConfig ));
        return merge(
            tsResult.pipe(sourcemaps.write('maps/')).pipe(gulp.dest("./web")),
            tsResult.js.pipe(gulp.dest("./web")),
            tsResult.dts.pipe(gulp.dest("./web"))
        );
    });

    /** Copy site/resources/img/ images over */
    gulp.task('little-compileimg', () => {
        return gulp.src(basePath + '/site/resources/img/**/*').pipe(gulp.dest("web/site/resources/img"));
    });

    /** Copy json files over over */
    gulp.task('little-json', () => {
        return merge(
            gulp.src(basePath + '/bin/**/*.json').pipe(gulp.dest('commonjs/bin')),
            gulp.src(basePath + '/common/**/*.json').pipe(gulp.dest('commonjs/common')),
            gulp.src(basePath + '/lib/**/*.json').pipe(gulp.dest('web/lib')),
            gulp.src(basePath + '/common/**/*.json').pipe(gulp.dest('web/common')),
            gulp.src(basePath + '/site/**/*.json').pipe(gulp.dest('web/site')),
        );
    });

    /** Copy markdown files over over */
    gulp.task('little-markdown', () => {
        return merge(
            gulp.src(basePath + '/bin/**/*.md').pipe(gulp.dest('commonjs/bin')),
            gulp.src(basePath + '/common/**/*.md').pipe(gulp.dest('commonjs/common')),
            gulp.src(basePath + '/lib/**/*.md').pipe(gulp.dest('web/lib')),
            gulp.src(basePath + '/common/**/*.md').pipe(gulp.dest('web/common')),
            gulp.src(basePath + '/site/**/*.md').pipe(gulp.dest('web/site')),
        );
    });
    
    /** Copy nunjucks templates over */
    gulp.task('little-copynjk', () => {
        return gulp.src( basePath + '/lib/**/*.njk' ).pipe( gulp.dest( "web/lib/" ) );
    });

    gulp.task('little-compile', gulp.series('little-compilehtml', 'little-compilets-web', 'little-compilets-commonjs', 'little-compileimg', 'little-copynjk', 'little-json', 'little-markdown', (done) => {
        return done();
    }));

    gulp.task('little-watchts', function () {
        // Endless stream mode 
        return gulp.watch('src/**/*.ts', gulp.series('little-compilets-web', 'little-compilets-commonjs') );
    });

    gulp.task('little-watchhtml', function () {
        return gulp.watch( ['src/**/*.html', 'src/**/*.css', 'src/**/*.njk'], gulp.series('little-compilehtml') ); 
    });

    gulp.task('little-watch', gulp.parallel('little-watchts', 'little-watchhtml', (done) => {
        return done();
    }));

    gulp.task('little-compileclean', gulp.series('little-clean', 'little-compile'));

    /**
     * Prepare /dist folder for deployment
     */
    gulp.task('little-stage', gulp.series('little-clean', 'little-compile', function() {
        return merge.apply(
            this,
            [
                gulp.src('web/site/**/*.*'
                    ).pipe(gulp.dest('dist/')),
                gulp.src('web/**/*.*').pipe(gulp.dest(`dist${config.staging.jsroot}/${package.name}/web/`)),
                ...
                config.staging.modules.map(
                    (it) => {
                        let pipeline = gulp.src(`node_modules/${it}/**/*.*`);
                        if (it.match(/@littleware\//)) {
                            // hack - replace /modules/ path in styleHelper and basicShell
                            pipeline = pipeline.pipe(replace('"/modules/', `"${config.staging.jsroot}/`));
                        }
                        return pipeline.pipe(gulp.dest(`dist${config.staging.jsroot}/${it}/`));
                    }
                )
            ]
        );
    }));
}

module.exports.defineTasks = defineTasks;
