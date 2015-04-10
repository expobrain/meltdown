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

    EXTENSIONS = ['', '.jsx', '.js'];


function loadExternals(options) {
    var filename,
        content,
        frame,
        baseFilename = path.resolve(options.relativePath, options.filename);

    for (var i = 0; i < EXTENSIONS.length; i++) {
        filename = baseFilename + EXTENSIONS[i];

        try {
            content = fs.readFileSync(filename);
        }
        catch (e) {
            continue;
        }

        return parse(content, filename);
    }

    throw new Error("Cannot read file " + baseFilename);
}


function inlineImports(frame) {
    utils.traverseTree(frame.ast, function (node) {
        var externalFrame,
            externalFilename,
            relativePath,
            isExternal;

        if (!node){debugger}
        isExternal = (
            node.type === "VariableDeclarator" &&

            node.init.type === "CallExpression" &&

            node.init.callee.type === "Identifier" &&
            node.init.callee.name === "require"
        );

        if (isExternal) {
            // Load external file
            externalFilename = node.init.arguments[0].value;

            if (externalFilename.match(/^\.{0,2}\//)) {
                debug('Importing file ' + externalFilename);

                // Resolving current frame's relative path
                if (frame.filename) {
                    relativePath = path.dirname(frame.filename);
                } else {
                    relativePath = process.cwd();
                }

                // Load external imports recursively
                externalFrame = inlineImports(
                    loadExternals({
                        filename: externalFilename,
                        relativePath: relativePath
                    })
                );

                // Throw exception if module.exports is undefined
                if (_.isUndefined(externalFrame.exports)) {
                    throw new Error(
                        'File ' + externalFilename + ' module.exports is undefined'
                    );
                }

                // Inline externals
                node.init = externalFrame.exports;
            } else {
                debug('require("' + externalFilename + '") not a file, skipping...');
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
            inlineComponents
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
