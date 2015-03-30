'use strict';

var _ = require('lodash');
    var debug = require('debug')('filterModuleExports');


module.exports.process = function (frame) {
    // Raise exception if root node is not Program
    if (!frame.ast || frame.ast.type !== 'Program') {
        throw "Root node is not <Program>";
    }

    frame.exports = _.chain(frame.ast.body)
        .filter(function (node) {
            return node.type === 'ExpressionStatement' &&
                node.expression.type === 'AssignmentExpression' &&

                node.expression.left.type === 'MemberExpression' &&

                node.expression.left.object.type === 'MemberExpression' &&

                node.expression.left.object.object.type === 'Identifier' &&
                node.expression.left.object.object.name === 'module' &&

                node.expression.left.object.property.type === 'Identifier' &&
                node.expression.left.object.property.name === 'exports' &&

                node.expression.right.type === 'Identifier';
        })
        .map(function (node) {
            return {
                name: node.expression.left.property.name,
                symbol: node.expression.right.name
            };
        })
        .value();

    debug(frame.exports);

    return frame;
};
