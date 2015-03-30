'use strict';

var _ = require('lodash');
    var debug = require('debug')('filterModuleExports');


module.exports.process = function (ast) {
    // Raise exception if root node is not Program
    if (!ast || ast.type !== 'Program') {
        throw "Root node " + ast.type + " is not <Program>";
    }

    var exports = _.chain(ast.body)
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

    debug(exports);

    return exports;
};
