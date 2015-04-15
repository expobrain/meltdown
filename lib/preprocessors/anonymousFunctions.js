'use strict';

var utils = require('../utils');


module.exports = function (frame) {
    utils.traverseTree(frame.ast, function (node) {
        if (node.type === 'FunctionExpression' && !node.id) {
            node.type = 'ArrowFunctionExpression';
            delete node.returnType;
            delete node.typeParameters;
        }
    });

    return frame;
};
