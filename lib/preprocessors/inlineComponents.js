'use strict';

var _     = require('lodash'),
    debug = require('debug')('inlineComponents'),

    utils = require('../utils');


module.exports.process = function (frame) {
    // Raise exception if root node is not Program
    if (!frame.ast || frame.ast.type !== 'Program') {
        throw "inlineComponents: Root node is not <Program>";
    }

    utils.traverseTree(frame.ast.body, function (node) {
        // Check if needs inline
        var component,
            componentName,
            needInline = node.type === 'JSXElement' &&
                node.openingElement.type === 'JSXOpeningElement' &&
                node.openingElement.name.type === 'JSXIdentifier' &&
                _.has(frame.symbols, node.openingElement.name.name);

        if (needInline) {
            // Load component form symbols
            componentName = node.openingElement.name.name;
            component = frame.symbols[componentName];

            // Extract AST from component to inline
            component = utils.findNode([component], function (node) {
                return node.type === 'JSXElement';
            });

            debug('Inlining ' + componentName + '...');

            // Copy component into current node
            _.assign(node, component);
        }
    });

    return frame;
};
