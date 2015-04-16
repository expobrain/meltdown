'use strict';

var _ 		= require('lodash'),
	esprima = require('esprima-fb'),
    fs      = require('fs'),
    path    = require('path'),
    debug   = require('debug')('parser'),

    utils               = require('./utils'),
    filterModuleExports = require('./preprocessors/filterModuleExports'),
    filterSymbols       = require('./preprocessors/filterSymbols'),
    inlineComponents    = require('./preprocessors/inlineComponents'),
    anonymousFunctions  = require('./preprocessors/anonymousFunctions'),
    className           = require('./preprocessors/className'),

    EXTENSIONS = ['', '.js', '.jsx'],

    _externalsCache = {};


function loadExternals(options) {
    var content,
        frame,
        filename;

    // Resolve full path based on given relative path
    // if module name starts with a absolute or relative path
    if (options.moduleName.match(/^\.{0,2}\//)) {
        filename = path.resolve(options.relativePath, options.moduleName);
    } else {
        filename = require.resolve(options.moduleName);
    }

    // Check in the cache if file is already parsed
    if (_externalsCache[filename]) {
        debug('Loaded cached ' + filename);
        return _externalsCache[filename];
    }

    // Load file's content
    for (var i = 0; i < EXTENSIONS.length; i++) {
        try {
            content = fs.readFileSync(filename + EXTENSIONS[i]);
        }
        catch (e) {
            continue
        }

        // Return frame
        debug('Loaded file ' + filename);

        frame = _externalsCache[filename] = parse(content, filename);

        return frame;
    }

    throw new Error("Cannot read file " + filename);
}


function inlineImports(frame) {
    debug('Inlining imports in ' + frame.filename);

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
            externalFrame = inlineImports(
                loadExternals({
                    moduleName: externalModule,
                    relativePath: relativePath
                })
            );

            // Throw exception if module.exports is undefined
            if (_.isUndefined(externalFrame.exports)) {
                // External file doesn't have a `module.exports` definition or is not explicit,
                // inline the whole AST
                debug('File ' + externalModule + ' module.exports is undefined or hidden. Skipping...');
            } else {
                // Inline `module.exports`
                node = utils.copyNode(externalFrame.exports, node);
            }
        }
    });

    return frame;
}


function parse(data, filename) {
    // Parse code and load symbols and exports
    var frame = {
            ast: esprima.parse(data),
            symbols: undefined,
            exports: undefined,
            filename: filename
        },
        preprocessors = [
            filterSymbols,
            filterModuleExports,
            inlineComponents,
            anonymousFunctions,
            className,
        ];

    // Load external files with require()
    frame = inlineImports(frame, parse);

    // ...continue with pre-processing
    _.forEach(preprocessors, function (preprocessor) {
        frame = preprocessor(frame);
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
