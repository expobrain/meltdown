'use strict';

var _     = require('lodash'),
    fs    = require('fs'),
    debug = require('debug')('loadRequire'),

    utils = require('../utils'),

    EXTENSIONS = ['', '.jsx', '.js'];


function loadRequire(filename) {
    debugger;
    for (var i = 0; i < EXTENSIONS.length; i++) {
        try {
            return fs.readFileSync(filename + EXTENSIONS[i]);
        }
        catch (e) {
            continue;
        }
    }

    throw "Cannot read file " + filename;
}


module.exports = function (frame, parseFn) {
    utils.traverseTree(frame.ast, function (node) {
        var requireFrame,
            requireName,
            isRequire = (
                node.type === "VariableDeclarator" &&

                node.init.type === "CallExpression" &&

                node.init.callee.type === "Identifier" &&
                node.init.callee.name === "require"
            );

        if (isRequire) {
            // Load external file
            requireName = node.init.arguments[0].value;

            if (requireName.match(/^\.{0,2}\//)) {
                debug('Importing file ' + requireName);

                requireFrame = parseFn(loadRequire(requireName));

                // Inline export
                node.init = requireFrame.exports;
            } else {
                debug('require("' + requireName + '") not a file, skipping...');
            }
        }
    });

    return frame;
};
