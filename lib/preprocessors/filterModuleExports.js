'use strict';

var _     = require('lodash'),
    debug = require('debug')('filterModuleExports'),

    stringify = require('../stringify');


module.exports = function (frame) {
    // Raise exception if root node is not Program
    if (!frame.ast || frame.ast.type !== 'Program') {
        throw "Root node is not <Program>";
    }

    frame.exports = _.chain(frame.ast.body)
        .filter(function (node) {
            return node.type === 'ExpressionStatement' &&
                node.expression.type === 'AssignmentExpression' &&
                node.expression.operator === '=' &&

                node.expression.left.type === 'MemberExpression' &&

                node.expression.left.object.type === 'Identifier' &&
                node.expression.left.object.name === 'module' &&

                node.expression.left.property.type === 'Identifier' &&
                node.expression.left.property.name === 'exports' &&

                node.expression.right.type === 'Identifier';
        })
        .map(function (node) {
            return node.expression.right.name;
        })
        .value();

    debug(frame.exports);

    return frame;
};
