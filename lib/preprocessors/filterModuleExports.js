'use strict';

var _     = require('lodash'),
    debug = require('debug')('filterModuleExports'),

    stringify = require('../stringify'),
    utils     = require('../utils');


module.exports = function (frame) {
    var node = utils.findNode(frame.ast, function (node) {
        return node.type === 'Program';
    });

    frame.exports = undefined;

    if (node) {
        frame.exports = _.chain(node.body)
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
            .reduce(function (result, node) {
                return frame.symbols[node.expression.right.name];
            }, undefined)
            .value();
    }

    debug(frame.exports);

    return frame;
};
