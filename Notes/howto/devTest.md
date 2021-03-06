# TL;DR

Howto design, develop, test, document, deploy

## Source layout

```
src/@module-group/module/
    bin
    common
    lib
    site
    web
```

* `bin` - compiled into `./commonjs/bin` folder as `commonjs` modules suitable for nodejs applications and lambdas
* `common` - compiled into the `./commonjs/common/` folder as commonjs modules, and also `./web/common/` as es2015 modules
* `lib` - compiled into `./web/lib/`
* `site` - html, nunjucks templates, and other web content compiled into `./site`

## Repository Management

[Angular style](https://medium.com/@menuka/writing-meaningful-git-commit-messages-a62756b65c81) commit messages.

[Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) branch management.  A short-lived branches should rebase (rather than merge) to sync up with the long-lived parent it branches off of.

## Deployment

The build process is setup so that commonjs and web modules are layed out for easy import into other npm packages.  The web content is setup to load code via relative paths when possible, but otherwise assumes javascript modules are deployed under a `/modules/` root.


## Dev-test

See the [buildspec.yml](../../buildspec.yml) [codebuild](https://aws.amazon.com/codebuild/) configuration.

```
npm run build
npm test
npm run lint
npm audit
```

The `npm test` command runs a [jasmine](https://jasmine.github.io/index.html) test suites for web modules (using [karmajs](http://karma-runner.github.io/4.0/index.html)) and commonjs modules (with jasmine's nodejs runner).

## Linting

The `lint` script integrates with [eslint](https://eslint.org/) and [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint).

* https://www.npmjs.com/package/eslint-config-airbnb-typescript
* https://github.com/typescript-eslint/typescript-eslint/blob/master/docs/getting-started/linting/README.md
* https://github.com/typescript-eslint/typescript-eslint

## CICD

The [buildspec.yml](../../buildspec.yml) file defines a [codebuild](https://aws.amazon.com/codebuild/) pipeline that builds and tests code committed to the github repository.

## npm publish

Before publishing a new version - be sure to update both the [package version](../../package.json) and the [release notes](../reference/releaseNotes.md).

The [codebuild](https://aws.amazon.com/codebuild/) integration (more details [here](https://github.com/frickjack/misc-stuff/blob/master/Notes/explanation/codeBuildCICD.md)) publishes the npm module with a `cicd` tag.  The CICD integration requires that the git tag matches the module version in `package.json`.  Furthermore, we require that all git tags be applied to the `master` branch - which is our `release` branch in our simplified [gitflow](https://datasift.github.io/gitflow/IntroducingGitFlow.html)
branching strategy.
```
(
  version="$(jq -r .version < package.json)"
  git tag -a "$version" -m "release details in Notes/reference/releaseNotes.md#$version"
  git push origin $version
)
```

After a module version has been published with the `cicd` tag, we must manually apply the `latest` tag to make the new version the new default for consumers:
```
(
  version="$(jq -r .version < package.json)"
  packname="$(jq -r .name < package.json)"
  npm dist-tag add "${packname}@$version" latest
)
```
