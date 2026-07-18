//const gulp = require('gulp');
const clean = require('gulp-rimraf');
const fs = require('fs');
const ts = require('gulp-typescript');
const markdown = require('nunjucks-markdown');
const { marked } = require('marked');
const nunjucksRender = require('gulp-nunjucks-render');
const sourcemaps = require('gulp-sourcemaps');
const mkdirp = require('mkdirp');
const { finished } = require('stream/promises'); // modern nodejs native streams - no merge2
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
            mkdirp(path, function(err) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        resolve(path);
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

    gulp.task('little-compilehtml', gulp.series('little-compilenunjucks'));

    const tsConfig = {
        noImplicitAny: false,
        strictNullChecks: false,
        target: "ESNEXT",
        //module: commonsjs,
        module: "esnext",
        sourceMap: true,
        declaration: true,
        rootDirs: [
            ".",
            "node_modules"
        ],
        types: [ "jasmine" ],
        // declaration: true
        ...(config.tsConfig || {})
    };

    // compile the commonjs/ folder as nodejs modules
    gulp.task('little-compilets-commonjs', () => {
        const tsBinConfig = { ...tsConfig, module: "commonjs" };
        const globList = [`${basePath}/bin/`, `${basePath}/common/`]
            .filter(path => fs.existsSync(path))
            .map(path => `${path}**/*.ts`);
        if (0 === globList.length) {
            return Promise.resolve();
        }
        //console.log(`Running with ${JSON.stringify(tsBinConfig)}`)
        const tsProject = ts.createProject(tsBinConfig);
        const tsResult = gulp.src(globList,
                { base: basePath, allowEmpty: true, nodir: true })
            .pipe(tsProject());
        return Promise.all(
            [
                tsResult.js.pipe(gulp.dest("./commonjs")),
                tsResult.dts.pipe(gulp.dest("./commonjs"))
            ].map(pipe => finished(pipe))
        );
    });

    // compile all folders except bin/ as es2015 modules
    gulp.task('little-compilets-web', () => {
        const tsProject = ts.createProject(tsConfig);
        const tsResult = gulp.src( ['src/**/*.ts', `!${basePath}/bin/**/*.ts`], 
                { base: basePath, allowEmpty: true, nodir: true })
            .pipe(sourcemaps.init())
            .pipe(tsProject());
        return Promise.all(
            [
                tsResult.pipe(sourcemaps.write('maps/')).pipe(gulp.dest("./web")),
                tsResult.js.pipe(gulp.dest("./web")),
                tsResult.dts.pipe(gulp.dest("./web"))
            ].map(pipe => finished(pipe))
        );
    });

    /** Copy site/resources/img/ images over */
    gulp.task('little-compileimg', () => {
        const globList = [ basePath + '/site/resources/img/' ]
            .filter(path => fs.existsSync(path))
            .map(path => path + '**/*.*');
        if (0 === globList.length) {
            return Promise.resolve();
        }
        return gulp.src(
            globList, 
            { allowEmpty: true, nodir: true }
        ).pipe(gulp.dest("web/site/resources/img"));
    });

    const streamSpecList = [
            { src: 'bin/', dest: 'commonjs/bin' },
            { src: 'common/', dest: 'commonjs/common' },
            { src: 'lib/', dest: 'web/lib' },
            { src: 'common/', dest: 'web/common' },
            { src: 'site/', dest: 'web/site' }
        ].map(
            spec => { spec.src = basePath + '/' + spec.src; return spec; }
        ).filter(
            spec => fs.existsSync(spec.src)
        );

    /** Copy json files over over */
    gulp.task('little-json', () => {
        const streamList = streamSpecList.map(
            spec => gulp.src(spec.src + '**/*.json', { allowEmpty: true, nodir: true }).pipe(gulp.dest(spec.dest))
        );
        if (0 == streamList.length) {
            return Promise.resolve();
        }
        return Promise.all(streamList.map(pipe => finished(pipe)));
    });

    /** Copy markdown files over over */
    gulp.task('little-markdown', () => {
        const streamList = streamSpecList.map(
            spec => gulp.src(spec.src + '**/*.md', { allowEmpty: true, nodir: true }).pipe(gulp.dest(spec.dest))
        );
        if (0 == streamList.length) {
            return Promise.resolve();
        }
        return Promise.all(streamList.map(pipe => finished(pipe)));
    });
    
    /** Copy nunjucks templates over */
    gulp.task('little-copynjk', () => {
        const globList = [ basePath + '/lib/' ].filter(path => fs.existsSync(path)).map(path => path + '**/*.njk');
        if (0 === globList.length) {
            return Promise.resolve();
        }
        return gulp.src(globList, { allowEmpty: true, nodir: true }).pipe(gulp.dest("web/lib/"));
    });

    gulp.task('little-compile',
        gulp.series(
            'little-compilehtml',
            'little-compilets-web', 'little-compilets-commonjs',
            'little-compileimg', 'little-copynjk',
            'little-json', 'little-markdown'
        )
    );

    gulp.task('little-watchts', function () {
        // Endless stream mode 
        return gulp.watch('src/**/*.ts', gulp.series('little-compilets-web', 'little-compilets-commonjs') );
    });

    gulp.task('little-watchhtml', function () {
        return gulp.watch( ['src/**/*.html', 'src/**/*.css', 'src/**/*.njk'], gulp.series('little-compilehtml') ); 
    });

    gulp.task('little-watch', gulp.parallel('little-watchts', 'little-watchhtml'));

    gulp.task('little-compileclean', gulp.series('little-clean', 'little-compile'));

    /**
     * Prepare /dist folder for deployment
     */
    gulp.task('little-stage', gulp.series('little-clean', 'little-compile', function() {
        return Promise.all(
            [
                gulp.src('web/site/**/*.*', { allowEmpty: true, nodir: true }
                    ).pipe(gulp.dest('dist/')),
                gulp.src('web/**/*.*', { allowEmpty: true, nodir: true }).pipe(gulp.dest(`dist${config.staging.jsroot}/${package.name}/web/`)),
                ...
                config.staging.modules.map(
                    (it) => {
                        let pipeline = gulp.src(`node_modules/${it}/**/*.*`, { allowEmpty: true, nodir: true });
                        if (it.match(/@littleware\//)) {
                            // hack - replace /modules/ path in styleHelper and basicShell
                            pipeline = pipeline.pipe(replace('"/modules/', `"${config.staging.jsroot}/`));
                        }
                        return pipeline.pipe(gulp.dest(`dist${config.staging.jsroot}/${it}/`));
                    }
                )
            ].map(pipe => finished(pipe))
        );
    }));
}

module.exports.defineTasks = defineTasks;
