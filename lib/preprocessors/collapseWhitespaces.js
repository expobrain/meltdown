'use strict';

var _     = require('lodash'),
    debug = require('debug')('collapseWhitespaces'),

    utils = require('../utils');


module.exports = function (frame) {
    utils.traverseTree(frame.ast, function (node) {
        if (node.type === "JSXElement") {
            _.forEach(node.children, function (child) {
                if (child.type === "Literal" && child.value.match(/^\s+/)) {
                    child.raw = child.value = ' ';
                }
            });
        }
    });

    return frame;
};
