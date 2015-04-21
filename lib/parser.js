'use strict';

var _ 		= require('lodash'),
	esprima = require('esprima-fb'),
    fs      = require('fs'),
    path    = require('path'),
    debug   = require('debug')('parser'),
    Info    = require('module-info'),

    utils               = require('./utils'),
    filterModuleExports = require('./preprocessors/filterModuleExports'),
    filterSymbols       = require('./preprocessors/filterSymbols'),
    inlineComponents    = require('./preprocessors/inlineComponents'),
    anonymousFunctions  = require('./preprocessors/anonymousFunctions'),
    className           = require('./preprocessors/className'),

    EXTENSIONS = ['', '.js', '.jsx', '/index.js', '/index.jsx'],

    _externalsCache = {};


function loadExternals(moduleName, nodePath, relativePath, options) {
    var content,
        frame,
        info,
        externalNodePath = nodePath,
        filename,
        fullFilename;

    // Resolve module's full path based
    if (moduleName.match(/^\.{0,2}\//)) {
        // if module name starts with a relative path
        filename = path.resolve(relativePath, moduleName);
        info = Info.fromFile(filename);

    } else if (moduleName.indexOf('/') > -1) {
        // It's a peer dependency http://blog.nodejs.org/2013/02/07/peer-dependencies/
        if (nodePath.indexOf('node_modules') > -1) {
            filename = path.resolve(nodePath, '..');
        } else {
            filename = path.join(nodePath, 'node_modules');
        }

        filename = path.join(filename, moduleName);

        info = Info.fromFile(filename);

    } else {
        // Resolve module name relative to the parent's package base dir
        module.paths.unshift(path.join(nodePath, 'node_modules'));

        // Check first if the package exists
        filename = require.resolve(moduleName);

        // Returns if the package is a built-in aka the package's name
        // doesn't start with a slash (/)
        if (filename[0] !== '/') {
            return {};
        }

        // Get the module's info
        try {
            info = Info.fromName(module, moduleName);
        } catch (e) {
            // pass
        }

        module.paths.shift();

        // Module exists and it's not a built-in module, get its real filename
        filename = info.getMainFile();
    }

    // Check in the cache if file is already parsed
    frame = _externalsCache[filename];

    if (frame) {
        debug('Loaded cached ' + filename);
        return frame;
    }

    // Load file's content
    for (var i = 0; i < EXTENSIONS.length; i++) {
        try {
            fullFilename = filename + EXTENSIONS[i];
            content = fs.readFileSync(fullFilename);
        }
        catch (e) {
            continue;
        }

        externalNodePath = info.getPath();

        // Return frame
        debug('Loaded file ' + filename);

        frame = _externalsCache[filename] = parse(
            content, fullFilename, externalNodePath, options
        );

        // Store frame into cache and return
        return frame;
    }

    throw new Error("Cannot read file " + filename);
}


function inlineImports(frame, options) {
    debug('Inlining imports in ' + frame.filename);

    // Traverse tree and look for require()s
    utils.traverseTree(frame.ast, function (node) {
        var externalFrame,
            externalModule,
            relativePath,
            isExternal;

        isExternal = (
            node.type === "CallExpression" &&

            node.callee.type === "Identifier" &&
            node.callee.name === "require"
        );

        if (isExternal) {
            // Load external file
            externalModule = node.arguments[0].value;

            // Resolving current frame's relative path
            if (frame.filename) {
                relativePath = path.dirname(frame.filename);
            } else {
                relativePath = process.cwd();
            }

            // Load external imports recursively
            externalFrame = loadExternals(
                externalModule, frame.nodePath, relativePath, options
            );

            if (externalFrame) {
                // Module is resolved and not a builtin
                externalFrame = inlineImports(externalFrame);

                // Throw exception if module.exports is undefined
                if (_.isUndefined(externalFrame.exports)) {
                    // External file doesn't have a `module.exports` definition
                    // or is not explicit, inline the whole AST
                    debug(
                        'File ' +
                        externalModule +
                        ' module.exports is undefined or hidden. Skipping...'
                    );
                } else {
                    // Inline `module.exports`
                    node = utils.copyNode(externalFrame.exports, node);
                }
            }
        }
    });

    return frame;
}


function parse(data, filename, nodePath, options) {
    // Parse code and load symbols and exports
    var frame = {
            ast: esprima.parse(data),
            symbols: undefined,
            exports: undefined,
            filename: filename,
            nodePath: nodePath || process.cwd()
        },
        preprocessors = [
            filterSymbols,
            filterModuleExports,
            inlineComponents,
            anonymousFunctions,
            className,
        ];

    // Ensure options is an object
    options = options || {};

    // Load external files with require()
    frame = inlineImports(frame, options);

    // ...continue with pre-processing
    _.forEach(preprocessors, function (preprocessor) {
        frame = preprocessor(frame, options);
    });

    // Return frame
    return frame;
}


module.exports = {
    filterModuleExports: filterModuleExports,
    filterSymbols: filterSymbols,
    inlineComponents: inlineComponents,
    parse: parse
};
