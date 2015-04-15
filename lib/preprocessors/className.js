'use strict';

var utils = require('../utils');


module.exports = function (frame) {
    utils.traverseTree(frame.ast, function (node) {
        if (node.type === 'JSXAttribute' && node.name.name === "className") {
            node.name.name = "class";
        }
    });

    return frame;
};
