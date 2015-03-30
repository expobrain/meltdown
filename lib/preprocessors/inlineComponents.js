'use strict';

var _         = require('lodash'),
    debug     = require('debug')('inlineComponents'),

    utils = require('../utils');


function inlineComponent(node, frame) {
    // Load component form symbols
    var componentName = node.openingElement.name.name,
        component = frame.symbols[componentName];

    // Extract AST from component to inline
    component = utils.findNode([component], function (node) {
        return node.type === 'JSXElement';
    });

    debug('Inlining ' + componentName + '...');

    // Inline component into current node
    node.openingElement.name.name = component.openingElement.name.name;
    node.closingElement.name.name = component.openingElement.name.name;
}


function findInlines(node, frame) {
    utils.traverseTree([node], function (node) {
        // Check if needs inline
        var component,
            componentName,
            needInline = node.type === 'JSXElement' &&
                node.openingElement.type === 'JSXOpeningElement' &&
                node.openingElement.name.type === 'JSXIdentifier' &&
                _.has(frame.symbols, node.openingElement.name.name);

        if (needInline) {
            inlineComponent(node, frame);
        }
    });
}


module.exports.process = function (frame) {
    // Raise exception if root node is not Program
    if (!frame.ast || frame.ast.type !== 'Program') {
        throw "inlineComponents: Root node is not <Program>";
    }

    debug(frame)
    _.forEach(frame.exports, function (moduleExport) {
        var node = frame.symbols[moduleExport.symbol];

        findInlines(node, frame);
    });

    return frame;
};
