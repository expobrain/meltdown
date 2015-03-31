'use strict';

var _     = require('lodash'),
    debug = require('debug')('filterModuleExports'),

    stringify = require('../stringify'),
    utils     = require('../utils');


module.exports = function (frame) {
    var node = utils.findNode(frame.ast, function (node) {
        return node.type === 'Program';
    });

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
            .map(function (node) {
                return node.expression.right.name;
            })
            .value();
    } else {
        frame.exports = [];
    }

    debug(frame.exports);

    return frame;
};
