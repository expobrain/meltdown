'use strict';

var _     = require('lodash'),
    fs    = require('fs'),
    debug = require('debug')('loadRequire'),

    utils = require('../utils');


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
            debugger;
            requireName = node.init.arguments[0].value;

            if (requireName.match(/^\.\//)) {
                debug('Importing file ' + requireName);

                requireFrame = parseFn(fs.readFileSync(requireName));

                // Inline export
                node.init = requireFrame.exports;
            } else {
                debug('require("' + requireName + '") not a file, skipping...');
            }
        }
    });

    return frame;
};
