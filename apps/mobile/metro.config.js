// Metro in an npm workspace. Packages are hoisted to the repo root, and the app
// imports shared code and the web copy from outside this folder, so Metro has
// to watch the whole repo and look in both node_modules folders.

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '../..');
const sharedSrc = path.join(repoRoot, 'packages', 'shared', 'src');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [repoRoot];
config.resolver.nodeModulesPaths = [path.join(projectRoot, 'node_modules'), path.join(repoRoot, 'node_modules')];

// Use @openseat/shared from source, like the web build, so it needs no build
// step. Its files import each other as './x.js', which means './x.ts'.
const resolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@openseat/shared') {
    return { type: 'sourceFile', filePath: path.join(sharedSrc, 'index.ts') };
  }
  if (context.originModulePath.startsWith(sharedSrc) && moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    return { type: 'sourceFile', filePath: path.resolve(path.dirname(context.originModulePath), moduleName.replace(/\.js$/, '.ts')) };
  }
  return (resolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
