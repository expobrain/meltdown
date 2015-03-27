'use strict';

var _ = require('lodash');


module.exports.process = function (ast) {
    // Raise exception if root node is not Program
    if (!ast || ast.type !== 'Program') {
        throw "Root node is not <Program>";
    }

    return _(ast.body)
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
                exports: node.expression.left.property.name,
                symbol: node.expression.right.name
            };
        })
        .value();
};
